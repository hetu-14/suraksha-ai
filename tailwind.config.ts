import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Explicit ladder rather than Tailwind's default five. `xs` catches the
    // 360–414px band where two-up KPI grids start to work; `3xl`/`4xl` exist so
    // ultrawide and 4K can gain columns instead of gaining empty margin.
    screens: {
      xs: "380px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Fluid ramp — type scales with the viewport instead of stepping at
      // breakpoints, so 375px, 834px, and 3440px each get a comfortable size.
      fontSize: {
        "fluid-h1": ["clamp(1.5rem, 1.15rem + 1.6vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "fluid-h2": ["clamp(1.125rem, 1rem + 0.6vw, 1.5rem)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "fluid-kpi": ["clamp(1.375rem, 1.15rem + 1vw, 1.875rem)", { lineHeight: "1.1" }],
        "fluid-body": ["clamp(0.875rem, 0.84rem + 0.15vw, 1rem)", { lineHeight: "1.6" }],
        // 12px floor (design guide §17) — never smaller, even for metadata.
        meta: ["0.75rem", { lineHeight: "1.4" }],
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom, 0px)",
        "safe-t": "env(safe-area-inset-top, 0px)",
        "safe-l": "env(safe-area-inset-left, 0px)",
        "safe-r": "env(safe-area-inset-right, 0px)",
        // Clears the mobile bottom tab bar (56px + safe area).
        "bottom-nav": "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
      },
      minHeight: {
        tap: "44px",       // WCAG 2.5.5 floor
        "tap-lg": "48px",  // preferred comfortable target
        crisis: "56px",    // crisis archetype (design guide §20A)
      },
      maxWidth: {
        // Reading measure for narrative/explanatory pages.
        prose: "72ch",
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
