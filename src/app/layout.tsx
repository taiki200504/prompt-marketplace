import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import PWAInstall from "@/components/PWAInstall";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PromptMarket - Premium AI Prompt Marketplace",
  description: "高品質なAIプロンプトを売買・共有できるプレミアムマーケットプレイス。成果を可視化し、最適なプロンプトを見つけよう。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PromptMarket",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://promptmarket.app",
    siteName: "PromptMarket",
    title: "PromptMarket - Premium AI Prompt Marketplace",
    description: "高品質なAIプロンプトを売買・共有できるプレミアムマーケットプレイス",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptMarket - Premium AI Prompt Marketplace",
    description: "高品質なAIプロンプトを売買・共有できるプレミアムマーケットプレイス",
  },
};

export const viewport: Viewport = {
  themeColor: "#C9A227",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={dmSans.variable}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${dmSans.className} noise-bg`}>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <PWAInstall />
          <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="container py-16">
              <div className="grid md:grid-cols-4 gap-12 mb-12">
                {/* Brand */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-semibold tracking-tight">
                      <span className="text-gradient">Prompt</span>
                      <span className="text-[var(--text-primary)]">Market</span>
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
                    プロフェッショナルのためのAIプロンプトマーケットプレイス。
                    高品質なプロンプトを発見し、共有し、収益化。
                  </p>
                </div>

                {/* Links */}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
                    探索
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a href="/prompts" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        すべてのプロンプト
                      </a>
                    </li>
                    <li>
                      <a href="/prompts?sort=trending" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        トレンド
                      </a>
                    </li>
                    <li>
                      <a href="/prompts?free=true" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        無料プロンプト
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Support */}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
                    サポート
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a href="/create" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        プロンプトを投稿
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        ヘルプセンター
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        利用規約
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom */}
              <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[var(--text-muted)]">
                  © 2026 PromptMarket. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-[var(--text-muted)]">
                    Made with precision in Japan 🇯🇵
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
