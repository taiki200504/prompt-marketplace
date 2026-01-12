'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Offline icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] mb-8">
          <svg
            className="w-12 h-12 text-[var(--text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          オフラインです
        </h1>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          現在インターネットに接続されていません。
          接続が回復すると、自動的にページが更新されます。
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary mb-4"
        >
          再試行
        </button>

        {/* Cached pages hint */}
        <div className="mt-8 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)] mb-3">
            キャッシュ済みのページにアクセスできます：
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 bg-[var(--bg-secondary)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors"
            >
              ホーム
            </Link>
            <Link
              href="/prompts"
              className="px-3 py-1.5 bg-[var(--bg-secondary)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors"
            >
              プロンプト
            </Link>
          </div>
        </div>

        {/* Connection status indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--error)] animate-pulse" />
          <span>接続待機中...</span>
        </div>
      </div>
    </div>
  )
}
