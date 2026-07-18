import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHistory } from "../context/HistoryContext";
import { Badge, StatCard, EmptyState } from "../components/UI";

export default function AdminPage() {
  const { history } = useHistory();
  const navigate    = useNavigate();
  const [tab, setTab] = useState("overview"); // overview | activity | feedback

  const fakeCount = history.filter((h) => h.result.verdict === "FAKE").length;
  const realCount = history.filter((h) => h.result.verdict === "REAL").length;
  const avgConf   = history.length
    ? Math.round(history.reduce((a, h) => a + h.result.confidence, 0) / history.length)
    : 0;

  const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "activity", label: "📰 Activity"  },
    { id: "feedback", label: "💬 Feedback"  },
  ];

  // Mock feedback data
  const feedbackItems = [
    { rating: 5, message: "Very accurate and fast! Detected fake news perfectly.", time: "Apr 24, 2025 · 9:00 AM" },
    { rating: 4, message: "Great tool, very easy to use.", time: "Apr 23, 2025 · 3:15 PM" },
    { rating: 5, message: "Excellent! Caught the fake article immediately.", time: "Apr 22, 2025 · 11:00 AM" },
  ];

  return (
    <div className="page-wrapper">
      {/* Sub-header */}
      <div className="page-header">
        <div className="max-w-2xl mx-auto">
          <button
            className="text-blue-600 dark:text-blue-400 font-bold text-sm bg-transparent border-none cursor-pointer p-0 mb-2"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">⚙️ Admin Dashboard</h2>
            <span className="text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full">
              ● Live
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Tab bar */}
        <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 gap-1 mb-5 shadow-card">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 border-none cursor-pointer
                          ${tab === id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ─────────────────────────────────── */}
        {tab === "overview" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <StatCard icon="👥" value="1"         label="Active Users"    color="text-blue-600" />
              <StatCard icon="📰" value={history.length} label="Total Checks"  color="text-violet-600" />
              <StatCard icon="⚠️" value={fakeCount}  label="Fake Detected"  color="text-red-500" />
              <StatCard icon="✅" value={realCount}  label="Real News"      color="text-green-500" />
              <StatCard icon="📊" value={`${avgConf}%`} label="Avg Confidence" color="text-amber-500" />
              <StatCard icon="⭐" value="4.8"        label="Avg Rating"     color="text-amber-400" />
            </div>

            {/* Detection ratio bar */}
            {history.length > 0 && (
              <div className="card mb-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Detection Ratio</h3>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                  <div
                    className="bg-red-400 flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                    style={{ width: `${Math.round((fakeCount / history.length) * 100)}%` }}
                  >
                    {fakeCount > 0 && `${Math.round((fakeCount / history.length) * 100)}%`}
                  </div>
                  <div
                    className="bg-green-400 flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                    style={{ width: `${Math.round((realCount / history.length) * 100)}%` }}
                  >
                    {realCount > 0 && `${Math.round((realCount / history.length) * 100)}%`}
                  </div>
                </div>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Fake
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Real
                  </span>
                </div>
              </div>
            )}

            {/* System info */}
            <div className="card">
              <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">System Info</h3>
              <div className="space-y-2.5">
                {[
                  ["Model",      "Claude Opus 4.5 + LIAR Dataset", "text-blue-600"],
                  ["Database",   "MongoDB 7.0",                  "text-green-600"],
                  ["Backend",    "Flask 3.0 / Python 3.12",      "text-violet-600"],
                  ["Frontend",   "React 18 + Tailwind CSS",      "text-amber-600"],
                  ["Status",     "Operational ✓",                "text-green-600"],
                ].map(([k, v, col]) => (
                  <div key={k} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-slate-400 font-medium">{k}</span>
                    <span className={`font-bold ${col}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Activity tab ─────────────────────────────────── */}
        {tab === "activity" && (
          <div className="animate-fade-in">
            {history.length === 0 ? (
              <EmptyState icon="📭" title="No activity yet" subtitle="Checks will appear here" />
            ) : (
              <div className="flex flex-col gap-3">
                {history.slice(0, 20).map((h) => (
                  <div
                    key={h.id}
                    className="card !p-4 flex items-center gap-3 border-l-4"
                    style={{ borderLeftColor: h.result.verdict === "FAKE" ? "#ef4444" : "#22c55e" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {h.text.slice(0, 80)}{h.text.length > 80 ? "…" : ""}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {h.time} · {h.result.confidence}% · Credibility {h.result.credibility_score}/10
                      </p>
                    </div>
                    <Badge verdict={h.result.verdict} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Feedback tab ─────────────────────────────────── */}
        {tab === "feedback" && (
          <div className="animate-fade-in flex flex-col gap-3">
            {feedbackItems.map((f, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-lg ${s <= f.rating ? "text-amber-400" : "text-gray-300 dark:text-slate-600"}`}>★</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{f.time}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{f.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button className="btn-primary" onClick={() => navigate("/")}>🏠 Back to Home</button>
          <button className="btn-outline"  onClick={() => navigate("/history")}>📋 View All History</button>
        </div>
      </div>
    </div>
  );
}
