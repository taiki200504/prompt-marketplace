'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardData {
  stats: {
    totalPrompts: number
    publishedPrompts: number
    totalViews: number
    totalPurchases: number
    totalRevenue: number
    avgRating: number
    totalReviews: number
    totalResultLogs: number
  }
  recentSales: {
    id: string
    promptTitle: string
    price: number
    createdAt: string
    buyerUsername: string
  }[]
  topPrompts: {
    id: string
    title: string
    views: number
    purchases: number
    avgRating: number
    revenue: number
  }[]
  monthlyStats: {
    month: string
    views: number
    purchases: number
    revenue: number
  }[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch(`/api/dashboard?period=${period}`)
        if (res.ok) {
          const data = await res.json()
          setData(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchDashboardData()
    }
  }, [session, period])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--gold)] border-t-transparent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-muted)]">データの読み込みに失敗しました</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 sm:py-16">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
              ダッシュボード
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              プロンプトのパフォーマンスを確認
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  period === p
                    ? 'bg-[var(--gold)] text-[var(--bg-primary)] font-medium'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p === '7d' ? '7日' : p === '30d' ? '30日' : p === '90d' ? '90日' : '全期間'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview - 4 key metrics only */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-2">総閲覧数</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {data.stats.totalViews.toLocaleString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-2">購入数</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {data.stats.totalPurchases.toLocaleString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-2">総収益</p>
            <p className="text-3xl font-bold text-[var(--gold)]">
              ¥{data.stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-2">平均評価</p>
            <p className="text-3xl font-bold text-[var(--warning)]">
              {data.stats.avgRating.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Top Performing Prompts */}
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              トップパフォーマンス
            </h2>
            {data.topPrompts.length > 0 ? (
              <div className="space-y-3">
                {data.topPrompts.map((prompt, index) => (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <span className="text-lg font-bold text-[var(--gold)] w-6">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate mb-1">
                        {prompt.title}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {prompt.purchases}件購入 ・ ★ {prompt.avgRating.toFixed(1)}
                      </p>
                    </div>
                    <p className="text-[var(--gold)] font-semibold whitespace-nowrap">
                      ¥{prompt.revenue.toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[var(--text-muted)] mb-4">
                  まだプロンプトがありません
                </p>
                <Link href="/create" className="btn btn-primary btn-sm">
                  プロンプトを作成
                </Link>
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              最近の売上
            </h2>
            {data.recentSales.length > 0 ? (
              <div className="space-y-3">
                {data.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)] mb-1">
                        {sale.promptTitle}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        @{sale.buyerUsername} ・ {new Date(sale.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <p className="text-[var(--success)] font-semibold whitespace-nowrap ml-4">
                      +¥{sale.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[var(--text-muted)]">
                  まだ売上がありません
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Stats - simplified */}
        {data.monthlyStats.length > 0 && (
          <div className="card p-6 sm:p-8 mb-12">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              月別推移
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {data.monthlyStats.map((stat) => (
                <div key={stat.month} className="text-center p-5 bg-[var(--bg-tertiary)] rounded-xl">
                  <p className="text-sm text-[var(--text-muted)] mb-3">{stat.month}</p>
                  <p className="text-xl font-bold text-[var(--gold)] mb-1">
                    ¥{stat.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {stat.purchases}件
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/create" className="btn btn-primary">
            新しいプロンプトを作成
          </Link>
          <Link href={`/profile/${session?.user?.username}`} className="btn btn-secondary">
            プロフィールを見る
          </Link>
        </div>
      </div>
    </div>
  )
}
