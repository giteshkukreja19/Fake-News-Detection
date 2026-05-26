/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.07)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.12)",
        btn: "0 4px 14px rgba(37,99,235,0.35)",
      },
      animation: {
        "spin-slow": "spin 1.5s linear infinite",
        "pulse-badge": "pulseBadge 2s infinite",
        "slide-up": "slideUp 0.3s ease",
        "fade-in": "fadeIn 0.4s ease",
        "bounce-in": "bounceIn 0.5s ease",
      },
      keyframes: {
        pulseBadge: {
          "0%,100%": { boxShadow: "0 4px 20px rgba(239,68,68,0.45)" },
          "50%": { boxShadow: "0 4px 30px rgba(239,68,68,0.7)" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: 0 },
          to:   { transform: "none", opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to:   { opacity: 1, transform: "none" },
        },
        bounceIn: {
          "0%":   { transform: "scale(0)" },
          "60%":  { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
