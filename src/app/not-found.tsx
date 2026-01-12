import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold mb-4">ページが見つかりません</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              お探しのページは存在しないか、移動または削除された可能性があります。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn btn-primary">
              ホームに戻る
            </Link>
            <Link href="/prompts" className="btn btn-secondary">
              プロンプトを探す
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <Link
              href="/prompts"
              className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors"
            >
              <h3 className="font-medium mb-1">プロンプトを探す</h3>
              <p className="text-sm text-[var(--text-muted)]">
                高品質なAIプロンプトを発見
              </p>
            </Link>
            <Link
              href="/create"
              className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors"
            >
              <h3 className="font-medium mb-1">プロンプトを作成</h3>
              <p className="text-sm text-[var(--text-muted)]">
                あなたのプロンプトを共有
              </p>
            </Link>
            <Link
              href="/dashboard"
              className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors"
            >
              <h3 className="font-medium mb-1">ダッシュボード</h3>
              <p className="text-sm text-[var(--text-muted)]">
                パフォーマンスを確認
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
