import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CashWise — Smart Financial Management Platform',
  description: 'Aplikasi pengatur keuangan modern dengan arsitektur Hybrid Offline-First (Local-First IndexedDB)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var t = localStorage.getItem("cashwise-theme") || "system";
                  var dark = t === "dark" || (t === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  if (dark) document.documentElement.classList.add("dark");
                  else document.documentElement.classList.remove("dark");

                  var bgStr = localStorage.getItem("cashwise-custom-bg");
                  if (bgStr) {
                    var bg = JSON.parse(bgStr);
                    if (bg.light) {
                      if (bg.light.primary) document.documentElement.style.setProperty("--cw-primary-bg", bg.light.primary);
                      if (bg.light.card) document.documentElement.style.setProperty("--cw-card-bg", bg.light.card);
                      if (bg.light.secondary) document.documentElement.style.setProperty("--cw-secondary-bg", bg.light.secondary);
                    }
                    if (bg.dark) {
                      if (bg.dark.primary) document.documentElement.style.setProperty("--cw-dark-primary-bg", bg.dark.primary);
                      if (bg.dark.card) document.documentElement.style.setProperty("--cw-dark-card-bg", bg.dark.card);
                      if (bg.dark.secondary) document.documentElement.style.setProperty("--cw-dark-secondary-bg", bg.dark.secondary);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-light-background dark:bg-dark-background text-light-on-background dark:text-dark-on-background font-body antialiased transition-colors duration-state-change">
        {children}
      </body>
    </html>
  );
}
