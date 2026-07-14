import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuRaksha AI — The Intelligent Operating System for City Gas Distribution",
  description:
    "Customer experience, safety & operations, and business intelligence — unified AI platform for City Gas Distribution.",
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
