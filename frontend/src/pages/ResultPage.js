import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ConfidenceBar } from "../components/UI";

export default function ResultPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();

  if (!state?.result) {
    navigate("/");
    return null;
  }

  const { result, newsText } = state;
  const isFake = result.verdict === "FAKE";

  const handleShare = async () => {
    const shareData = {
      title: "Fake News Detection Result",
      text: `"${newsText.slice(0, 80)}..." is ${result.verdict} — ${result.confidence}% confidence.`,
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); toast.success("Shared!"); }
      catch { toast("Share cancelled", { icon: "ℹ️" }); }
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="page-wrapper flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <h2 className="text-xl font-extrabold text-center text-gray-900 dark:text-white mb-6 animate-fade-in">
          Detection Result
        </h2>

        {/* Verdict hero card */}
        <div className={`rounded-2xl p-9 text-center mb-4 shadow-xl animate-fade-in
                         ${isFake
                           ? "bg-gradient-to-br from-slate-800 to-gray-700"
                           : "bg-gradient-to-br from-slate-800 to-emerald-900"}`}>
          <div
            className={`inline-block rounded-xl px-7 py-3 text-white text-lg font-black tracking-widest
                         ${isFake
                           ? "bg-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.5)]"
                           : "bg-green-500 shadow-[0_4px_20px_rgba(34,197,94,0.5)]"}`}
            style={isFake ? { animation: "pulseBadge 2s infinite" } : {}}
          >
            {isFake ? "⚠ NEWS IS FAKE" : "✓ NEWS IS REAL"}
          </div>
        </div>

        {/* Details card */}
        <div className="card mb-4 animate-fade-in">
          <ConfidenceBar score={result.confidence} verdict={result.verdict} />

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Credibility</p>
              <p className={`text-xl font-black ${result.credibility_score >= 6 ? "text-green-500" : "text-red-500"}`}>
                {result.credibility_score}/10
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Source</p>
              <p className={`text-sm font-black
                ${result.source_reliability === "High" ? "text-green-500"
                  : result.source_reliability === "Medium" ? "text-amber-500"
                  : "text-red-500"}`}>
                {result.source_reliability}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-1.5">Explanation</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{result.explanation}</p>
          </div>

          {/* Analyzed snippet */}
          {newsText && (
            <div className="mt-4 bg-gray-50 dark:bg-slate-700 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Analyzed Text</p>
              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
                {newsText.slice(0, 140)}{newsText.length > 140 ? "…" : ""}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 animate-fade-in">
          <button className="btn-primary" onClick={() => navigate("/")}>🔍 Check Another News</button>
          <button className="btn-outline"  onClick={() => navigate("/history")}>📋 View History</button>
          <button className="btn-warning"  onClick={() => navigate("/feedback")}>⭐ Give Feedback</button>
          <button className="btn-purple"   onClick={handleShare}>📤 Share Result</button>
        </div>
      </div>
    </div>
  );
}
