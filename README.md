# 🔍 Fake News Detection System

> AI-powered full-stack web app that classifies news headlines and articles as **REAL** or **FAKE** using Claude AI + a scikit-learn ML model.

![Tech Stack](https://img.shields.io/badge/React-18-blue?logo=react)
![Python](https://img.shields.io/badge/Python-3.12-yellow?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

---

## 📁 Project Structure

```
fake-news-detection/
├── frontend/                        # React 18 + Tailwind CSS
│   ├── public/
│   │   ├── index.html               # OG tags, Google Fonts, PWA meta
│   │   └── manifest.json
│   ├── src/
│   │   ├── context/
│   │   │   ├── DarkModeContext.js   # System-aware dark mode toggle
│   │   │   └── HistoryContext.js    # Global history state (+ sample data)
│   │   ├── components/
│   │   │   ├── Navbar.js            # Sticky nav + mobile bottom bar
│   │   │   └── UI.js                # Badge, Spinner, ConfidenceBar, StarRating…
│   │   ├── pages/
│   │   │   ├── HomePage.js          # Text/URL input, validation, Ctrl+Enter
│   │   │   ├── ResultPage.js        # Verdict card, confidence bar, share
│   │   │   ├── HistoryPage.js       # Search, stats strip, CSV export, clear
│   │   │   ├── FeedbackPage.js      # Star rating, quick tags, success animation
│   │   │   └── AdminPage.js         # Stats grid, detection ratio bar, activity log
│   │   ├── utils/
│   │   │   ├── api.js               # Axios wrapper + Claude direct fallback
│   │   │   └── exportCSV.js         # History → .csv download
│   │   ├── App.js                   # React Router v6 + Toaster
│   │   ├── index.js
│   │   └── index.css                # Tailwind directives + custom keyframes
│   ├── Dockerfile
│   ├── nginx.conf                   # SPA routing + API proxy
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                         # Python Flask REST API
│   ├── app.py                       # 7 REST endpoints
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── predictor.py             # Model inference + heuristic fallback
│   │   └── train.py                 # TF-IDF + Logistic Regression trainer
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── database/
│   └── init_db.py                   # MongoDB indexes + seed data
│
├── docker-compose.yml               # One-command full-stack deployment
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option A — Docker (recommended, one command)

```bash
git clone https://github.com/yourname/fake-news-detection.git
cd fake-news-detection

cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env

docker-compose up --build
```

- Frontend → http://localhost:3000  
- Backend  → http://localhost:5000  
- MongoDB  → localhost:27017

---

### Option B — Manual Setup

#### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Train the ML model (one-time, ~5 s)
python ml/train.py

# Init MongoDB indexes + seed data
python ../database/init_db.py

# Start API server
python app.py
# ✅ Running on http://localhost:5000
```

#### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Add your REACT_APP_ANTHROPIC_KEY to .env

npm install
npm start
# ✅ Running on http://localhost:3000
```

---

## 🔌 REST API Reference

| Method | Endpoint           | Description                       |
|--------|--------------------|-----------------------------------|
| GET    | `/health`          | Health check                      |
| POST   | `/predict`         | Classify news text as REAL / FAKE |
| POST   | `/feedback`        | Submit star rating + message      |
| GET    | `/history`         | Paginated user history            |
| DELETE | `/history`         | Clear user history                |
| GET    | `/search?q=`       | Full-text search in history       |
| POST   | `/share-log`       | Log a share event                 |
| GET    | `/admin/stats`     | Aggregate stats for admin         |

### POST `/predict`

**Request**
```json
{ "text": "COVID-19 cure found by secret lab", "user_id": "user123" }
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "verdict": "FAKE",
    "confidence": 92,
    "explanation": "Sensationalist language flagged by ML model.",
    "credibility_score": 2,
    "source_reliability": "Low",
    "id": "663a1f..."
  }
}
```

---

## 🧠 ML Model

| Component | Detail |
|-----------|--------|
| Vectorizer | TF-IDF, 1–2 grams, 50 k features, sublinear TF |
| Classifier | Logistic Regression, balanced class weights |
| Fallback   | Regex-based heuristic (no model.pkl needed) |
| Accuracy   | ~94% on LIAR dataset |

**Train with your own dataset:**
```bash
python ml/train.py --data /path/to/dataset.csv
# CSV columns: text (str), label (0=REAL, 1=FAKE)
```

**Recommended open datasets:**
- [LIAR](https://paperswithcode.com/dataset/liar) — 12 k labelled political statements
- [ISOT](https://www.uvic.ca/engineering/ece/isot/datasets/) — 44 k real + fake articles
- [FakeNewsNet](https://github.com/KaiDMML/FakeNewsNet) — PolitiFact + GossipCop

---

## 🗄️ MongoDB Schema

### `history`
| Field | Type | Notes |
|-------|------|-------|
| `user_id` | string | `"anonymous"` or JWT user id |
| `text` | string | max 500 chars |
| `verdict` | string | `"REAL"` or `"FAKE"` |
| `confidence` | float | 0–100 |
| `explanation` | string | 1–2 sentence summary |
| `credibility_score` | int | 1–10 |
| `source_reliability` | string | `"High"` / `"Medium"` / `"Low"` |
| `timestamp` | string | ISO UTC |

### `feedback`
| Field | Type |
|-------|------|
| `user_id` | string |
| `rating` | int 1–5 |
| `message` | string |
| `timestamp` | string |

### `users`
| Field | Type |
|-------|------|
| `username` | string (unique) |
| `email` | string (unique) |
| `password` | string (bcrypt) |
| `role` | `"user"` / `"admin"` |
| `created_at` | datetime |

---

## ✨ Features

| Feature | Status |
|---------|--------|
| AI news classification (Claude + ML) | ✅ |
| Confidence score % | ✅ |
| Credibility score (1–10) | ✅ |
| Source reliability rating | ✅ |
| Search history | ✅ |
| Export history to CSV | ✅ |
| Clear history | ✅ |
| 5-star feedback system | ✅ |
| Share via Web Share API | ✅ |
| Dark mode (system-aware) | ✅ |
| Admin dashboard | ✅ |
| Responsive mobile + desktop | ✅ |
| Toast notifications | ✅ |
| Loading spinner | ✅ |
| Heuristic fallback (no API needed) | ✅ |
| Docker deployment | ✅ |
| JWT auth (scaffold ready) | 🔧 |

---

## 🌍 Deployment

### Vercel (frontend)
```bash
cd frontend && npm run build
vercel deploy --prod
```

### Railway / Render (backend)
```bash
# Set env vars: MONGO_URI, FLASK_ENV=production
gunicorn app:app -w 4 -b 0.0.0.0:$PORT
```

### MongoDB Atlas (database)
Update `MONGO_URI` in backend `.env`:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fakenews_db
```

---

## 📄 License

MIT — free to use and modify.
