import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PromptCard from '@/components/PromptCard'

// 動的レンダリングを強制（ビルド時の静的生成を無効化）
export const dynamic = 'force-dynamic'

async function getPrompts(sort: 'trending' | 'new' | 'free', limit: number = 6) {
  try {
    const where: Record<string, unknown> = { isPublished: true }
    if (sort === 'free') {
      where.priceJPY = 0
    }

    const prompts = await prisma.prompt.findMany({
    where,
    include: {
      owner: {
        select: { id: true, username: true, displayName: true },
      },
      reviews: { select: { rating: true } },
      purchases: { select: { id: true } },
      resultLogs: { select: { id: true } },
    },
    take: limit,
    orderBy: sort === 'new' ? { publishedAt: 'desc' } : { views: 'desc' },
  })

  return prompts.map((prompt) => {
    const avgRating =
      prompt.reviews.length > 0
        ? prompt.reviews.reduce((sum, r) => sum + r.rating, 0) / prompt.reviews.length
        : 0

    const now = new Date()
    const daysSincePublished = prompt.publishedAt
      ? Math.floor((now.getTime() - new Date(prompt.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    const newnessBoost = Math.max(0, 7 - daysSincePublished) * 0.5
    const trendingScore =
      prompt.views * 0.05 +
      prompt.purchases.length * 1.5 +
      avgRating * 2 +
      prompt.resultLogs.length * 1.2 +
      newnessBoost

    return {
      id: prompt.id,
      title: prompt.title,
      shortDescription: prompt.shortDescription,
      category: prompt.category,
      priceJPY: prompt.priceJPY,
      views: prompt.views,
      thumbnailUrl: prompt.thumbnailUrl,
      owner: prompt.owner,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: prompt.reviews.length,
      purchaseCount: prompt.purchases.length,
      trendingScore: Math.round(trendingScore * 100) / 100,
    }
  }).sort((a, b) => sort === 'trending' ? b.trendingScore - a.trendingScore : 0)
  } catch (error) {
    console.error(`Error fetching ${sort} prompts:`, error)
    return []
  }
}

async function getTotalCount() {
  try {
    return await prisma.prompt.count({ where: { isPublished: true } })
  } catch {
    return 0
  }
}

export default async function Home() {
  const [trending, recent, free, totalCount] = await Promise.all([
    getPrompts('trending'),
    getPrompts('new'),
    getPrompts('free'),
    getTotalCount(),
  ])

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[var(--gold)]/[0.03] rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
              backgroundSize: '64px 64px'
            }}
          />
        </div>

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--gold-muted)] border border-[var(--border-accent)] mb-6 sm:mb-8">
              <span className="text-[var(--gold)] text-[11px] font-semibold uppercase tracking-wider">プレミアムAIプロンプト</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 sm:mb-6 leading-[1.1]">
              <span className="text-[var(--text-primary)]">AIプロンプトの</span>
              <br />
              <span className="text-gradient">マーケットプレイス</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed px-4 sm:px-0">
              厳選された高品質プロンプトを発見・共有・収益化。
              <br className="hidden sm:block" />
              成果を可視化して、ビジネスを加速させよう。
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/prompts" className="btn btn-primary btn-lg group">
                <span>プロンプトを探す</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
              <Link href="/signup" className="btn btn-secondary btn-lg">
                クリエイターになる
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-12 sm:py-16 border-y border-[var(--border-subtle)]">
        <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
        <div className="container relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="stat-card">
              <p className="stat-value">{totalCount || '—'}</p>
              <p className="stat-label">公開プロンプト</p>
            </div>
            <div className="stat-card">
              <p className="stat-value">7</p>
              <p className="stat-label">カテゴリ</p>
            </div>
            <div className="stat-card">
              <p className="stat-value">100%</p>
              <p className="stat-label">品質保証</p>
            </div>
            <div className="stat-card">
              <p className="stat-value">80%</p>
              <p className="stat-label">還元率</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider">Trending</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1">
                今注目のプロンプト
              </h2>
            </div>
            <Link
              href="/prompts?sort=trending"
              className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
            >
              すべて見る <span>→</span>
            </Link>
          </div>

          {trending.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trending.map((prompt) => (
                <PromptCard key={prompt.id} {...prompt} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <p className="text-[var(--text-muted)] mb-4">まだプロンプトがありません</p>
              <Link href="/create" className="btn btn-primary">最初のプロンプトを投稿</Link>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/prompts?sort=trending" className="btn btn-ghost text-sm">
              すべて見る →
            </Link>
          </div>
        </div>
      </section>

      {/* New Section */}
      <section className="py-16 sm:py-20 bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-semibold text-[var(--accent-secondary)] uppercase tracking-wider">New</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1">
                最新のプロンプト
              </h2>
            </div>
            <Link
              href="/prompts?sort=new"
              className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
            >
              すべて見る <span>→</span>
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.map((prompt) => (
                <PromptCard key={prompt.id} {...prompt} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <p className="text-[var(--text-muted)]">新着プロンプトはありません</p>
            </div>
          )}
        </div>
      </section>

      {/* Free Section */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-semibold text-[var(--success)] uppercase tracking-wider">Free</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1">
                無料プロンプト
              </h2>
            </div>
            <Link
              href="/prompts?free=true"
              className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
            >
              すべて見る <span>→</span>
            </Link>
          </div>

          {free.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {free.map((prompt) => (
                <PromptCard key={prompt.id} {...prompt} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <p className="text-[var(--text-muted)]">無料プロンプトはありません</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[var(--gold)]/[0.03] rounded-full blur-[100px]" />
        </div>

        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              あなたのプロンプトを
              <span className="text-gradient"> 収益化 </span>
              しよう
            </h2>

            <p className="text-[var(--text-secondary)] mb-8 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
              優れたプロンプトを共有して収益を得ましょう。
              売上の<span className="text-[var(--gold)] font-semibold">80%</span>があなたの収益になります。
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/signup" className="btn btn-primary btn-lg">
                今すぐ始める
              </Link>
              <Link href="/prompts" className="btn btn-outline btn-lg">
                詳しく見る
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
