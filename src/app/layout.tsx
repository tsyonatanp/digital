import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/auth/AuthProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import { ToastProvider } from "../components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "לוח מודעות דיגיטלי",
  description: "מערכת לוח מודעות דיגיטלי לבניינים - תצוגה על גבי טלוויזיה עם ממשק ניהול מובייל",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
