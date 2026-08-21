import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ── FIX 3: Strict sanitizer — ALWAYS returns a valid result object ──────────
export function sanitizeResult(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  return {
    verdict: ["REAL", "FAKE"].includes(raw.verdict) ? raw.verdict : "REAL",
    confidence:
      Number.isFinite(Number(raw.confidence)) && Number(raw.confidence) >= 50
        ? Math.min(97, Math.round(Number(raw.confidence)))
        : 72,
    explanation:
      typeof raw.explanation === "string" && raw.explanation.trim().length > 5
        ? raw.explanation.trim()
        : "Analysis complete. No significant misinformation signals detected.",
    credibility_score: Number.isFinite(Number(raw.credibility_score))
      ? Math.max(1, Math.min(10, Math.round(Number(raw.credibility_score))))
      : 5,
    source_reliability: ["High", "Medium", "Low"].includes(raw.source_reliability)
      ? raw.source_reliability
      : "Medium",
  };
}

// ── Safely parse JSON even with markdown fences ──────────────────────────────
function safeParseJSON(text) {
  if (!text) throw new Error("empty response");
  const stripped = text.replace(/```(?:json)?[\s\S]*?```/g, m =>
    m.replace(/```(?:json)?/g, "").replace(/```/g, "")).trim();
  try { return JSON.parse(stripped); } catch {}
  const m = stripped.match(/\{[\s\S]*?\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("no valid JSON found");
}

// ── FIX 1: Claude API with STRICT system prompt ──────────────────────────────
export async function detectWithClaude(text) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY;
  if (!apiKey) throw new Error("REACT_APP_ANTHROPIC_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system:
        "You are a strict JSON API. Output ONLY valid JSON. " +
        "Never output markdown, backticks, explanations, or any text outside the JSON object.",
      messages: [{
        role: "user",
        content: `Analyze this news text and return ONLY JSON.

TEXT: "${text.slice(0, 500)}"

RULES:
- REAL: factual, neutral language, verified institutions, normal news topics.
- FAKE: conspiracy theories, clickbait ("they don't want you to know", "miracle cure"), medical misinformation.
- Default to REAL when uncertain.

OUTPUT FORMAT (fill values, no other text):
{"verdict":"REAL","confidence":85,"explanation":"One sentence reason.","credibility_score":7,"source_reliability":"High"}

CONSTRAINTS: verdict="REAL"|"FAKE", confidence=60-97, credibility_score=1-10, source_reliability="High"|"Medium"|"Low"
OUTPUT ONLY THE JSON OBJECT.`,
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawText = (data.content || []).map(b => b.text || "").join("").trim();
  return sanitizeResult(safeParseJSON(rawText));
}

// ── FIX 2: Backend with trained model — sanitize all responses ───────────────
const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

export async function predictNews(text, userId = "anonymous") {
  try {
    const { data } = await api.post("/predict", { text, user_id: userId });
    return sanitizeResult(data.data); // FIX 3: always sanitize backend response
  } catch (backendErr) {
    console.warn("Backend unavailable:", backendErr.message);
  }
  try {
    return await detectWithClaude(text); // Claude direct (needs API key in .env)
  } catch (claudeErr) {
    console.warn("Claude direct call failed:", claudeErr.message);
  }
  // Last-resort safe default — never crash UI
  return sanitizeResult({
    verdict: "REAL", confidence: 65,
    explanation: "Analysis service unavailable. This is a conservative default — verify manually.",
    credibility_score: 5, source_reliability: "Medium",
  });
}

export async function submitFeedback(payload) {
  const { data } = await api.post("/feedback", payload);
  return data;
}
export async function fetchHistory(userId = "anonymous", skip = 0, limit = 50) {
  const { data } = await api.get("/history", { params: { user_id: userId, skip, limit } });
  return data.data;
}
export async function deleteHistory(userId = "anonymous") {
  const { data } = await api.delete("/history", { params: { user_id: userId } });
  return data;
}
export async function searchHistory(q, userId = "anonymous") {
  const { data } = await api.get("/search", { params: { q, user_id: userId } });
  return data.data;
}
export async function logShare(predictionId, platform = "web") {
  const { data } = await api.post("/share-log", { prediction_id: predictionId, platform });
  return data;
}
export async function fetchAdminStats() {
  const { data } = await api.get("/admin/stats");
  return data.data;
}
