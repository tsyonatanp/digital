import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "לוח מודעות דיגיטלי",
  description: "מערכת לוח מודעות דיגיטלי לבניינים - תצוגה על גבי טלוויזיה עם ממשק ניהול מובייל",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
