# PlanIQ v4.0 — Setup Guide

## ⚠️ Fix for numpy._core Errors (READ FIRST)

The `model.pkl` was compiled with **NumPy 2.x** and **scikit-learn 1.8.0**.
The old `requirements.txt` listed incompatible versions, causing:

| Error | Cause | Fix |
|---|---|---|
| `No module named 'numpy._core'` | numpy==1.26.3 installed (1.x) — pkl needs 2.x | Install `numpy==2.2.4` |
| `No module named '_loss'` | scikit-learn==1.4.0 — pkl embeds 1.8.0 | Install `scikit-learn==1.8.0` |
| `numpy.dtype size changed` | Mixed 1.x/2.x binary headers | Fresh venv + correct versions |

---

## Backend Setup (Python / Flask)

```powershell
# Windows PowerShell — run from project root
cd backend

# Delete any broken venv first
Remove-Item -Recurse -Force venv   # skip if no venv exists yet

# Create fresh environment
python -m venv venv
venv\Scripts\activate              # Mac/Linux: source venv/bin/activate

# Install EXACT versions that match model.pkl
python -m pip install --upgrade pip
pip install -r requirements.txt

# Start the server
python app.py
```

Expected output:
```
🚀 PlanIQ API v4.0 — http://127.0.0.1:5000
   Model    : GradientBoostingClassifier v2.0
   Accuracy : 98.4%
   Endpoints: /predict /recommend /compare /insights /feedback /history /plan-profiles
```

Quick health check:
```
curl http://localhost:5000/health
```

---

## Frontend Setup (React / Vite)

```powershell
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

Node.js **v18+** required. Check: `node --version`

---

## All API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Model status |
| `/model-info` | GET | Model metadata + feature importances |
| `/plans` | GET | All 6 plan definitions |
| `/plan-profiles` | GET | Real Airtel / Jio / Vi plan catalog |
| `/predict` | POST | Single best prediction (backward-compat) |
| `/recommend` | POST | **Top-3 plans + XAI + persona + cost analysis** |
| `/compare` | POST | Full comparison matrix + operator matches |
| `/insights` | POST | Cost optimisation, savings trajectory, action items |
| `/feedback` | POST | Store rating, auto-retrain at 50 entries |
| `/history` | GET | Last N recommendation sessions |

---

## What's New in v4.0

- **Smart Recommendations** — top-3 plans ranked by ML probability + persona fit
- **Explainable AI** — feature contribution bars showing WHY each plan was chosen
- **User Profiling** — 6 personas (Streaming Enthusiast, Heavy Data, Budget, Power Caller, Business, Regular)
- **Cost Optimisation** — efficiency score, savings trajectory chart, action items
- **Real Telecom Data** — Airtel, Jio, and Vi plan catalog with perks
- **History Tracking** — localStorage-based session history with trend analysis
- **Feedback Loop** — thumbs up/down → stored → auto-retrain at 50 entries
