# 🚀 PlanIQ — AI Telecom Plan Optimizer

**Smart, explainable AI recommendations for telecom recharge plans**

🔗 **Live Demo:** https://planiq-seven.vercel.app

---

## 🧠 Overview

PlanIQ is a data-driven telecom plan recommendation system that helps users choose the best recharge plan using machine learning.

It analyzes **14 behavioral and billing features** and provides:

* Top 3 plan recommendations
* Explainable AI insights (XAI)
* Cost optimization suggestions
* Overpayment detection

---

## ✨ Key Features

* 🎯 **Top-3 AI Recommendations** with confidence scores
* 🧠 **Explainable AI (XAI)** — why a plan is recommended
* 💸 **Overpayment Detection** — find savings instantly
* 📊 **Analytics Dashboard** — usage & trends
* 📚 **Dataset Browser** — explore telecom plans
* 🔁 **Scenario Builder** — test different usage cases
* 🏆 **Gamification** — track savings & improvements

---

## 🏗️ Architecture

```text
Frontend (React - Vercel)
        ↓
API Calls
        ↓
Backend (Flask - Render)
        ↓
ML Model (Gradient Boosting)
        ↓
Telecom Dataset (JSON)
```

---

## 🛠️ Tech Stack

**Frontend**

* React (Vite)
* Recharts
* Framer Motion

**Backend**

* Flask
* Flask-CORS
* Gunicorn

**Machine Learning**

* Scikit-learn
* Pandas
* NumPy

**Deployment**

* Vercel (Frontend)
* Render (Backend)

---

## 📁 Project Structure

```text
planiq-redesign/
├── backend/
│   ├── app.py
│   ├── model.pkl
│   ├── telecom_plans_full_dataset.json
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── utils/api.js
│   └── package.json
```

---

## ⚡ How It Works

1. User enters usage details
2. Frontend sends request to backend
3. ML model predicts best plan
4. API returns:

   * Recommendations
   * Insights
   * Savings analysis
5. UI displays results in dashboard

---

## 🔌 API Endpoints

| Endpoint         | Description            |
| ---------------- | ---------------------- |
| `/health`        | Check backend status   |
| `/recommend`     | Get AI recommendations |
| `/compare`       | Compare plans          |
| `/insights`      | Cost & usage insights  |
| `/dataset-plans` | View telecom dataset   |

---

## 🚀 Deployment

### Frontend (Vercel)

* Deploy `frontend/`
* Set:

```env
VITE_API_URL=https://your-render-url
```

### Backend (Render)

* Deploy `backend/`
* Start command:

```bash
gunicorn app:app
```

---

## ⚠️ Notes

* Backend may take **10–30 seconds to wake up** (Render free tier)
* App includes **fallback mock data** if backend is unavailable

---

## 🧠 ML Model

* Algorithm: Gradient Boosting
* Accuracy: **~98.4%**
* Dataset: IBM Telco Churn
* Features: 14 usage + billing signals

---

## 🏆 Impact

* Helps users save money on telecom plans
* Simplifies decision-making
* Uses explainable AI for transparency

---

## 🙌 Acknowledgements

* IBM Telco Dataset (Kaggle)
* Open-source ML ecosystem

---

## 📬 Contact

For queries or collaboration, feel free to connect.

---

⭐ If you like this project, consider starring the repo!
