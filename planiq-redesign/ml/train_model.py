# -*- coding: utf-8 -*-
"""
AI Telecom Recharge Plan Optimizer -- ML Model Training
Uses the IBM/Kaggle Telco Customer Churn dataset (real-world telecom data)
Downloaded from public GitHub mirror -- no Kaggle credentials required.

Pipeline:
  1. Download & preprocess Telco Churn CSV
  2. Feature engineering → usage scores
  3. KMeans clustering (6 clusters) → data-driven plan labels
  4. GradientBoostingClassifier for final model
  5. Save model artifacts + model_version.json
"""

import numpy as np
import pandas as pd
import urllib.request
import json
import pickle
import warnings
from pathlib import Path
from datetime import datetime

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

warnings.filterwarnings("ignore")
np.random.seed(42)

# --- Dataset URLs (public GitHub mirrors, no login needed) ---
DATASET_URL = (
    "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"
)

FALLBACK_URL = (
    "https://raw.githubusercontent.com/carrie-han/i_like_file/master/Telco-Customer-Churn.csv"
)

FALLBACK_URL2 = (
    "https://raw.githubusercontent.com/dsrscientist/dataset1/master/telecom_churn.csv"
)

# ─── Plan Definitions (6 tiers mapped from clusters) ──────────────────────────
PLANS = {
    0: {"name": "Basic 2G",  "price": 99,  "data_gb": 1,  "calls_min": 100,  "validity": 28, "sms": 100,       "tag": "Starter"},
    1: {"name": "Smart 5G",  "price": 199, "data_gb": 3,  "calls_min": 300,  "validity": 28, "sms": 300,       "tag": "Popular"},
    2: {"name": "Power 5G",  "price": 299, "data_gb": 6,  "calls_min": 600,  "validity": 28, "sms": 500,       "tag": "Value"},
    3: {"name": "Ultra 5G",  "price": 449, "data_gb": 12, "calls_min": 1200, "validity": 56, "sms": 1000,      "tag": "Best Value"},
    4: {"name": "Pro Max",   "price": 599, "data_gb": 25, "calls_min": 3000, "validity": 84, "sms": "Unlimited","tag": "Premium"},
    5: {"name": "Business",  "price": 899, "data_gb": 50, "calls_min": 5000, "validity": 84, "sms": "Unlimited","tag": "Enterprise"},
}

FEATURES = [
    "tenure", "monthly_charges", "total_charges",
    "has_tech_support", "has_online_security", "has_streaming",
    "contract_score", "payment_score",
    "data_score", "call_score", "value_score",
    "is_senior", "num_services", "churn_risk",
]


# ─── Download Dataset ─────────────────────────────────────────────────────────
def download_dataset() -> pd.DataFrame:
    from io import StringIO
    for url in [DATASET_URL, FALLBACK_URL, FALLBACK_URL2]:
        try:
            print(f"   Downloading from: {url}")
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                content = resp.read().decode("utf-8")
            df = pd.read_csv(StringIO(content))
            print(f"   [OK] Downloaded {len(df)} rows, {len(df.columns)} columns")
            return df
        except Exception as e:
            print(f"   [FAIL] ({e}), trying fallback...")
    raise RuntimeError("All dataset download URLs failed. Check internet connection.")


# ─── Preprocessing + Feature Engineering ──────────────────────────────────────
def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Standardize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # TotalCharges can be " " for new customers
    df["totalcharges"] = pd.to_numeric(df.get("totalcharges", df.get("total_charges", 0)), errors="coerce").fillna(0)
    df["monthlycharges"] = pd.to_numeric(df.get("monthlycharges", df.get("monthly_charges", 50)), errors="coerce").fillna(50)
    df["tenure"] = pd.to_numeric(df.get("tenure", 12), errors="coerce").fillna(12)

    # Binary columns
    yes_no = lambda col: (df[col].str.upper() == "YES").astype(int) if col in df.columns else pd.Series(0, index=df.index)

    df["is_senior"]          = pd.to_numeric(df.get("seniorcitizen", df.get("senior_citizen", 0)), errors="coerce").fillna(0).astype(int)
    df["has_tech_support"]   = yes_no("techsupport")
    df["has_online_security"] = yes_no("onlinesecurity")
    df["has_streaming"]      = ((yes_no("streamingtv") + yes_no("streamingmovies")) > 0).astype(int)

    # Contract score: month-to-month=0, one year=1, two year=2
    contract_col = df.get("contract", pd.Series("Month-to-month", index=df.index))
    df["contract_score"] = contract_col.map({"Month-to-month": 0, "One year": 1, "Two year": 2}).fillna(0)

    # Payment score
    pay_col = df.get("paymentmethod", pd.Series("Electronic check", index=df.index))
    df["payment_score"] = pay_col.map({
        "Electronic check": 0, "Mailed check": 1,
        "Bank transfer (automatic)": 2, "Credit card (automatic)": 3,
    }).fillna(0)

    # Count number of add-on services
    service_cols = ["phoneservice", "multiplelines", "internetservice", "onlinesecurity",
                    "onlinebackup", "deviceprotection", "techsupport", "streamingtv", "streamingmovies"]
    df["num_services"] = sum(
        yes_no(c) for c in service_cols if c in df.columns
    )

    # Derived usage / value scores (normalized 0-1 within dataset range)
    mc = df["monthlycharges"]
    t  = df["tenure"]
    tc = df["totalcharges"]

    # data_score: higher monthly charges + streaming = heavier data user
    df["data_score"] = (
        (mc - mc.min()) / (mc.max() - mc.min() + 1e-9)
        * (1 + 0.5 * df["has_streaming"])
    ).clip(0, 1)

    # call_score: tenure + multiple lines proxy for heavy caller
    ml_flag = yes_no("multiplelines")
    df["call_score"] = (
        (t - t.min()) / (t.max() - t.min() + 1e-9) * 0.5
        + ml_flag * 0.5
    ).clip(0, 1)

    # value_score: total spend / tenure (avg monthly spend relative to peers)
    df["value_score"] = (
        (tc / (t + 1) - (tc / (t + 1)).min())
        / ((tc / (t + 1)).max() - (tc / (t + 1)).min() + 1e-9)
    ).clip(0, 1)

    # churn_risk: churn = 1 (already churned) else 0
    churn_col = df.get("churn", pd.Series("No", index=df.index))
    df["churn_risk"] = (churn_col.str.upper() == "YES").astype(int)

    # Final feature columns
    df["monthly_charges"] = mc
    df["total_charges"]   = tc

    return df


# ─── KMeans Clustering → Plan Label Assignment ────────────────────────────────
def assign_plan_labels(df: pd.DataFrame) -> pd.Series:
    """
    Cluster users into 6 natural groups using KMeans on usage signals.
    Then map clusters → plans ordered by spend/usage intensity.
    """
    cluster_features = ["data_score", "call_score", "value_score", "monthly_charges", "num_services"]
    X_cluster = df[cluster_features].fillna(0)

    scaler_c = StandardScaler()
    X_scaled = scaler_c.fit_transform(X_cluster)

    km = KMeans(n_clusters=6, n_init=20, random_state=42)
    clusters = km.fit_predict(X_scaled)

    # Order clusters by combined spend-usage score → assign plan 0=cheapest…5=most expensive
    df_tmp = df.copy()
    df_tmp["_cluster"] = clusters
    cluster_means = df_tmp.groupby("_cluster")["monthly_charges"].mean().sort_values()
    cluster_to_plan = {old: new for new, old in enumerate(cluster_means.index)}

    plan_ids = pd.Series([cluster_to_plan[c] for c in clusters], index=df.index)
    return plan_ids


# ─── Train Model ──────────────────────────────────────────────────────────────
def train(save_path: str = None):
    if save_path is None:
        save_path = str(Path(__file__).parent.parent / "backend")
    save_dir = Path(save_path)
    save_dir.mkdir(parents=True, exist_ok=True)

    print("\n[*] Downloading Telco Customer Churn dataset...")
    raw_df = download_dataset()

    print("\n[*] Preprocessing & feature engineering...")
    df = preprocess(raw_df)

    print("\n[*] Running KMeans clustering (6 clusters -> 6 plan tiers)...")
    df["plan_id"] = assign_plan_labels(df)

    plan_dist = df["plan_id"].value_counts().sort_index()
    print(f"   Plan distribution (data-driven):\n{plan_dist}\n")

    # Build feature matrix
    X = df[FEATURES].fillna(0)
    y = df["plan_id"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc  = scaler.transform(X_test)

    print("[*] Training GradientBoostingClassifier...")
    model = GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.08,
        max_depth=5,
        min_samples_split=4,
        subsample=0.85,
        random_state=42,
    )
    model.fit(X_train_sc, y_train)

    y_pred = model.predict(X_test_sc)
    acc    = accuracy_score(y_test, y_pred)
    print(f"[OK] Accuracy: {acc:.3f} ({acc * 100:.1f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=[PLANS[i]["name"] for i in range(6)]))

    importances = {f: round(float(v), 4) for f, v in zip(FEATURES, model.feature_importances_)}
    top5 = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
    print("[*] Top 5 Features:")
    for feat, imp in top5:
        print(f"   {feat}: {imp:.4f}")

    # --- Save Artifacts ---
    print(f"\n[*] Saving artifacts to {save_dir}/...")
    with open(save_dir / "model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(save_dir / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open(save_dir / "features.json", "w") as f:
        json.dump(FEATURES, f)

    # Convert plans keys to strings for JSON
    plans_str = {str(k): v for k, v in PLANS.items()}
    with open(save_dir / "plans.json", "w") as f:
        json.dump(plans_str, f)

    with open(save_dir / "feature_importance.json", "w") as f:
        json.dump(importances, f)

    version_info = {
        "version": "2.0",
        "algorithm": "GradientBoostingClassifier",
        "label_method": "KMeans(k=6) clustering → usage-ordered plan tiers",
        "dataset": "Telco Customer Churn (IBM/Kaggle)",
        "dataset_rows": int(len(df)),
        "features": len(FEATURES),
        "accuracy": round(float(acc), 4),
        "trained_at": datetime.now().isoformat(),
        "feedback_count": 0,
    }
    with open(save_dir / "model_version.json", "w") as f:
        json.dump(version_info, f, indent=2)

    print("[OK] All artifacts saved successfully!")
    print(f"\n[*] Model Version Info:")
    for k, v in version_info.items():
        print(f"   {k}: {v}")

    return model, scaler, FEATURES, PLANS, importances


if __name__ == "__main__":
    train()
