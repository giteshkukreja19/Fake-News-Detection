import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";

export default function Navbar() {
  const { dark, toggle } = useDarkMode();
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/",        label: "Home",    icon: "🏠" },
    { to: "/history", label: "History", icon: "📋" },
    { to: "/admin",   label: "Admin",   icon: "⚙️" },
  ];

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700
                    sticky top-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600
                          flex items-center justify-center text-base shadow-md">
            🔍
          </div>
          <span className="font-extrabold text-gray-900 dark:text-white text-sm tracking-tight">
            FakeNews<span className="text-blue-600">AI</span>
          </span>
        </Link>

        {/* Links + toggle */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                          transition-colors no-underline
                          ${pathname === to
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
          <button
            onClick={toggle}
            className="ml-2 w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center
                       justify-center text-sm font-bold text-gray-700 dark:text-slate-300
                       hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            title="Toggle dark mode"
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="sm:hidden flex border-t border-gray-100 dark:border-slate-700">
        {navLinks.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-bold no-underline gap-0.5
                        transition-colors
                        ${pathname === to
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-slate-500"}`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
