import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PromptCard from '@/components/PromptCard'

interface Props {
  params: Promise<{ username: string }>
}

async function getUser(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      prompts: {
        where: { isPublished: true },
        include: {
          owner: { select: { id: true, username: true, displayName: true } },
          reviews: { select: { rating: true } },
          purchases: { select: { id: true } },
          resultLogs: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      reviews: { select: { id: true } },
      purchases: { select: { id: true } },
    },
  })

  return user
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const user = await getUser(username)

  if (!user) {
    notFound()
  }

  // Calculate stats
  const promptStats = user.prompts.map((prompt) => {
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
      owner: prompt.owner,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: prompt.reviews.length,
      purchaseCount: prompt.purchases.length,
      trendingScore: Math.round(trendingScore * 100) / 100,
    }
  })

  const totalSales = user.prompts.reduce(
    (sum, p) => sum + p.purchases.length * p.priceJPY * 0.8,
    0
  )
  const totalReviews = user.prompts.reduce((sum, p) => sum + p.reviews.length, 0)
  const avgRating =
    totalReviews > 0
      ? user.prompts.reduce(
          (sum, p) => sum + p.reviews.reduce((s, r) => s + r.rating, 0),
          0
        ) / totalReviews
      : 0

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-pink-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">
                {user.displayName || user.username}
              </h1>
              <p className="text-[var(--text-muted)] mb-3">@{user.username}</p>
              
              {user.bio && (
                <p className="text-[var(--text-secondary)] mb-4">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-[var(--text-muted)]">プロンプト</span>
                  <p className="text-xl font-semibold">{user.prompts.length}</p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">レビュー</span>
                  <p className="text-xl font-semibold">{totalReviews}</p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">平均評価</span>
                  <p className="text-xl font-semibold">
                    {avgRating > 0 ? (
                      <>
                        <span className="text-[var(--gold)]">★</span>
                        {avgRating.toFixed(1)}
                      </>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">推定収益</span>
                  <p className="text-xl font-semibold text-[var(--success)]">
                    ◆{Math.round(totalSales).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts */}
        <div>
          <h2 className="text-xl font-semibold mb-6">公開中のプロンプト</h2>
          
          {promptStats.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {promptStats.map((prompt) => (
                <PromptCard key={prompt.id} {...prompt} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <p className="text-[var(--text-muted)] mb-4">
                まだプロンプトを公開していません
              </p>
              <Link href="/create" className="btn btn-primary">
                最初のプロンプトを作成
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
