"""
backend/ml/predictor.py  — FIX 1 + FIX 2 + FIX 3
===================================================
Priority 1 : Calls Anthropic Claude server-side (no CORS, strict JSON prompt).
Priority 2 : Uses trained model.pkl if Claude API key is absent.
Priority 3 : Comprehensive pattern-based heuristic as final fallback.
All paths go through sanitize_result() — output is ALWAYS valid.
"""
import os, re, json, pickle, random, logging
from pathlib import Path
from urllib import request as urllib_req, error as urllib_err

log = logging.getLogger(__name__)
MODEL_PATH = Path(__file__).parent / "model.pkl"

# ── FIX 3: Output sanitizer ───────────────────────────────────────────────────
def sanitize_result(raw: dict) -> dict:
    """Guarantee that every field is present and valid."""
    if not isinstance(raw, dict):
        raw = {}
    verdict = raw.get("verdict", "REAL")
    if verdict not in ("REAL", "FAKE"):
        verdict = "REAL"

    try:
        confidence = max(50, min(97, int(round(float(raw.get("confidence", 72))))))
    except (TypeError, ValueError):
        confidence = 72

    explanation = str(raw.get("explanation", "")).strip()
    if len(explanation) < 5:
        explanation = "Analysis complete. No significant misinformation signals detected."

    try:
        cred = max(1, min(10, int(round(float(raw.get("credibility_score", 5))))))
    except (TypeError, ValueError):
        cred = 5

    src = raw.get("source_reliability", "Medium")
    if src not in ("High", "Medium", "Low"):
        src = "Medium"

    return {
        "verdict"           : verdict,
        "confidence"        : confidence,
        "explanation"       : explanation,
        "credibility_score" : cred,
        "source_reliability": src,
    }

# ── Safe JSON parser (handles markdown fences) ────────────────────────────────
def safe_parse_json(text: str) -> dict:
    if not text:
        raise ValueError("empty text")
    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        m = re.search(r"\{[\s\S]*?\}", cleaned)
        if m:
            return json.loads(m.group(0))
        raise ValueError(f"no JSON in: {cleaned[:100]}")

# ── FIX 1: Claude API — system prompt forces pure JSON ───────────────────────
def _call_claude(text: str) -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set")

    schema = (
        '{'
        '"verdict": "<REAL or FAKE>",'
        '"confidence": <integer 60-97>,'
        '"explanation": "<one sentence reason>",'
        '"credibility_score": <integer 1-10>,'
        '"source_reliability": "<High, Medium, or Low>"'
        '}'
    )

    user_msg = (
        f"News text to evaluate:\n\n{text[:2000]}\n\n"
        "Is this news real or fake? Consider:\n"
        "1. Factual accuracy based on your knowledge of world events.\n"
        "2. Presence of conspiracy language, death hoaxes, or false medical claims.\n"
        "3. Whether named people, events or statistics are accurate.\n"
        "4. Tone — neutral/factual vs sensationalist/misleading.\n\n"
        f"Respond with only this JSON structure filled in:\n{schema}"
    )

    payload = json.dumps({
        "model": "claude-opus-4-5",
        "max_tokens": 300,
        "system": (
            "You are an expert fact-checker. "
            "You respond exclusively with a single valid JSON object and nothing else."
        ),
        "messages": [{"role": "user", "content": user_msg}],
    }).encode()

    req = urllib_req.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type"      : "application/json",
            "x-api-key"         : api_key,
            "anthropic-version" : "2023-06-01",
        },
        method="POST",
    )
    with urllib_req.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())

    raw_text = "".join(b.get("text", "") for b in data.get("content", []))
    return sanitize_result(safe_parse_json(raw_text))  # FIX 3

# ── FIX 2: Trained ML model ───────────────────────────────────────────────────
_STOP = {
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "by","from","is","are","was","were","be","been","have","has","had",
}

def _preprocess(text: str) -> str:
    text = re.sub(r"http\S+|www\S+", " ", text.lower())
    text = re.sub(r"[^a-z\s]", " ", text)
    return " ".join(w for w in text.split() if w not in _STOP and len(w) > 2)

def _call_model(text: str) -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("model.pkl not found — run: python ml/train.py")
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    clean   = _preprocess(text)
    if not clean.strip():
        return sanitize_result({
            "verdict": "REAL", "confidence": 50,
            "explanation": "No analyzable text remaining after preprocessing.",
            "credibility_score": 5, "source_reliability": "Medium"
        })

    proba   = model.predict_proba([clean])[0]
    label   = model.predict([clean])[0]
    conf    = round(float(max(proba)) * 100, 1)
    verdict = "FAKE" if label == 1 else "REAL"

    try:
        tfidf = model.named_steps["tfidf"]
        clf   = model.named_steps["clf"]
        vec = tfidf.transform([clean])
        feature_names = tfidf.get_feature_names_out()
        
        words_contrib = []
        for i in vec.nonzero()[1]:
            words_contrib.append((feature_names[i], clf.coef_[0][i] * vec[0, i]))
            
        if verdict == "FAKE":
            sorted_words = sorted(words_contrib, key=lambda x: x[1], reverse=True)
            top_words = [w for w, c in sorted_words if c > 0][:3]
            if top_words:
                explanation = f"ML model classified this as FAKE, strongly influenced by the words: {', '.join(top_words)}."
            else:
                explanation = "ML model flagged this content as likely misinformation based on linguistic patterns."
            cred = max(1, int(10 - conf / 11))
            src  = "Low" if conf > 80 else "Medium"
        else:
            sorted_words = sorted(words_contrib, key=lambda x: x[1])
            top_words = [w for w, c in sorted_words if c < 0][:3]
            if top_words:
                explanation = f"ML model classified this as REAL, supported by factual language like: {', '.join(top_words)}."
            else:
                explanation = "ML model classified this as credible based on factual linguistic features."
            cred = min(10, int(conf / 11))
            src  = "High" if conf > 80 else "Medium"
            
    except Exception as e:
        log.warning(f"Failed to generate dynamic explanation: {e}")
        if verdict == "FAKE":
            explanation = "ML model flagged this content as likely misinformation based on linguistic patterns."
            cred = max(1, int(10 - conf / 11))
            src  = "Low" if conf > 80 else "Medium"
        else:
            explanation = "ML model classified this as credible based on factual linguistic features."
            cred = min(10, int(conf / 11))
            src  = "High" if conf > 80 else "Medium"

    return sanitize_result({
        "verdict": verdict, "confidence": int(conf),
        "explanation": explanation,
        "credibility_score": cred, "source_reliability": src,
    })

# ── Pattern heuristic (final fallback) ───────────────────────────────────────
FAKE_PATS = [
    (r"they don.t want you (to know|to see)", 3),
    (r"deep state|new world order", 3),
    (r"government (is hiding|cover.?up)", 3),
    (r"false flag|crisis actor|mind control|chemtrail", 3),
    (r"(microchip|chip).*(vaccine)|plandemic|scamdemic", 3),
    (r"cures? (cancer|covid|aids) (instantly|overnight|naturally)", 3),
    (r"big pharma doesn.t want|bleach (cures|treats)", 4),
    (r"shocking (truth|secret)|miracle (cure|drug)", 2),
    (r"doctors hate this|one weird trick|100% (proven|guaranteed)", 2),
    (r"urgent.*share before (they delete|deleted)", 2),
]
REAL_PATS = [
    r"according to (officials?|researchers?|scientists?|experts?)",
    r"\b(study|research|report) (shows?|finds?|confirms?)\b",
    r"\bpeer.reviewed\b|\b(cdc|who|fda|nih|nasa)\b",
    r"\b(senate|congress|parliament|supreme court|white house)\b",
    r"(said|stated|announced) (in a statement|at a press conference)",
    r"\b(reuters|bbc|associated press|new york times)\b",
]

def _heuristic(text: str) -> dict:
    low        = text.lower()
    fake_score = sum(w for p, w in FAKE_PATS if re.search(p, low))
    real_score = sum(1 for p in REAL_PATS if re.search(p, low))
    words      = len(text.split())

    if words < 3:
        return sanitize_result({"verdict":"REAL","confidence":62,
            "explanation":"Too little text to analyze.","credibility_score":5,"source_reliability":"Medium"})

    is_fake = (fake_score >= 4 and real_score == 0) or (fake_score >= 7 and real_score <= 1)
    if is_fake:
        return sanitize_result({
            "verdict": "FAKE",
            "confidence": min(97, 65 + fake_score * 3),
            "explanation": "Content contains conspiracy theory or misinformation language patterns. Verify with trusted sources.",
            "credibility_score": max(1, 4 - fake_score // 2),
            "source_reliability": "Low",
        })
    return sanitize_result({
        "verdict": "REAL",
        "confidence": min(94, 70 + real_score * 5 + (4 if fake_score == 0 else 0)),
        "explanation": "No significant misinformation signals detected. Content appears to be factual reporting.",
        "credibility_score": min(10, 6 + real_score),
        "source_reliability": "High" if real_score >= 3 else "Medium",
    })

# ── Public interface ──────────────────────────────────────────────────────────
class FakeNewsPredictor:
    def predict(self, text: str) -> dict:
        # 1. Try Claude API (server-side, best accuracy)
        try:
            result = _call_claude(text)
            log.info("Claude: %s %.0f%%", result["verdict"], result["confidence"])
            return result
        except Exception as e:
            log.warning("Claude unavailable: %s", e)

        # 2. Try trained ML model (FIX 2)
        try:
            result = _call_model(text)
            log.info("Model: %s %.0f%%", result["verdict"], result["confidence"])
            return result
        except Exception as e:
            log.warning("Model unavailable: %s", e)

        # 3. Heuristic fallback
        result = _heuristic(text)
        log.info("Heuristic: %s %.0f%%", result["verdict"], result["confidence"])
        return result
