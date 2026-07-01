import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SuRaksha AI — CGD Safety, Trust & Compliance Intelligence",
  description:
    "The AI layer that catches what humans miss across safety, customer trust, revenue and compliance for City Gas Distribution.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-ink-800 antialiased">{children}</body>
    </html>
  );
}
