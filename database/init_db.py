"""
database/init_db.py
====================
Creates MongoDB indexes and inserts seed data.
Run once before starting the backend:
    python database/init_db.py
"""
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from datetime import datetime

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME   = "fakenews_db"

client = MongoClient(MONGO_URI)
db     = client[DB_NAME]


def create_indexes():
    # users
    db.users.create_index([("email",    ASCENDING)], unique=True)
    db.users.create_index([("username", ASCENDING)], unique=True)

    # history — text search + sort indexes
    db.history.create_index([("user_id",   ASCENDING)])
    db.history.create_index([("timestamp", DESCENDING)])
    db.history.create_index([("verdict",   ASCENDING)])
    db.history.create_index([("text",      TEXT)])

    # feedback
    db.feedback.create_index([("user_id",   ASCENDING)])
    db.feedback.create_index([("timestamp", DESCENDING)])

    # share_logs
    db.share_logs.create_index([("prediction_id", ASCENDING)])

    print("✅  Indexes created")


def seed():
    now = datetime.utcnow()

    if db.users.count_documents({}) == 0:
        db.users.insert_many([
            {
                "username"  : "admin",
                "email"     : "admin@fakenewsai.com",
                "password"  : "$2b$12$REPLACE_WITH_BCRYPT_HASH",
                "role"      : "admin",
                "created_at": now,
                "last_login": None,
            },
            {
                "username"  : "demo",
                "email"     : "demo@fakenewsai.com",
                "password"  : "$2b$12$REPLACE_WITH_BCRYPT_HASH",
                "role"      : "user",
                "created_at": now,
                "last_login": None,
            },
        ])
        print("✅  Sample users inserted")

    if db.history.count_documents({}) == 0:
        db.history.insert_many([
            {
                "user_id"           : "anonymous",
                "text"              : "COVID-19 Cure Found by Secret Lab",
                "verdict"           : "FAKE",
                "confidence"        : 92,
                "explanation"       : "No confirmed cure exists for COVID-19.",
                "credibility_score" : 2,
                "source_reliability": "Low",
                "timestamp"         : "2025-04-20 10:32:00 UTC",
            },
            {
                "user_id"           : "anonymous",
                "text"              : "Election Results Certified by State Officials",
                "verdict"           : "REAL",
                "confidence"        : 87,
                "explanation"       : "Credible reporting from verified sources.",
                "credibility_score" : 8,
                "source_reliability": "High",
                "timestamp"         : "2025-04-21 14:14:00 UTC",
            },
            {
                "user_id"           : "anonymous",
                "text"              : "Celebrity Hoax Scandal Exposed",
                "verdict"           : "FAKE",
                "confidence"        : 78,
                "explanation"       : "Unverified rumour with no credible sourcing.",
                "credibility_score" : 3,
                "source_reliability": "Low",
                "timestamp"         : "2025-04-22 09:05:00 UTC",
            },
            {
                "user_id"           : "anonymous",
                "text"              : "Tech Breakthrough — Researchers Confirm Quantum Milestone",
                "verdict"           : "REAL",
                "confidence"        : 83,
                "explanation"       : "Published by credible peer-reviewed outlets.",
                "credibility_score" : 7,
                "source_reliability": "High",
                "timestamp"         : "2025-04-23 16:45:00 UTC",
            },
        ])
        print("✅  Sample history inserted")

    if db.feedback.count_documents({}) == 0:
        db.feedback.insert_many([
            {"user_id": "anonymous", "rating": 5, "message": "Very accurate!", "timestamp": "2025-04-24 09:00:00 UTC"},
            {"user_id": "anonymous", "rating": 4, "message": "Great tool, easy to use.", "timestamp": "2025-04-23 15:00:00 UTC"},
        ])
        print("✅  Sample feedback inserted")


if __name__ == "__main__":
    print(f"Connecting to {MONGO_URI}{DB_NAME} …\n")
    create_indexes()
    seed()
    print("\n✅  Database initialization complete!")
