import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./legacy.css"; // the original site's stylesheet, verbatim
import HiddenNetlifyForms from "../components/HiddenNetlifyForms";

export const metadata: Metadata = {
  title: "شجرة العائلة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* نسخة ثابتة مخفية من كل الفورمات — عشان Netlify يكتشفها وقت الـ build
            حتى لو الـ modals الحقيقية مقفولة بالحالة الافتراضية */}
        <HiddenNetlifyForms />

        {/* Same three third-party libraries the original page loaded, loaded in the
            same order, before the legacy script runs (see LegacyTreeApp.tsx). */}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="beforeInteractive" />
        <Script src="https://d3js.org/d3.v7.min.js" strategy="beforeInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
