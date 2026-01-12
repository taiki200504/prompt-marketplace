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
    <div className="min-h-screen py-12">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              クリエイターダッシュボード
            </h1>
            <p className="text-[var(--text-muted)]">
              あなたのプロンプトのパフォーマンスを確認
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
                {p === '7d' ? '7日間' : p === '30d' ? '30日間' : p === '90d' ? '90日間' : '全期間'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-1">総閲覧数</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {data.stats.totalViews.toLocaleString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-1">総購入数</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {data.stats.totalPurchases.toLocaleString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-1">総収益</p>
            <p className="text-2xl font-bold text-[var(--gold)]">
              ¥{data.stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] mb-1">平均評価</p>
            <p className="text-2xl font-bold text-[var(--warning)]">
              ★ {data.stats.avgRating.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="card p-4 text-center">
            <p className="text-xl font-semibold text-[var(--text-primary)]">
              {data.stats.totalPrompts}
            </p>
            <p className="text-xs text-[var(--text-muted)]">総プロンプト数</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-semibold text-[var(--success)]">
              {data.stats.publishedPrompts}
            </p>
            <p className="text-xs text-[var(--text-muted)]">公開中</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-semibold text-[var(--accent-primary)]">
              {data.stats.totalReviews}
            </p>
            <p className="text-xs text-[var(--text-muted)]">レビュー数</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-semibold text-[var(--accent-secondary)]">
              {data.stats.totalResultLogs}
            </p>
            <p className="text-xs text-[var(--text-muted)]">成果記録</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Performing Prompts */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              トップパフォーマンス
            </h2>
            {data.topPrompts.length > 0 ? (
              <div className="space-y-4">
                {data.topPrompts.map((prompt, index) => (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <span className="text-lg font-bold text-[var(--gold)] w-6">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {prompt.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span>{prompt.views} 閲覧</span>
                        <span>{prompt.purchases} 購入</span>
                        <span>★ {prompt.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-[var(--gold)] font-semibold whitespace-nowrap">
                      ¥{prompt.revenue.toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
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
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              最近の売上
            </h2>
            {data.recentSales.length > 0 ? (
              <div className="space-y-4">
                {data.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {sale.promptTitle}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        @{sale.buyerUsername} • {new Date(sale.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <p className="text-[var(--success)] font-semibold">
                      +¥{sale.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--text-muted)]">
                  まだ売上がありません
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Chart Placeholder */}
        {data.monthlyStats.length > 0 && (
          <div className="card p-6 mt-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              月別推移
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.monthlyStats.map((stat) => (
                <div key={stat.month} className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)] mb-2">{stat.month}</p>
                  <p className="text-lg font-bold text-[var(--gold)]">
                    ¥{stat.revenue.toLocaleString()}
                  </p>
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    <span>{stat.views}閲覧</span> • <span>{stat.purchases}購入</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <Link href="/create" className="btn btn-primary">
            新しいプロンプトを作成
          </Link>
          <Link href={`/profile/${session?.user?.username}`} className="btn btn-secondary">
            プロフィールを見る
          </Link>
          <Link href="/referral" className="btn btn-outline">
            友達を招待
          </Link>
        </div>
      </div>
    </div>
  )
}
