import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useHistory } from "../context/HistoryContext";
import { Badge, EmptyState } from "../components/UI";
import { exportHistoryCSV } from "../utils/exportCSV";

export default function HistoryPage() {
  const { history, clearHistory } = useHistory();
  const [search, setSearch]       = useState("");
  const navigate                  = useNavigate();

  const filtered = history.filter((h) =>
    h.text.toLowerCase().includes(search.toLowerCase())
  );

  const fakeCount = history.filter((h) => h.result.verdict === "FAKE").length;
  const realCount = history.filter((h) => h.result.verdict === "REAL").length;

  const handleClear = () => {
    clearHistory();
    toast.success("History cleared!");
  };

  const handleExport = () => {
    if (!history.length) { toast.error("Nothing to export!"); return; }
    exportHistoryCSV(history);
    toast.success("CSV exported!");
  };

  return (
    <div className="page-wrapper">
      {/* Sticky sub-header */}
      <div className="page-header">
        <div className="max-w-lg mx-auto">
          <button className="text-blue-600 dark:text-blue-400 font-bold text-sm bg-transparent border-none cursor-pointer p-0 mb-2"
            onClick={() => navigate(-1)}>← Back</button>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">📋 Checked News History</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search News..."
            className="input-field !pl-10"
          />
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { val: history.length, lbl: "Total",  color: "text-blue-600" },
              { val: fakeCount,      lbl: "Fake",   color: "text-red-500"  },
              { val: realCount,      lbl: "Real",   color: "text-green-500"},
            ].map((s) => (
              <div key={s.lbl} className="card text-center !p-3 animate-fade-in">
                <div className={`text-2xl font-extrabold ${s.color}`}>{s.val}</div>
                <div className="text-xs text-gray-400 dark:text-slate-500">{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={history.length === 0 ? "📭" : "🔍"}
            title={history.length === 0 ? "No history yet" : "No matching results"}
            subtitle={history.length === 0 ? "Check your first news article!" : "Try a different keyword"}
          />
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="card !p-4 flex items-center gap-3 animate-fade-in
                           border-l-4 hover:shadow-card-hover transition-shadow cursor-pointer"
                style={{ borderLeftColor: item.result.verdict === "FAKE" ? "#ef4444" : "#22c55e" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {item.text.slice(0, 90)}{item.text.length > 90 ? "…" : ""}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {item.time} · {item.result.confidence}% confidence
                  </p>
                </div>
                <Badge verdict={item.result.verdict} />
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {history.length > 0 && (
            <>
              <button className="btn-success" onClick={handleExport}>📊 Export to CSV</button>
              <button className="btn-danger"  onClick={handleClear}>🗑 Clear History</button>
            </>
          )}
          <button className="btn-outline" onClick={() => navigate("/feedback")}>⭐ Give Feedback</button>
        </div>
      </div>
    </div>
  );
}
