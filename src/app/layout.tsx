import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين | نظام متابعة المعلمين",
  description: "نظام إلكتروني لمتابعة وتقييم تفعيل المعلمين للمنصات التعليمية ونظام قطر للتعليم - مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
