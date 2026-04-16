# 📡 PlanIQ — AI Telecom Recharge Plan Optimizer

> A full-stack AI-powered SaaS application that uses Random Forest ML to recommend optimal telecom recharge plans from 14 behavioral signals.

---

## 🏗 Architecture

```
User Input → React Frontend (Vite)
                ↓
         Flask REST API (/predict)
                ↓
    Random Forest Classifier (89.9% accuracy)
                ↓
    Structured JSON Response (plan + XAI + savings)
                ↓
         Dashboard UI (plan card + charts + comparison)
```

---

## 📁 Project Structure

```
telecom-optimizer/
├── ml/
│   └── train_model.py          # Dataset generation + RF training
├── backend/
│   ├── app.py                  # Flask REST API
│   ├── requirements.txt
│   ├── render.yaml             # Render deployment config
│   ├── model.pkl               # Trained Random Forest model
│   ├── scaler.pkl              # StandardScaler
│   ├── features.json           # Feature list (14 features)
│   ├── plans.json              # Plan catalog
│   └── feature_importance.json # XAI feature weights
└── frontend/
    ├── src/
    │   ├── App.jsx             # Main app with routing
    │   ├── index.css           # Design system tokens
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── HeroSection.jsx
    │   │   ├── InputPanel.jsx       # Sliders + toggles
    │   │   ├── RecommendationCard.jsx # XAI result card
    │   │   ├── PlanComparison.jsx
    │   │   └── AnalyticsDashboard.jsx # Chart.js charts
    │   └── utils/
    │       └── api.js          # API calls + mock fallback
    ├── index.html
    ├── vite.config.js
    ├── vercel.json
    └── package.json
```

---

## 🚀 Local Setup

### 1. Train the ML Model

```bash
cd ml
pip install scikit-learn pandas numpy
python train_model.py
# → Saves model.pkl, scaler.pkl, features.json, plans.json to ../backend/
# → Reports ~89.9% accuracy
```

### 2. Start the Flask Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# → API running at http://localhost:5000
```

**Test it:**
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data_usage_gb": 5.8,
    "call_minutes": 480,
    "sms_count": 200,
    "num_ott_apps": 3,
    "tenure": 18,
    "monthly_charges": 349,
    "roaming_usage": 0,
    "night_usage_pct": 0.3,
    "weekend_usage_pct": 0.4,
    "avg_session_mins": 35,
    "support_calls": 0,
    "device_type": 1,
    "network_type": 2,
    "total_charges": 6282
  }'
```

### 3. Start the React Frontend

```bash
cd frontend
cp .env.example .env.local     # Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
# → App running at http://localhost:3000
```

---

## 🌐 Production Deployment

### Backend → Render

1. Push `backend/` to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
5. Copy your Render URL (e.g. `https://planiq-api.onrender.com`)

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variable: `VITE_API_URL=https://planiq-api.onrender.com`
4. Deploy — Vercel auto-detects Vite

---

## 🤖 ML Model Details

| Property | Value |
|---|---|
| Algorithm | Random Forest Classifier |
| Training samples | 5,000 (synthetic telecom data) |
| Test accuracy | **89.9%** |
| Features | 14 behavioral + billing signals |
| Classes | 6 plan tiers (₹99 – ₹899) |
| Top feature | `data_usage_gb` (52.6% importance) |

**Feature List:**
`tenure`, `data_usage_gb`, `call_minutes`, `sms_count`, `num_ott_apps`,
`roaming_usage`, `night_usage_pct`, `weekend_usage_pct`, `avg_session_mins`,
`support_calls`, `device_type`, `network_type`, `monthly_charges`, `total_charges`

---

## 🔌 API Reference

### `GET /health`
```json
{ "status": "ok", "model": "RandomForestClassifier", "accuracy": 0.899 }
```

### `GET /plans`
Returns all 6 plan tiers with price, data, calls, validity.

### `POST /predict`
**Body:** JSON with 14 feature fields (all optional, defaults provided)

**Response:**
```json
{
  "success": true,
  "recommendation": {
    "name": "Power 5G",
    "price": 299,
    "data_gb": 6,
    "calls_min": 600,
    "validity": 28,
    "confidence": 91.4,
    "reason": "Explainable AI text...",
    "cost_tips": ["tip1", "tip2", "tip3"],
    "top_features": [{ "feature": "data_usage_gb", "importance": 0.526 }],
    "overpayment_analysis": {
      "overpaying": true,
      "amount": 50,
      "annual_savings": 600
    }
  },
  "all_plans": [ ...ranked by match score... ]
}
```

---

## ✨ Features

- **Smart Input Panel** — sliders, toggles, dropdowns (no boring forms)
- **AI Recommendation Card** — plan details + confidence score bar
- **Explainable AI (XAI)** — natural language reason + top driving features
- **Overpayment Detection** — alerts if current spend exceeds recommended plan
- **Cost-saving Tips** — 3 contextual tips per plan tier
- **Plan Comparison Table** — all 6 plans ranked by ML match score
- **Analytics Dashboard** — usage trend, breakdown donut, plan distribution bar
- **Dark / Light Mode** — full theme system with CSS variables
- **Mock Fallback** — frontend works standalone even without backend running

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Chart.js |
| Backend | Flask 3, Flask-CORS, Gunicorn |
| ML | scikit-learn, pandas, numpy |
| Fonts | Syne (display) + DM Sans (body) |
| Deployment | Vercel (frontend) + Render (backend) |

---

*Built as a premium SaaS-grade ML product — not a student project.*
