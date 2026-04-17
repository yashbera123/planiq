"""
PlanIQ — Enhanced Flask Backend v4.0
======================================
ORIGINAL endpoints (unchanged behaviour):
  GET  /health
  GET  /model-info
  GET  /plans
  POST /predict
  POST /feedback
  POST /retrain

NEW endpoints (v4):
  POST /recommend   — top-3 plans + full XAI + persona + cost analysis
  POST /compare     — all-plans comparison matrix + operator matches
  POST /insights    — cost optimisation deep-dive + action items
  GET  /history     — last N recommendation sessions
  GET  /plan-profiles — real Airtel/Jio/Vi plan catalog
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle, json, numpy as np, pandas as pd, threading
from pathlib import Path
from datetime import datetime

app = Flask(__name__)
CORS(app)

BASE = Path(__file__).parent

# ── Load artifacts ─────────────────────────────────────────────────────
model = None
scaler = None
features = []
feat_imp = {}

def load_model():
    global model, scaler, features, feat_imp
    if model is None:
        try:
            print("🔄 Loading ML model...")
            model = pickle.load(open(BASE / "model.pkl", "rb"))
            scaler = pickle.load(open(BASE / "scaler.pkl", "rb"))
            features = json.load(open(BASE / "features.json"))
            feat_imp = json.load(open(BASE / "feature_importance.json"))
            print("✅ Model loaded successfully")
        except Exception as e:
            print("❌ Model load failed:", e)
            model = None

# ── Load telecom full dataset (SINGLE source of truth) ──────────────────
_ds_path = BASE / "telecom_plans_full_dataset.json"

dataset_loaded = False

try:
    if _ds_path.exists():
        _raw_dataset = json.load(open(_ds_path))
        dataset_loaded = True
        print(f"✅ Dataset loaded: {len(_raw_dataset)} plans")
    else:
        print("⚠️ Dataset file not found")
        _raw_dataset = []
except Exception as e:
    print("❌ Dataset load failed:", e)
    _raw_dataset = []
# Enrich each plan with computed fields
TELECOM_DATASET = []
for i, p in enumerate(_raw_dataset):
    data_gb = round(p.get("data_per_day", 1) * p.get("validity_days", 28), 1)
    provider = p.get("provider", "Unknown")
    plan_name = f"{provider} ₹{p['price']} ({p.get('data_per_day',1)}GB/day)"
    TELECOM_DATASET.append({
        **p,
        "id":           f"ds_{i}",
        "name":         plan_name,
        "operator":     provider,
        "data_gb":      data_gb,
        "data_per_day": p.get("data_per_day", 1),
        "validity":     p.get("validity_days", 28),
        "validity_days":p.get("validity_days", 28),
        "network":      "5G" if provider.lower() == "jio" else "4G/5G",
        "cost_per_gb":  round(p["price"] / max(data_gb, 0.1), 1),
        "calls":        p.get("calls", "Unlimited"),
        "sms_per_day":  p.get("sms_per_day", 100),
        "benefits":     p.get("benefits", []),
    })

# ── Derive ML tier plans from dataset (6 tiers by price buckets) ────────
def _build_tier_plans(dataset):
    """Group dataset plans into 6 price tiers (0=cheapest .. 5=most expensive)."""
    if not dataset:
        return {str(i): {"name": f"Tier {i}", "price": 0, "data_gb": 0,
                         "calls_min": 0, "validity": 28, "sms": 0,
                         "tag": "Empty", "network": "4G"} for i in range(6)}

    sorted_plans = sorted(dataset, key=lambda x: x["price"])
    n = len(sorted_plans)
    tier_tags = ["Starter", "Popular", "Value", "Best Value", "Premium", "Enterprise"]
    tiers = {}
    for tier_idx in range(6):
        start = tier_idx * n // 6
        end   = (tier_idx + 1) * n // 6
        bucket = sorted_plans[start:end] if start < end else [sorted_plans[-1]]
        # Pick median plan as representative
        rep = bucket[len(bucket) // 2]
        tiers[str(tier_idx)] = {
            "name":      f"{rep['operator']} ₹{rep['price']}",
            "price":     rep["price"],
            "data_gb":   rep.get("data_gb", 0),
            "calls_min": 0,   # all plans are unlimited calling
            "validity":  rep.get("validity", 28),
            "sms":       rep.get("sms_per_day", 100),
            "tag":       tier_tags[tier_idx],
            "network":   rep.get("network", "4G/5G"),
        }
    return tiers

plans = _build_tier_plans(TELECOM_DATASET)

# ── Derive operator catalog from dataset ────────────────────────────────
def _build_operator_catalog(dataset):
    """Group plans by provider for the /plan-profiles endpoint."""
    catalog = {}
    for p in dataset:
        provider = p.get("operator", p.get("provider", "Unknown"))
        key = provider.lower()
        if key not in catalog:
            catalog[key] = []
        catalog[key].append({
            "id":       p.get("id", f"{key}_{len(catalog[key])}"),
            "operator": provider,
            "name":     p.get("name", f"{provider} ₹{p['price']}"),
            "price":    p["price"],
            "data_gb":  p.get("data_gb", 0),
            "data_per_day": p.get("data_per_day", 0),
            "calls":    p.get("calls", "Unlimited"),
            "validity": p.get("validity", p.get("validity_days", 28)),
            "network":  p.get("network", "4G/5G"),
            "benefits": p.get("benefits", []),
            "cost_per_gb": p.get("cost_per_gb", 0),
        })
    # Sort each operator's plans by price
    for key in catalog:
        catalog[key].sort(key=lambda x: x["price"])
    return catalog

REAL_PLANS = _build_operator_catalog(TELECOM_DATASET)

def _load_version():
    p = BASE / "model_version.json"
    return json.load(open(p)) if p.exists() else {
        "version": "2.0", "accuracy": 0.0,
        "algorithm": "GradientBoostingClassifier", "trained_at": "unknown",
    }

model_version  = _load_version()
FEEDBACK_LOG   = BASE / "feedback_log.jsonl"
HISTORY_LOG    = BASE / "history_log.jsonl"
RETRAIN_THRESH = 50
_retrain_lock  = threading.Lock()

# ══════════════════════════════════════════════════════════════════════
#  FEATURE LABELS (for XAI display)
# ══════════════════════════════════════════════════════════════════════
FEATURE_LABELS = {
    "data_score":         "Data Usage Intensity",
    "call_score":         "Call Volume",
    "value_score":        "Spend vs Peers",
    "monthly_charges":    "Monthly Charge",
    "num_services":       "Active Services",
    "tenure":             "Tenure (Loyalty)",
    "total_charges":      "Lifetime Spend",
    "has_streaming":      "Streaming Flag",
    "has_tech_support":   "Tech Support",
    "has_online_security":"Online Security",
    "contract_score":     "Contract Type",
    "payment_score":      "Payment Method",
    "is_senior":          "Senior Citizen",
    "churn_risk":         "Churn Risk",
}

DEFAULTS = {
    "tenure": 18.0, "monthly_charges": 349.0, "total_charges": 6282.0,
    "has_tech_support": 0.0, "has_online_security": 0.0, "has_streaming": 1.0,
    "contract_score": 0.0, "payment_score": 1.0,
    "data_score": 0.45, "call_score": 0.35, "value_score": 0.40,
    "is_senior": 0.0, "num_services": 3.0, "churn_risk": 0.0,
}

# ── Core helpers ───────────────────────────────────────────────────────

def _build_row(body):
    row = {}
    for f in features:
        try:
            v = float(body.get(f, DEFAULTS.get(f, 0.0)))
        except (TypeError, ValueError):
            v = float(DEFAULTS.get(f, 0.0))
        if f in ("data_score", "call_score", "value_score"):
            v = max(0.0, min(1.0, v))
        elif f in ("has_tech_support","has_online_security","has_streaming","is_senior","churn_risk"):
            v = 1.0 if v > 0.5 else 0.0
        elif f == "contract_score": v = max(0.0, min(2.0, v))
        elif f == "payment_score":  v = max(0.0, min(3.0, v))
        elif f == "tenure":         v = max(1.0, min(72.0, v))
        elif f == "num_services":   v = max(0.0, min(9.0, v))
        row[f] = v
    return row

def _run_model(row):
    load_model()

    if model is None or scaler is None:
        raise Exception("Model not available")

    df = pd.DataFrame([row], columns=features)
    Xs = scaler.transform(df)
    pid = str(model.predict(Xs)[0])
    proba = model.predict_proba(Xs)[0]
    return pid, proba, Xs

def fallback_plan():
    return {
        "plan_id": "1",
        "name": "Fallback Plan",
        "price": 199,
        "data_gb": 28,
        "confidence": 50,
        "reason": "Fallback recommendation (ML unavailable)"
    }

def _compute_xai(row, Xs):
    vals   = Xs[0]
    total  = 0.0
    items  = []
    for i, f in enumerate(features):
        w = abs(float(vals[i])) * float(feat_imp.get(f, 0.0))
        items.append({"feature": f, "label": FEATURE_LABELS.get(f, f),
                      "importance_pct": round(float(feat_imp.get(f, 0.0)) * 100, 2),
                      "raw_value": round(row[f], 4), "weighted": w})
        total += w
    for it in items:
        it["contribution_pct"] = round(it["weighted"] / total * 100, 1) if total > 0 else 0.0
    return sorted(items, key=lambda x: x["contribution_pct"], reverse=True)[:6]

def _detect_persona(row):
    ds, cs, mc, svc, strm = (row["data_score"], row["call_score"],
                              row["monthly_charges"], row["num_services"],
                              row["has_streaming"])
    if ds > 0.7 and strm:
        return {"id":"streamer","name":"Streaming Enthusiast","icon":"📺","color":"#7C3AED",
                "description":"Heavy data user prioritising OTT content. Needs high data caps and bundled streaming."}
    if ds > 0.6 and cs < 0.4:
        return {"id":"data_heavy","name":"Heavy Data User","icon":"📶","color":"#4F46E5",
                "description":"Power data consumer who scrolls, downloads, and hotspots heavily."}
    if cs > 0.6 and ds < 0.4:
        return {"id":"caller","name":"Power Caller","icon":"📞","color":"#06B6D4",
                "description":"Call-heavy user with moderate data needs. Unlimited calling saves the most."}
    if mc < 200 and svc <= 2:
        return {"id":"budget","name":"Budget User","icon":"💰","color":"#10B981",
                "description":"Cost-conscious user wanting basic connectivity at the lowest price."}
    if svc >= 6 and mc > 400:
        return {"id":"enterprise","name":"Business / Power User","icon":"🏢","color":"#F59E0B",
                "description":"Multi-service professional needing reliability, high data, and premium perks."}
    return {"id":"regular","name":"Regular User","icon":"📱","color":"#8B8BAB",
            "description":"Balanced usage across data, calls, and services. Mid-tier plans offer best value."}

def _overpay(mc, plan_price):
    d = mc - plan_price
    if d > 100:
        return {"overpaying":True,"underpaying":False,"amount":round(d,2),"annual_savings":round(d*12,2),"gap":0}
    if d < -50:
        return {"overpaying":False,"underpaying":True,"amount":0,"annual_savings":0,"gap":round(-d,2)}
    return {"overpaying":False,"underpaying":False,"amount":0,"annual_savings":0,"gap":0}

def _all_plans_ranked(proba, row):
    mc = row["monthly_charges"]
    out = []
    for pid, p in plans.items():
        idx = int(pid)
        score = round(float(proba[idx]) * 100, 1) if idx < len(proba) else 0.0
        diff  = mc - p["price"]
        data_gb_val = p["data_gb"] if isinstance(p["data_gb"], (int, float)) else 50
        out.append({
            **p, "plan_id": pid, "match_score": score, "recommended": False,
            "monthly_savings": round(diff, 2),
            "annual_savings": round(max(0, diff) * 12, 2),
            "overpaying": diff > 100,
            "cost_per_gb": round(p["price"] / max(data_gb_val, 1), 1),
        })
    out.sort(key=lambda x: x["match_score"], reverse=True)
    if out: out[0]["recommended"] = True
    return out

PLAN_REASONS = {
    "0":"Your light data and call usage places you firmly in the entry-level segment. This plan covers your needs without charging for capacity you'll never use.",
    "1":"Your moderate usage profile matches this tier — 3 GB and 300 minutes at a price that matches what you actually consume.",
    "2":"Consistent data consumption and reasonable call volume fit this plan's 6 GB allowance without overpaying.",
    "3":"Above-average call score and value signals indicate a heavy regular user. The 56-day validity eliminates monthly renewal hassle.",
    "4":"High data intensity and multi-service profile puts you in the power-user tier. Best cost-per-GB at your consumption level.",
    "5":"Your metrics across all dimensions match enterprise-grade consumption. Eliminates all caps with 50 GB and 5000 call minutes.",
}

PLAN_TIPS = {
    "0":["Use Wi-Fi calling (WhatsApp/Signal) to preserve your 100-minute allowance.",
         "Download maps and music offline at home to stretch 1 GB.",
         "Enable data compression in Chrome to cut mobile data ~30%."],
    "1":["Stream at 480p instead of HD — cuts data use by over 50%.",
         "Set auto-sync to Wi-Fi-only for all background apps.",
         "Set a data alert at 2.5 GB to stay within your 3 GB plan."],
    "2":["Bundle with a family add-on for up to 15% savings.",
         "Schedule large downloads overnight — speeds are faster off-peak.",
         "Disable background app refresh for apps you open rarely."],
    "3":["56-day validity saves ₹50–100/month vs two monthly renewals.",
         "Audit your top 3 data-hungry apps and set per-app limits.",
         "Use Chrome Lite Mode to compress pages and reduce data ~30%."],
    "4":["A Wi-Fi 6 router offsets 40–50% of mobile data at no extra cost.",
         "Use call allowance for conference calls instead of VoIP to save data.",
         "Consider home broadband + Pro Max — often cheaper combined."],
    "5":["Enterprise plans qualify for GST input tax credit — check with finance.",
         "Evaluate individual SIMs vs shared data pool for your team.",
         "Negotiate a custom SLA and pricing tier directly with the carrier."],
}

def _make_reason(pid, row, xai):
    base    = PLAN_REASONS.get(pid, "This plan best matches your overall usage profile.")
    drivers = [c["label"] for c in xai[:2]]
    tenure  = int(row.get("tenure", 0))
    suffix  = (f" Your {tenure}-month tenure also qualifies you for loyalty-based long-validity plans."
               if tenure > 30 else "")
    note    = f" Key drivers: {drivers[0]} and {drivers[1]}." if len(drivers) >= 2 else ""
    return base + note + suffix

def _persona_fit(persona_id, plan_id):
    m = {
        "streamer":   {"0":"Poor","1":"Fair","2":"Good","3":"Excellent","4":"Excellent","5":"Excellent"},
        "data_heavy": {"0":"Poor","1":"Fair","2":"Good","3":"Good","4":"Excellent","5":"Excellent"},
        "caller":     {"0":"Poor","1":"Good","2":"Good","3":"Excellent","4":"Excellent","5":"Excellent"},
        "budget":     {"0":"Excellent","1":"Good","2":"Fair","3":"Poor","4":"Poor","5":"Poor"},
        "enterprise": {"0":"Poor","1":"Poor","2":"Fair","3":"Good","4":"Excellent","5":"Excellent"},
        "regular":    {"0":"Fair","1":"Good","2":"Excellent","3":"Good","4":"Fair","5":"Poor"},
    }
    return m.get(persona_id, {}).get(str(plan_id), "Fair")

def _switch_message(mc, rec_price):
    d = mc - rec_price
    if d > 100:  return f"You're overspending by ₹{d:.0f}/month. Switching saves ₹{d*12:.0f}/year."
    if d < -50:  return f"Your current plan is ₹{-d:.0f}/month cheaper but may not cover your usage."
    return "Your current spend is well-aligned with the recommended plan."

def _action_items(pid, row, diff):
    items = []
    if diff > 100:
        items.append({"priority":"HIGH","action":f"Switch to {plans[pid]['name']}","saving":f"₹{diff:.0f}/mo"})
    if row["has_streaming"] == 0 and int(pid) >= 2:
        items.append({"priority":"MEDIUM","action":"Enable streaming — bundled OTT saves ₹149–299/month","saving":"₹149–299/mo"})
    if row["contract_score"] == 0 and int(pid) >= 3:
        items.append({"priority":"MEDIUM","action":"Switch to annual plan — 15–20% cheaper long-term","saving":"~20%"})
    if row["num_services"] <= 2:
        items.append({"priority":"LOW","action":"Add 1–2 services to unlock bundle discounts","saving":"varies"})
    if not items:
        items.append({"priority":"LOW","action":"Your plan and usage are well-optimised. Review in 3 months.","saving":"₹0"})
    return items

def _log_history(entry):
    with open(HISTORY_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")

def _read_history(limit=20):
    if not HISTORY_LOG.exists(): return []
    lines   = HISTORY_LOG.read_text().strip().split("\n")
    entries = []
    for l in reversed(lines[-100:]):
        try:
            entries.append(json.loads(l))
        except Exception:
            pass
        if len(entries) >= limit:
            break
    return entries

def _count_feedback():
    if not FEEDBACK_LOG.exists(): return 0
    with open(FEEDBACK_LOG) as f:
        return sum(1 for _ in f)

def _trigger_retrain():
    def _job():
        with _retrain_lock:
            try:
                import subprocess, sys
                subprocess.run([sys.executable, str(BASE.parent/"ml"/"train_model.py")], check=True)
                global model, scaler, features, feat_imp, model_version
                model         = pickle.load(open(BASE/"model.pkl","rb"))
                scaler        = pickle.load(open(BASE/"scaler.pkl","rb"))
                features      = json.load(open(BASE/"features.json"))
                feat_imp      = json.load(open(BASE/"feature_importance.json"))
                model_version = _load_version()
                print("✅ Model retrained and hot-reloaded")
            except Exception as e:
                print(f"⚠️  Retrain failed: {e}")
    threading.Thread(target=_job, daemon=True).start()

# ══════════════════════════════════════════════════════════════════════
#  ROUTES — ORIGINAL (unchanged behaviour)
# ══════════════════════════════════════════════════════════════════════

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "model": model_version.get("algorithm"),
        "version": model_version.get("version"),
        "accuracy": model_version.get("accuracy"),
        "trained_at": model_version.get("trained_at"),
        "feedback_count": _count_feedback(),
        "model_loaded": model is not None,
"n_features": len(features) if features else 0,
        "v4_endpoints": ["/recommend","/compare","/insights","/history","/plan-profiles"],
    })

@app.route("/model-info")
def model_info():
    return jsonify({
        **model_version,
        "feedback_count": _count_feedback(),
        "features": features,
        "top_features": sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)[:5],
        "feature_labels": FEATURE_LABELS,
    })

@app.route("/plans")
def get_plans():
    """Return all plans from dataset, grouped by tier and with full catalog."""
    return jsonify({
        "plans": plans,
        "dataset_plans": TELECOM_DATASET,
        "dataset_count": len(TELECOM_DATASET),
        "providers": sorted(set(p.get("operator", p.get("provider", "")) for p in TELECOM_DATASET)),
    })

@app.route("/dataset-plans")
def dataset_plans():
    """Return all plans from telecom_plans_full_dataset.json with optional filters."""
    provider = request.args.get("provider", "").strip().lower()
    max_price = request.args.get("max_price", None)
    min_data = request.args.get("min_data", None)

    filtered = TELECOM_DATASET
    if provider:
        filtered = [p for p in filtered if p.get("operator","").lower() == provider
                     or p.get("provider","").lower() == provider]
    if max_price:
        filtered = [p for p in filtered if p["price"] <= float(max_price)]
    if min_data:
        filtered = [p for p in filtered if p.get("data_per_day", 0) >= float(min_data)]

    return jsonify({
        "success": True,
        "plans": filtered,
        "total": len(filtered),
        "all_providers": sorted(set(p.get("operator", p.get("provider","")) for p in TELECOM_DATASET)),
    })

@app.route("/plan-profiles")
def plan_profiles():
    """Return operator-grouped plan catalog derived from the dataset."""
    return jsonify({"operators": REAL_PLANS,
                    "total": sum(len(v) for v in REAL_PLANS.values())})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        body = request.get_json(force=True, silent=True) or {}
        row  = _build_row(body)
        try:
            pid, proba, Xs = _run_model(row)
        except Exception as e:
            print("❌ Model prediction failed:", e)
            return jsonify({
                "error": "Model unavailable",
                "fallback": fallback_plan()
            }), 503
        plan = plans[pid]
        mc   = row["monthly_charges"]
        xai  = _compute_xai(row, Xs)

        ranked  = _all_plans_ranked(proba, row)
        overpay = _overpay(mc, plan["price"])
        reason  = _make_reason(pid, row, xai)
        tips    = PLAN_TIPS.get(pid, PLAN_TIPS["2"])
        pred_id = f"pred_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        _log_history({"pred_id":pred_id,"ts":datetime.now().isoformat(),
                      "plan_id":pid,"plan_name":plan["name"],
                      "confidence":round(float(proba[int(pid)])*100,1),
                      "monthly_charges":mc})

        return jsonify({
            "success": True, "prediction_id": pred_id,
            "recommendation": {
                "plan_id": pid, **plan,
                "confidence": round(float(proba[int(pid)])*100,1),
                "reason": reason, "cost_tips": tips,
                "top_features": [{"feature":c["feature"],"importance":c["importance_pct"]/100} for c in xai[:3]],
                "overpayment_analysis": overpay,
            },
            "all_plans": ranked,
            "input_summary": {
                "data_score":      round(row["data_score"],2),
                "call_score":      round(row["call_score"],2),
                "value_score":     round(row["value_score"],2),
                "monthly_charges": mc, "tenure": int(row["tenure"]),
            },
            "model_version": model_version.get("version"),
        })
    except Exception as e:
        import traceback
        return jsonify({"error":str(e),"trace":traceback.format_exc()}), 500

@app.route("/feedback", methods=["POST"])
def feedback():
    try:
        body = request.get_json(force=True, silent=True) or {}
        entry = {
            "timestamp": datetime.now().isoformat(),
            "prediction_id": body.get("prediction_id",""),
            "predicted_plan": body.get("predicted_plan",""),
            "correct_plan":   body.get("correct_plan",""),
            "inputs": body.get("inputs",{}),
            "rating": body.get("rating",""),
        }
        with open(FEEDBACK_LOG,"a") as f:
            f.write(json.dumps(entry)+"\n")
        count   = _count_feedback()
        retrain = count >= RETRAIN_THRESH and count % RETRAIN_THRESH == 0
        if retrain: _trigger_retrain()
        return jsonify({
            "success":True,"feedback_stored":True,"total_feedback":count,
            "retrain_triggered":retrain,
            "message": ("Model retraining started." if retrain
                       else f"Thanks! Model improves after {RETRAIN_THRESH - count%RETRAIN_THRESH} more responses."),
        })
    except Exception as e:
        return jsonify({"error":str(e)}), 500

@app.route("/retrain", methods=["POST"])
def manual_retrain():
    _trigger_retrain()
    return jsonify({"success":True,"message":"Retraining started in background."})

# ══════════════════════════════════════════════════════════════════════
#  ROUTES — NEW v4
# ══════════════════════════════════════════════════════════════════════

@app.route("/recommend", methods=["POST"])
def recommend():
    """Top-3 plans + full XAI + user persona + cost analysis."""
    try:
        body = request.get_json(force=True, silent=True) or {}
        row  = _build_row(body)
        pid, proba, Xs = _run_model(row)
        mc   = row["monthly_charges"]

        ranked  = _all_plans_ranked(proba, row)
        top3    = ranked[:3]
        xai     = _compute_xai(row, Xs)
        persona = _detect_persona(row)
        overpay = _overpay(mc, plans[pid]["price"])
        pred_id = f"rec_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        enriched = []
        for i, p in enumerate(top3):
            rpid = p["plan_id"]
            enriched.append({
                **p, "rank": i+1,
                "reason":      _make_reason(rpid, row, xai),
                "tips":        PLAN_TIPS.get(rpid, PLAN_TIPS["2"]),
                "persona_fit": _persona_fit(persona["id"], rpid),
            })

        _log_history({"pred_id":pred_id,"ts":datetime.now().isoformat(),
                      "plan_id":pid,"plan_name":plans[pid]["name"],
                      "confidence":round(float(proba[int(pid)])*100,1),
                      "monthly_charges":mc,"persona":persona["id"]})

        return jsonify({
            "success":True, "prediction_id":pred_id,
            "top_recommendations": enriched,
            "best_plan_id": pid,
            "persona": persona,
            "xai": {
                "feature_contributions": xai,
                "top_driver": xai[0]["label"] if xai else "N/A",
                "explanation": (f"The model weighted '{xai[0]['label']}' most heavily "
                                f"at {xai[0]['contribution_pct']}% contribution.") if xai else "",
            },
            "cost_analysis": {
                **overpay,
                "current_spend":    mc,
                "recommended_price": plans[pid]["price"],
                "monthly_saving":   round(mc - plans[pid]["price"], 2),
                "yearly_saving":    round((mc - plans[pid]["price"]) * 12, 2),
                "switch_message":   _switch_message(mc, plans[pid]["price"]),
            },
            "all_plans_ranked": ranked,
            "model_confidence": round(float(proba[int(pid)])*100, 1),
            "model_version": model_version.get("version"),
        })
    except Exception as e:
        import traceback
        return jsonify({"error":str(e),"trace":traceback.format_exc()}), 500


@app.route("/compare", methods=["POST"])
def compare():
    """Full comparison matrix: all 6 plans vs user profile."""
    try:
        body = request.get_json(force=True, silent=True) or {}
        row  = _build_row(body)
        pid, proba, Xs = _run_model(row)
        mc      = row["monthly_charges"]
        ranked  = _all_plans_ranked(proba, row)
        persona = _detect_persona(row)

        for p in ranked:
            p["is_best_match"] = p["plan_id"] == pid
            p["usage_fit"]     = ["Light","Casual","Regular","Heavy","Power","Enterprise"][int(p["plan_id"])]
            p["persona_fit"]   = _persona_fit(persona["id"], p["plan_id"])

        return jsonify({
            "success":True, "best_match_id":pid,
            "comparison_matrix": ranked,
            "persona": persona,
            "summary": {
                "best_value": sorted(ranked, key=lambda x: x.get("value",0), reverse=True)[0]["plan_id"]
                              if ranked else pid,
                "cheapest_viable": next((p["plan_id"] for p in reversed(ranked) if p["match_score"]>=25), pid),
                "current_recommendation": pid,
            },
            "real_world_catalog": REAL_PLANS,
        })
    except Exception as e:
        import traceback
        return jsonify({"error":str(e),"trace":traceback.format_exc()}), 500


@app.route("/insights", methods=["POST"])
def insights():
    """Deep cost-optimisation: efficiency score, savings trajectory, action items."""
    try:
        body = request.get_json(force=True, silent=True) or {}
        row  = _build_row(body)
        pid, proba, Xs = _run_model(row)
        mc    = row["monthly_charges"]
        rec   = plans[pid]["price"]
        diff  = mc - rec
        xai   = _compute_xai(row, Xs)
        persona = _detect_persona(row)

        eff = max(0, min(100, round(100 - abs(diff)/max(mc,1)*100, 1)))

        trajectory = [{"month":m+1,"cumulative_savings":round(max(0,diff)*(m+1),2)}
                      for m in range(12)]

        operator_picks = {}
        rec_price = plans[pid]["price"]
        for op, op_plans in REAL_PLANS.items():
            # Find closest plan by price to the recommended tier
            closest = min(op_plans, key=lambda x: abs(x["price"] - rec_price)) if op_plans else None
            if closest: operator_picks[op] = closest

        persona_advice = {
            "streamer":   ["Consider plans with bundled Disney+ Hotstar or JioCinema Premium.",
                           "Jio's True 5G unlimited offers best streaming experience.",
                           "Look for 'Binge All Night' features for off-peak viewing."],
            "data_heavy": ["Jio 5G unlimited gives best per-GB value at scale.",
                           "Annual plans often give 20–30% more data per rupee.",
                           "Check 5G coverage in your area before upgrading."],
            "caller":     ["All operators offer unlimited calling — focus on data value.",
                           "Vi's Weekend Rollover helps if calls dominate your usage.",
                           "Consider if your employer offers bulk calling plans."],
            "budget":     ["Jio's ₹149 plan offers strong value at entry level.",
                           "Vi's Weekend Rollover means unused data doesn't expire.",
                           "Set a daily data limit on your phone to avoid top-ups."],
            "enterprise": ["Negotiate custom pricing — enterprise accounts get SLA deals.",
                           "Claim GST input tax credit on all mobile plan expenses.",
                           "Evaluate shared data pool plans for teams of 3+ people."],
            "regular":    ["Power 5G or equivalent offers the sweet spot for your usage.",
                           "Compare 28-day vs 84-day plans — longer validity costs less per day.",
                           "OTT bundles on ₹349+ plans can replace a standalone subscription."],
        }.get(persona["id"], [])

        return jsonify({
            "success":True, "persona":persona,
            "spending_efficiency_score": eff,
            "cost_analysis": {
                "current_monthly": mc, "optimal_monthly": rec,
                "monthly_difference": round(diff,2), "annual_difference": round(diff*12,2),
                "overpaying": diff>100, "underpaying": diff<-50,
                "message": _switch_message(mc, rec),
            },
            "savings_trajectory": trajectory,
            "xai_summary": {
                "top_3_drivers": [{"label":c["label"],"contribution":c["contribution_pct"]} for c in xai[:3]],
                "dominant_factor": xai[0]["label"] if xai else "N/A",
            },
            "persona_advice": persona_advice,
            "operator_picks":  operator_picks,
            "action_items":    _action_items(pid, row, diff),
        })
    except Exception as e:
        import traceback
        return jsonify({"error":str(e),"trace":traceback.format_exc()}), 500


@app.route("/history")
def history():
    limit   = int(request.args.get("limit", 20))
    entries = _read_history(limit)
    freq    = {}
    for e in entries:
        n = e.get("plan_name","?"); freq[n] = freq.get(n,0)+1
    return jsonify({
        "success":True, "history":entries, "total":len(entries),
        "plan_frequency": freq,
        "trend_summary": f"Most common: {max(freq,key=freq.get)}" if freq else "No history yet.",
    })


# ══════════════════════════════════════════════════════════════════════
#  SCORING ENGINE
# ══════════════════════════════════════════════════════════════════════

def _compute_value_score(plan, user_row):
    """Score = usage_match*0.5 + cost_efficiency*0.3 + benefits*0.2"""
    mc        = user_row.get("monthly_charges", 349)
    ds        = user_row.get("data_score", 0.5)
    cs        = user_row.get("call_score", 0.4)

    # Desired data (GB): data_score → 0.2–50 GB/month range
    desired_data = ds * 50
    plan_data    = plan.get("data_gb") or (plan.get("data_per_day", 2) * plan.get("validity_days", 28))
    if plan_data >= 9999: plan_data = 100

    data_gap      = abs(plan_data - desired_data)
    usage_match   = max(0.0, 1.0 - data_gap / max(desired_data, 1))
    cost_eff      = max(0.0, 1.0 - abs(plan["price"] - mc) / max(mc, 1))
    benefits_raw  = len(plan.get("benefits") or plan.get("perks") or [])
    benefits_score= min(1.0, benefits_raw / 5.0)

    raw = usage_match * 0.5 + cost_eff * 0.3 + benefits_score * 0.2
    return round(raw * 100, 1)


def _dataset_plans_for_request(user_row):
    """Return all dataset plans enriched with value_score."""
    mc = user_row.get("monthly_charges", 349)
    out = []
    for p in TELECOM_DATASET:
        vs = _compute_value_score(p, user_row)
        data_total = p.get("data_gb") or (p.get("data_per_day", 2) * p.get("validity_days", 28))
        out.append({
            **p,
            "value_score": vs,
            "match_score": vs,
            "label": "Excellent" if vs >= 90 else "Good" if vs >= 75 else "Average",
            "monthly_savings": round(mc - p["price"], 2),
            "annual_savings":  round(max(0, mc - p["price"]) * 12, 2),
        })
    out.sort(key=lambda x: x["value_score"], reverse=True)
    return out


# ══════════════════════════════════════════════════════════════════════
#  NEW ENDPOINTS — v5
# ══════════════════════════════════════════════════════════════════════

@app.route("/scenario", methods=["POST"])
def scenario():
    """Return 3 scenario-based recommendations: current, +30%, budget-limited."""
    try:
        body = request.get_json(force=True, silent=True) or {}
        row  = _build_row(body)
        mc   = row["monthly_charges"]

        def _scenario_rec(modified_row, label, description, budget):
            pid, proba, Xs = _run_model(modified_row)
            dataset_plans  = _dataset_plans_for_request(modified_row)
            top = dataset_plans[:3]
            return {
                "label": label,
                "description": description,
                "budget": budget,
                "top_plan": top[0] if top else None,
                "top_recommendations": top,
                "cost_analysis": {
                    "overpaying": (mc - (top[0]["price"] if top else mc)) > 100,
                    "monthly_difference": round(mc - (top[0]["price"] if top else mc), 2),
                },
            }

        # Scenario 1: current
        s1 = _scenario_rec(row, "Current Usage", "Your current usage profile", mc)

        # Scenario 2: +30% data usage
        row2 = dict(row)
        row2["data_score"] = min(1.0, row["data_score"] * 1.3)
        row2["monthly_charges"] = mc * 1.2
        s2 = _scenario_rec(row2, "+30% Usage", "If your usage increases by 30%", round(mc * 1.2))

        # Scenario 3: budget-limited (70% of current spend)
        row3 = dict(row)
        row3["monthly_charges"] = mc * 0.7
        row3["data_score"] = max(0.1, row["data_score"] * 0.7)
        s3 = _scenario_rec(row3, "Budget Mode", "Minimise spending to 70% of current", round(mc * 0.7))

        return jsonify({"success": True, "scenarios": [s1, s2, s3]})
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


@app.route("/custom-plan", methods=["POST"])
def custom_plan():
    """Find closest plan in dataset matching user-specified specs.
    Optionally filter by operator (detected from mobile number)."""
    try:
        body = request.get_json(force=True, silent=True) or {}
        desired_data   = float(body.get("desired_data",   2.0))   # GB/day
        call_intensity = float(body.get("call_intensity", 0.5))   # 0–1
        budget         = float(body.get("budget",         300))   # ₹/month
        operator       = body.get("operator", "").strip()         # e.g. "Jio", "Airtel", "VI"

        # Filter dataset by operator if specified
        pool = TELECOM_DATASET
        if operator:
            pool = [p for p in TELECOM_DATASET
                    if p.get("operator", p.get("provider", "")).lower() == operator.lower()]
            if not pool:
                pool = TELECOM_DATASET  # fallback if no match

        scored = []
        for p in pool:
            if p["price"] > budget * 1.15:   # 15% budget tolerance
                continue
            data_total  = p.get("data_gb") or (p.get("data_per_day", 2) * p.get("validity_days", 28))
            daily_data  = data_total / max(p.get("validity_days", 28), 1)
            data_diff   = abs(daily_data - desired_data)
            price_diff  = abs(p["price"] - budget)
            score       = -(data_diff * 0.6 + price_diff / max(budget, 1) * 0.4)
            scored.append((score, p))

        if not scored:
            # Relax budget fully
            scored = []
            for p in pool:
                data_total = p.get("data_gb") or (p.get("data_per_day", 2) * p.get("validity_days", 28))
                daily_data = data_total / max(p.get("validity_days", 28), 1)
                data_diff  = abs(daily_data - desired_data)
                price_diff = abs(p["price"] - budget)
                score      = -(data_diff * 0.6 + price_diff / max(budget, 1) * 0.4)
                scored.append((score, p))

        if not scored:
            return jsonify({"success": False, "closest_plan": None})

        scored.sort(key=lambda x: x[0], reverse=True)
        best = scored[0][1]
        return jsonify({
            "success": True,
            "closest_plan": best,
            "alternatives": [s[1] for s in scored[1:4]],
            "filtered_by": operator or "all",
        })
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


@app.route("/detect-provider", methods=["POST"])
def detect_provider():
    """
    Detect Indian telecom service provider from mobile number prefix.
    Uses TRAI number series allocation (approximate; MNP-unaware).
    """
    try:
        body   = request.get_json(force=True, silent=True) or {}
        mobile = str(body.get("mobile", "")).strip().replace(" ", "").replace("-", "").replace("+91", "")

        if not mobile.isdigit() or len(mobile) != 10:
            return jsonify({"success": False, "error": "Enter a valid 10-digit mobile number"}), 400

        if mobile[0] not in "6789":
            return jsonify({"success": False, "error": "Invalid Indian mobile number — must start with 6, 7, 8, or 9"}), 400

        # ── Provider styling helpers ────────────────────────────────────
        PROVIDER_META = {
            "Jio":    {"color": "#0066FF", "logo": "🔵", "bg": "#0066FF15"},
            "Airtel": {"color": "#E8251F", "logo": "🔴", "bg": "#E8251F15"},
            "VI":     {"color": "#CD1163", "logo": "🟣", "bg": "#CD116315"},
        }

        def _resp(provider, confidence, note=""):
            m = PROVIDER_META.get(provider, {"color": "#888", "logo": "📱", "bg": "#88888815"})
            return jsonify({
                "success":    True,
                "provider":   provider,
                "confidence": confidence,
                "message":    note or f"Number detected as {provider}",
                **m,
            })

        # ── Rule 1: All 6-series → Jio (allocated exclusively to Reliance Jio) ──
        if mobile[0] == "6":
            return _resp("Jio", "high", "6-series numbers are exclusively allocated to Jio")

        prefix4 = mobile[:4]
        prefix2 = mobile[:2]

        # ── Rule 2: Known 4-digit prefix table (TRAI allocations) ───────
        # fmt: off
        KNOWN = {
            # ── Jio ────────────────────────────────────────────────────
            "7000":"Jio","7001":"Jio","7002":"Jio","7003":"Jio","7004":"Jio",
            "7005":"Jio","7006":"Jio","7007":"Jio","7008":"Jio","7009":"Jio",
            "7700":"Jio","7701":"Jio","7702":"Jio","7703":"Jio","7704":"Jio",
            "7705":"Jio","7706":"Jio","7707":"Jio","7708":"Jio","7709":"Jio",
            "8085":"Jio","8086":"Jio","8087":"Jio","8088":"Jio","8089":"Jio",
            "9136":"Jio","9137":"Jio","9138":"Jio","9139":"Jio",
            "9321":"Jio","9322":"Jio","9323":"Jio","9324":"Jio","9325":"Jio",
            "9326":"Jio","9327":"Jio","9328":"Jio","9329":"Jio","9330":"Jio",
            "8369":"Jio","8369":"Jio","8976":"Jio","8097":"Jio",
            # ── Airtel ─────────────────────────────────────────────────
            "7011":"Airtel","7012":"Airtel","7013":"Airtel","7014":"Airtel",
            "7015":"Airtel","7016":"Airtel","7017":"Airtel","7018":"Airtel",
            "7019":"Airtel","7027":"Airtel","7290":"Airtel","7291":"Airtel",
            "8130":"Airtel","8131":"Airtel","8132":"Airtel","8133":"Airtel",
            "8800":"Airtel","8826":"Airtel","8700":"Airtel","8750":"Airtel",
            "9810":"Airtel","9811":"Airtel","9818":"Airtel","9871":"Airtel",
            "9873":"Airtel","9650":"Airtel","9654":"Airtel","9560":"Airtel",
            "9999":"Airtel","9582":"Airtel","9717":"Airtel","9716":"Airtel",
            "9911":"Airtel","9910":"Airtel","9990":"Airtel","9650":"Airtel",
            "9818":"Airtel","9899":"Airtel","9971":"Airtel","9958":"Airtel",
            # ── VI (Vodafone Idea) ──────────────────────────────────────
            "9867":"VI","9819":"VI","9820":"VI","9821":"VI","9822":"VI",
            "9699":"VI","9892":"VI","9920":"VI","9930":"VI","9322":"VI",
            "9000":"VI","9001":"VI","9888":"VI","8600":"VI","8767":"VI",
            "9833":"VI","9769":"VI","9029":"VI","9223":"VI","7666":"VI",
            "9820":"VI","9619":"VI","9004":"VI","9967":"VI","9768":"VI",
        }
        # fmt: on

        if prefix4 in KNOWN:
            return _resp(KNOWN[prefix4], "medium")

        # ── Rule 3: 2-digit prefix heuristics (MNP disclaimer) ──────────
        HEURISTIC = {
            "70": "Jio",    "71": "Jio",    "72": "Airtel", "73": "Airtel",
            "74": "Airtel", "75": "Airtel", "76": "Airtel", "77": "Jio",
            "78": "Airtel", "79": "Airtel",
            "80": "Airtel", "81": "Airtel", "82": "Airtel", "83": "Airtel",
            "84": "Airtel", "85": "Airtel", "86": "Jio",    "87": "Jio",
            "88": "Jio",    "89": "Jio",
            "90": "Airtel", "91": "Airtel", "92": "Airtel", "93": "Airtel",
            "94": "VI",     "95": "VI",     "96": "VI",     "97": "Airtel",
            "98": "Airtel", "99": "Airtel",
        }
        provider = HEURISTIC.get(prefix2, "Jio")
        return _resp(provider, "low",
                     f"Approximate detection: {provider} (prefix match). Due to MNP, verify with your operator.")

    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


@app.route("/why-not", methods=["POST"])
def why_not():
    """Explain why a selected plan is not the recommended one."""
    try:
        body       = request.get_json(force=True, silent=True) or {}
        user_inputs = body.get("inputs", {})
        plan_name  = body.get("plan_name", "")
        plan_price = float(body.get("plan_price", 0))
        plan_data  = float(body.get("plan_data",  0))
        plan_score = float(body.get("plan_score", 0))

        row = _build_row(user_inputs)
        pid, proba, Xs = _run_model(row)
        rec = plans[pid]
        rec_score = round(float(proba[int(pid)]) * 100, 1)
        mc = row["monthly_charges"]

        reasons = []
        price_diff = plan_price - rec["price"]
        if price_diff > 50:
            reasons.append({"type": "price", "icon": "💸", "status": "bad",
                            "text": f"₹{round(price_diff)}/month more expensive than recommended {rec['name']}"})
        elif price_diff < -50:
            reasons.append({"type": "price", "icon": "💰", "status": "warn",
                            "text": f"₹{round(-price_diff)}/month cheaper but may not cover your usage needs"})
        else:
            reasons.append({"type": "price", "icon": "✅", "status": "ok",
                            "text": "Similar price point to recommended plan"})

        data_diff = plan_data - rec.get("data_gb", 0)
        if data_diff < -3:
            reasons.append({"type": "data", "icon": "📶", "status": "bad",
                            "text": f"{abs(round(data_diff))}GB less data than recommended plan"})
        elif data_diff > 5:
            reasons.append({"type": "data", "icon": "📶", "status": "ok",
                            "text": f"More data ({abs(round(data_diff))}GB extra) but may exceed your actual usage"})
        else:
            reasons.append({"type": "data", "icon": "✅", "status": "ok", "text": "Comparable data allowance"})

        score_diff = plan_score - rec_score
        if score_diff < -5:
            reasons.append({"type": "score", "icon": "🎯", "status": "bad",
                            "text": f"Match score {round(plan_score)}% vs recommended {round(rec_score)}% — lower AI fit"})
        else:
            reasons.append({"type": "score", "icon": "✅", "status": "ok",
                            "text": f"Competitive match score ({round(plan_score)}%)"})

        return jsonify({
            "success": True,
            "selected_plan": {"name": plan_name, "price": plan_price, "match_score": plan_score},
            "recommended_plan": {"name": rec["name"], "price": rec["price"], "match_score": rec_score},
            "reasons": reasons,
            "summary": f"{plan_name} not recommended: " + " · ".join(
                r["text"] for r in reasons if r["status"] == "bad"
            ) if any(r["status"] == "bad" for r in reasons) else "It's a close call — both plans are viable.",
        })
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

# --- KEEP ALL YOUR EXISTING IMPORTS AND CODE SAME ABOVE ---

# 👇 ONLY REPLACE THE LAST BLOCK WITH THIS

if __name__ == "__main__":
    print(">> PlanIQ API v5.0 -- Production Mode")
    print(f"   Model    : {model_version.get('algorithm')} v{model_version.get('version')}")
    print(f"   Accuracy : {model_version.get('accuracy',0)*100:.1f}%")
    print(f"   Dataset  : {len(TELECOM_DATASET)} plans loaded")
    print(f"   Endpoints: /predict /recommend /compare /insights /feedback /history /plan-profiles")
    print(f"   New v5   : /scenario /custom-plan /why-not /detect-provider")

    # 🔥 IMPORTANT CHANGE FOR DEPLOYMENT
    app.run(host="0.0.0.0", port=5000)
