import React, { useState, useEffect } from "react";

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ verdict }) {
  return verdict === "FAKE"
    ? <span className="badge-fake">Fake</span>
    : <span className="badge-real">Real</span>;
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ label = "Analyzing news content..." }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div
        className="w-12 h-12 rounded-full border-4 border-blue-100 dark:border-slate-600"
        style={{ borderTopColor: "#2563eb", animation: "spin 0.8s linear infinite" }}
      />
      <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{label}</p>
    </div>
  );
}

// ── Confidence bar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ score, verdict }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(score), 120); return () => clearTimeout(t); }, [score]);
  const color = verdict === "FAKE" ? "#ef4444" : "#22c55e";
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Confidence Score</span>
        <span className="text-xs font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Star rating ──────────────────────────────────────────────────────────────
export function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => !readonly && onChange(s)}
            onMouseEnter={() => !readonly && setHover(s)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`text-3xl transition-all duration-100 bg-transparent border-none cursor-pointer p-0
                        ${readonly ? "cursor-default" : "hover:scale-110"}
                        ${s <= (hover || value) ? "text-amber-400" : "text-gray-300 dark:text-slate-600"}`}
          >★</button>
        ))}
      </div>
      {!readonly && (hover || value) > 0 && (
        <p className="text-xs font-semibold text-amber-500 mt-1.5">
          {labels[hover || value]} {hover || value === 5 ? "🤩" : hover || value === 4 ? "😊" : hover || value === 3 ? "🙂" : hover || value === 2 ? "😐" : "😞"}
        </p>
      )}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ icon, value, label, color = "text-blue-600" }) {
  return (
    <div className="card flex items-center gap-3.5 animate-fade-in">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-blue-50 dark:bg-slate-700 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-extrabold leading-tight ${color}`}>{value}</div>
        <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ── Page back button ──────────────────────────────────────────────────────────
export function BackButton({ onClick, label = "← Back" }) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent border-none text-blue-600 dark:text-blue-400 font-bold
                 cursor-pointer text-sm p-0 mb-3 hover:underline"
    >
      {label}
    </button>
  );
}

// ── Section divider ──────────────────────────────────────────────────────────
export function Divider() {
  return <hr className="border-gray-100 dark:border-slate-700 my-4" />;
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="font-bold text-gray-600 dark:text-slate-300 mb-1">{title}</p>
      <p className="text-sm text-gray-400 dark:text-slate-500">{subtitle}</p>
    </div>
  );
}
