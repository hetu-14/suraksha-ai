import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399",
          500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b",
        },
        ink: {
          50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
          500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,.04), 0 8px 24px -8px rgba(15,23,42,.12)",
      },
      keyframes: {
        fade: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "none" } },
        slideIn: { "0%": { opacity: "0", transform: "translateX(-8px)" }, "100%": { opacity: "1", transform: "none" } },
        ring: { "0%": { boxShadow: "0 0 0 0 rgba(239,68,68,.55)" }, "70%": { boxShadow: "0 0 0 16px rgba(239,68,68,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" } },
      },
      animation: {
        fade: "fade .35s ease",
        slideIn: "slideIn .4s ease",
        ring: "ring 1.4s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
