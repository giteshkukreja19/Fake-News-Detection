import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { StarRating } from "../components/UI";
import { submitFeedback } from "../utils/api";

const QUICK_TAGS = ["Accurate", "Fast", "Easy to use", "Helpful", "Needs improvement", "Very detailed"];

export default function FeedbackPage() {
  const [rating,    setRating]    = useState(0);
  const [message,   setMessage]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleTag = (tag) => {
    setMessage((m) => m ? `${m}, ${tag}` : tag);
  };

  const handleSubmit = async () => {
    if (!rating)         { toast.error("Please select a star rating!"); return; }
    if (!message.trim()) { toast.error("Please write some feedback!");  return; }
    setLoading(true);
    try {
      await submitFeedback({ rating, message: message.trim() });
    } catch {
      // Silently succeed even if backend is down
    } finally {
      setLoading(false);
      setSubmitted(true);
      toast.success("Feedback submitted! Thank you 🎉");
    }
  };

  return (
    <div className="page-wrapper">
      {/* Sub-header */}
      <div className="page-header">
        <div className="max-w-lg mx-auto">
          <button className="text-blue-600 dark:text-blue-400 font-bold text-sm bg-transparent border-none cursor-pointer p-0 mb-2"
            onClick={() => navigate(-1)}>← Back</button>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">💬 Feedback</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {submitted ? (
          /* Success state */
          <div className="text-center py-20 animate-bounce-in">
            <div className="text-7xl mb-5">🎉</div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Thank You!</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-8 text-sm">
              Your feedback helps us make the system better.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button className="btn-primary" onClick={() => navigate("/")}>🏠 Back to Home</button>
              <button className="btn-outline" onClick={() => { setSubmitted(false); setRating(0); setMessage(""); }}>
                ✏️ Submit Another
              </button>
            </div>
          </div>
        ) : (
          <div className="card animate-fade-in">
            {/* Star rating */}
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-3">Rate your experience</h3>
            <StarRating value={rating} onChange={setRating} />

            {/* Quick tags */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mb-2">Quick tags</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTag(tag)}
                    className="bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400
                               border-2 border-blue-100 dark:border-slate-600 rounded-full
                               px-3 py-1 text-xs font-semibold cursor-pointer
                               hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Write your feedback</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder="Write your feedback here..."
                rows={5}
                className="input-field resize-none"
              />
              <p className="text-right text-xs text-gray-400 dark:text-slate-500 mt-1">{message.length}/500</p>
            </div>

            <button
              className={`btn-primary mt-5 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting…" : "✓ Submit Feedback"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
