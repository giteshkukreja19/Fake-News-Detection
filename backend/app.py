"""
Fake News Detection System — Flask Backend
==========================================
Install: pip install -r requirements.txt
Run    : python app.py
"""
import os, logging, re
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, TEXT
from dotenv import load_dotenv
from ml.predictor import FakeNewsPredictor
import requests
from bs4 import BeautifulSoup
load_dotenv()

app     = Flask(__name__)
CORS(app, origins=["http://localhost:3000", os.getenv("FRONTEND_URL", "*")])
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log     = logging.getLogger(__name__)

# ── DB ────────────────────────────────────────────────────────────────────────
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db     = client["fakenews_db"]

# ── ML ────────────────────────────────────────────────────────────────────────
predictor = FakeNewsPredictor()

# ── Helpers ───────────────────────────────────────────────────────────────────
def now_iso():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

def ok(data, code=200):
    return jsonify({"success": True, "data": data}), code

def err(msg, code=400):
    return jsonify({"success": False, "error": msg}), code

# ── Routes ────────────────────────────────────────────────────────────────────

def extract_text_from_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'}
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        title = soup.title.string if soup.title else ""
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        description = meta_desc['content'] if meta_desc and meta_desc.get('content') else ""
        
        paragraphs = [p.get_text() for p in soup.find_all('p')]
        p_text = " ".join(paragraphs)
        
        extracted = f"{title}. {description}. {p_text}".strip()
        return extracted
    except Exception as e:
        log.warning(f"Failed to scrape {url}: {e}")
        return ""

@app.route("/health", methods=["GET"])
def health():
    return ok({"status": "ok", "timestamp": now_iso()})


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True) or {}
    original_text = (body.get("text") or "").strip()
    if not original_text:
        return err("'text' field is required", 400)

    text_to_analyze = original_text
    if re.match(r'^https?://', original_text):
        log.info("URL detected. Attempting to scrape: %s", original_text)
        extracted = extract_text_from_url(original_text)
        if extracted and len(extracted.split()) > 3:
            text_to_analyze = extracted
        else:
            return err("Could not extract meaningful text from the provided URL. It might be a video or protected.", 400)

    result  = predictor.predict(text_to_analyze)
    record  = {
        "text"              : original_text[:500],
        "verdict"           : result["verdict"],
        "confidence"        : result["confidence"],
        "explanation"       : result["explanation"],
        "credibility_score" : result["credibility_score"],
        "source_reliability": result["source_reliability"],
        "user_id"           : body.get("user_id", "anonymous"),
        "timestamp"         : now_iso(),
    }
    inserted       = db.history.insert_one(record)
    result["id"]   = str(inserted.inserted_id)
    log.info("Prediction: %s  %.1f%%  user=%s", result["verdict"], result["confidence"], record["user_id"])
    return ok(result, 201)


@app.route("/feedback", methods=["POST"])
def feedback():
    body    = request.get_json(silent=True) or {}
    rating  = body.get("rating")
    message = (body.get("message") or "").strip()
    if rating is None or not (1 <= int(rating) <= 5):
        return err("'rating' must be 1–5", 400)
    if not message:
        return err("'message' is required", 400)
    db.feedback.insert_one({
        "rating"   : int(rating),
        "message"  : message,
        "user_id"  : body.get("user_id", "anonymous"),
        "timestamp": now_iso(),
    })
    return ok({"message": "Feedback saved"}, 201)


@app.route("/history", methods=["GET"])
def get_history():
    user_id = request.args.get("user_id", "anonymous")
    limit   = min(int(request.args.get("limit", 50)), 200)
    skip    = int(request.args.get("skip", 0))
    docs    = list(
        db.history.find({"user_id": user_id}, {"_id": 0})
                  .sort("timestamp", -1).skip(skip).limit(limit)
    )
    total = db.history.count_documents({"user_id": user_id})
    return ok({"items": docs, "total": total})


@app.route("/history", methods=["DELETE"])
def delete_history():
    user_id = request.args.get("user_id", "anonymous")
    res     = db.history.delete_many({"user_id": user_id})
    return ok({"deleted": res.deleted_count})


@app.route("/search", methods=["GET"])
def search():
    q       = (request.args.get("q") or "").strip()
    user_id = request.args.get("user_id", "anonymous")
    if not q:
        return err("'q' query param is required", 400)
    docs = list(
        db.history.find(
            {"user_id": user_id, "text": {"$regex": q, "$options": "i"}},
            {"_id": 0}
        ).sort("timestamp", -1).limit(30)
    )
    return ok({"items": docs, "total": len(docs)})


@app.route("/share-log", methods=["POST"])
def share_log():
    body = request.get_json(silent=True) or {}
    db.share_logs.insert_one({
        "prediction_id": body.get("prediction_id"),
        "platform"     : body.get("platform", "web"),
        "timestamp"    : now_iso(),
    })
    return ok({"message": "Logged"}, 201)


@app.route("/admin/stats", methods=["GET"])
def admin_stats():
    total   = db.history.count_documents({})
    fake    = db.history.count_documents({"verdict": "FAKE"})
    real    = db.history.count_documents({"verdict": "REAL"})
    users   = db.users.count_documents({})
    fb_cnt  = db.feedback.count_documents({})
    pipe    = [{"$group": {"_id": None, "avg": {"$avg": "$confidence"}}}]
    avg_r   = list(db.history.aggregate(pipe))
    avg_c   = round(avg_r[0]["avg"], 1) if avg_r else 0
    recent_fb = list(db.feedback.find({}, {"_id": 0}).sort("timestamp", -1).limit(10))
    return ok({
        "total_checks"   : total,
        "fake_count"     : fake,
        "real_count"     : real,
        "total_users"    : users,
        "total_feedback" : fb_cnt,
        "avg_confidence" : avg_c,
        "recent_feedback": recent_fb,
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(debug=os.getenv("FLASK_ENV") != "production", host="0.0.0.0", port=port)
