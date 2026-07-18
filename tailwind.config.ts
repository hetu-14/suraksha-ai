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
        // Deep pine green — calm, trustworthy, not neon (design guide §14.2)
        brand: {
          50: "#f0f7f4", 100: "#dcede5", 200: "#b9dccc", 300: "#8cc4ab", 400: "#57a585",
          500: "#2e8a67", 600: "#136f51", 700: "#0f5c43", 800: "#0c4a37", 900: "#0a3d2e", 950: "#06281e",
        },
        // Warm neutrals — replaces the synthetic blue-grey ramp (design guide §14.1)
        ink: {
          50: "#fafaf8", 100: "#f4f4f1", 150: "#ededea", 200: "#e6e5e1", 300: "#d3d2cd",
          400: "#9a9994", 500: "#6e6d68", 600: "#55544f", 700: "#3f3e39", 800: "#2b2a27",
          900: "#171614", 950: "#0d0c0b",
        },
        // Semantic status colors — identical across all suites (design guide §14.3)
        critical: "#b42318",
        warning: "#b54708",
        success: "#067647",
        info: "#175cd3",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,22,20,.05)",
        float: "0 4px 16px -4px rgba(23,22,20,.12)",
      },
      keyframes: {
        fade: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "none" } },
        slideIn: { "0%": { opacity: "0", transform: "translateX(-8px)" }, "100%": { opacity: "1", transform: "none" } },
        ring: { "0%": { boxShadow: "0 0 0 0 rgba(180,35,24,.55)" }, "70%": { boxShadow: "0 0 0 16px rgba(180,35,24,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(180,35,24,0)" } },
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
