'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold mb-4">エラーが発生しました</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            {error.digest && (
              <p className="text-xs text-[var(--text-muted)] mb-4">
                エラーID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="btn btn-primary"
            >
              もう一度試す
            </button>
            <Link href="/" className="btn btn-secondary">
              ホームに戻る
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm text-[var(--text-muted)] mb-2">
                開発者向け情報
              </summary>
              <pre className="bg-[var(--bg-primary)] p-4 rounded-lg text-xs overflow-auto border border-[var(--border-subtle)]">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
