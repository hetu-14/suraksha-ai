import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuRaksha AI — The Intelligent Operating System for City Gas Distribution",
  description:
    "Customer experience, safety & operations, and business intelligence — unified AI platform for City Gas Distribution.",
};

// `maximumScale`/`userScalable` are deliberately left permissive: pinch-zoom to
// 200%+ is an accessibility requirement (WCAG 1.4.4), not a bug to suppress.
// `viewportFit: cover` lets the crisis call bar sit in the home-indicator area
// while `env(safe-area-inset-*)` keeps its content clear of the notch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0c0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans text-ink-800 antialiased">{children}</body>
    </html>
  );
}
