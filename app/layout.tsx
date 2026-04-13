import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniCamp 2026 — ניהול תקציב",
  description: "מערכת ניהול תקציב לקמפים — UniCamp 2026 | We Are The Camp",
  openGraph: {
    title: "UniCamp 2026 — ניהול תקציב",
    description: "מערכת ניהול תקציב לקמפים — UniCamp 2026 | We Are The Camp",
    images: [{ url: "/unicamp-logo.jpeg", width: 512, height: 512, alt: "UniCamp Logo" }],
    siteName: "UniCamp Budgets",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "UniCamp 2026 — ניהול תקציב",
    description: "מערכת ניהול תקציב לקמפים — UniCamp 2026",
    images: ["/unicamp-logo.jpeg"],
  },
  icons: {
    icon: "/unicamp-logo.jpeg",
    apple: "/unicamp-logo.jpeg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          // Apply theme before hydration to avoid FOUC. Default is dark.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var isDark=s?s==='dark':true;document.documentElement.classList.toggle('dark',isDark);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" dir="rtl" richColors />
      </body>
    </html>
  );
}
