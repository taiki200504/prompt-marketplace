import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import PWAInstall from "@/components/PWAInstall";

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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="noise-bg">
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <PWAInstall />
          <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="container py-12 sm:py-14">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10">
                <div className="sm:col-span-2">
                  <span className="text-lg font-semibold tracking-tight">
                    <span className="text-gradient">Prompt</span>
                    <span className="text-[var(--text-primary)]">Market</span>
                  </span>
                  <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed mt-3">
                    高品質なAIプロンプトを発見・共有・収益化できるマーケットプレイス。
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">探索</h4>
                  <ul className="space-y-2">
                    <li><Link href="/prompts" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">すべてのプロンプト</Link></li>
                    <li><Link href="/prompts?sort=trending" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">トレンド</Link></li>
                    <li><Link href="/prompts?free=true" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">無料プロンプト</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">クリエイター</h4>
                  <ul className="space-y-2">
                    <li><Link href="/create" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">プロンプトを投稿</Link></li>
                    <li><Link href="/signup" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">アカウント作成</Link></li>
                    <li><Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">ログイン</Link></li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-muted)]">
                  &copy; 2026 PromptMarket
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Made in Japan
                </p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
