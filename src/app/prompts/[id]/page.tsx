'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import VersionHistory from '@/components/VersionHistory'
import AIImproveButton from '@/components/AIImproveButton'
import { PaymentButton } from '@/components/PaymentButton'
import { generateStructuredData } from '@/lib/seo'

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  user: {
    username: string
    displayName?: string | null
  }
}

interface ResultLogSummary {
  metricType: string
  count: number
  average: number
  total: number
  unit: string
}

interface PromptDetail {
  id: string
  title: string
  shortDescription: string
  category: string
  promptBody: string
  usageGuide?: string
  exampleInput: string
  exampleOutput: string
  priceJPY: number
  tags: string
  views: number
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  owner: {
    id: string
    username: string
    displayName?: string | null
  }
  reviews: Review[]
  avgRating: number
  reviewCount: number
  purchaseCount: number
  resultLogCount: number
  resultLogSummary: ResultLogSummary[]
  isOwner: boolean
  hasPurchased: boolean
  canViewFullPrompt: boolean
  currentVersion?: number
}

const METRIC_TYPE_LABELS: Record<string, string> = {
  time_saved: '時間短縮',
  revenue: '収益',
  quality: '品質向上',
  other: 'その他',
}

function StarRating({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onChange?.(star)}
          className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
            star <= rating ? 'text-[var(--gold)]' : 'text-[var(--border-default)]'
          }`}
          disabled={!interactive}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [prompt, setPrompt] = useState<PromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  
  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  
  // Result log form
  const [showResultForm, setShowResultForm] = useState(false)
  const [resultMetricType, setResultMetricType] = useState('time_saved')
  const [resultMetricValue, setResultMetricValue] = useState('')
  const [resultMetricUnit, setResultMetricUnit] = useState('min')
  const [resultNote, setResultNote] = useState('')
  const [submittingResult, setSubmittingResult] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Increment view
        fetch(`/api/prompts/${id}/view`, { method: 'POST' })
        
        const [promptRes, favoriteRes] = await Promise.all([
          fetch(`/api/prompts/${id}`),
          session ? fetch(`/api/prompts/${id}/favorite`) : Promise.resolve(null),
        ])

        if (!promptRes.ok) {
          router.push('/prompts')
          return
        }

        const promptData = await promptRes.json()
        setPrompt(promptData)

        // 構造化データを追加
        const structuredData = generateStructuredData({
          type: 'Product',
          title: promptData.title,
          description: promptData.shortDescription,
          url: `${window.location.origin}/prompts/${id}`,
          image: promptData.thumbnailUrl || undefined,
          price: promptData.priceJPY,
          currency: 'JPY',
        })
        
        // 既存の構造化データを削除
        const existingScript = document.getElementById('structured-data')
        if (existingScript) {
          existingScript.remove()
        }
        
        // 新しい構造化データを追加
        const script = document.createElement('script')
        script.id = 'structured-data'
        script.type = 'application/ld+json'
        script.textContent = JSON.stringify(structuredData)
        document.head.appendChild(script)

        if (favoriteRes) {
          const favoriteData = await favoriteRes.json()
          setIsFavorited(favoriteData.isFavorited)
        }
      } catch (error) {
        console.error('Error fetching prompt:', error)
        router.push('/prompts')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, router, session])

  const toggleFavorite = async () => {
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent(`/prompts/${id}`))
      return
    }

    try {
      const res = await fetch(`/api/prompts/${id}/favorite`, { method: 'POST' })
      const data = await res.json()
      setIsFavorited(data.isFavorited)
      showToast(data.message, 'success')
    } catch {
      showToast('エラーが発生しました', 'error')
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/prompts/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment || undefined }),
      })
      
      if (res.ok) {
        showToast('レビューを投稿しました', 'success')
        const promptRes = await fetch(`/api/prompts/${id}`)
        const data = await promptRes.json()
        setPrompt(data)
        setShowReviewForm(false)
        setReviewComment('')
      } else {
        const data = await res.json()
        showToast(data.error || 'レビューの投稿に失敗しました', 'error')
      }
    } catch {
      showToast('レビューの投稿に失敗しました', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    
    setSubmittingResult(true)
    try {
      const res = await fetch(`/api/prompts/${id}/result-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricType: resultMetricType,
          metricValue: parseFloat(resultMetricValue),
          metricUnit: resultMetricUnit,
          note: resultNote || undefined,
        }),
      })
      
      if (res.ok) {
        showToast('成果を記録しました', 'success')
        const promptRes = await fetch(`/api/prompts/${id}`)
        const data = await promptRes.json()
        setPrompt(data)
        setShowResultForm(false)
        setResultMetricValue('')
        setResultNote('')
      } else {
        const data = await res.json()
        showToast(data.error || '成果の記録に失敗しました', 'error')
      }
    } catch {
      showToast('成果の記録に失敗しました', 'error')
    } finally {
      setSubmittingResult(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="h-6 skeleton w-20 rounded-full" />
                <div className="h-6 skeleton w-16 rounded-full" />
              </div>
              <div className="h-8 sm:h-10 skeleton w-3/4 rounded-lg" />
              <div className="h-5 skeleton w-1/2 rounded-lg" />
            </div>
            
            {/* Content Skeleton */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="card">
                  <div className="h-6 skeleton w-32 mb-4 rounded-lg" />
                  <div className="h-48 skeleton rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 skeleton w-full rounded" />
                    <div className="h-4 skeleton w-5/6 rounded" />
                    <div className="h-4 skeleton w-4/6 rounded" />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="card">
                  <div className="h-8 skeleton w-24 mb-4 rounded-lg" />
                  <div className="h-12 skeleton w-full rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 skeleton w-full rounded" />
                    <div className="h-4 skeleton w-3/4 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!prompt) return null

  const canReview = (prompt.hasPurchased || prompt.priceJPY === 0) && !prompt.isOwner
  const canLogResult = prompt.hasPurchased || prompt.priceJPY === 0 || prompt.isOwner
  const hasReviewed = prompt.reviews.some(r => r.user.username === session?.user?.username)

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-neutral">{prompt.category}</span>
                {prompt.priceJPY === 0 ? (
                  <span className="badge badge-success">Free</span>
                ) : (
                  <span className="badge badge-warning">◆{prompt.priceJPY.toLocaleString()}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{prompt.title}</h1>
              <p className="text-[var(--text-secondary)]">{prompt.shortDescription}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className={`btn btn-secondary ${isFavorited ? 'text-[var(--danger)]' : ''}`}
              >
                {isFavorited ? '♥' : '♡'}
              </button>
              {prompt.isOwner && (
                <Link href={`/edit/${prompt.id}`} className="btn btn-secondary">
                  編集
                </Link>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
            <Link href={`/profile/${prompt.owner.username}`} className="hover:text-[var(--accent-secondary)]">
              @{prompt.owner.username}
            </Link>
            <div className="flex items-center gap-1">
              <StarRating rating={prompt.avgRating} />
              <span>{prompt.avgRating} ({prompt.reviewCount})</span>
            </div>
            <span>{prompt.views} views</span>
            <span>{prompt.purchaseCount} sales</span>
          </div>

          {prompt.tags && (
            <div className="flex gap-2 mt-4">
              {prompt.tags.split(',').map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Prompt Body */}
            <div className="card">
              <h2 className="text-lg font-medium mb-4">プロンプト</h2>
              <pre className="whitespace-pre-wrap bg-[var(--bg-primary)] p-4 rounded-lg text-sm font-mono overflow-x-auto border border-[var(--border-subtle)]">
                {prompt.promptBody}
              </pre>
              {!prompt.canViewFullPrompt && (
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  ※ 購入すると全文が表示されます
                </p>
              )}

              {/* Version History (Owner Only) */}
              {prompt.isOwner && prompt.currentVersion && (
                <VersionHistory
                  promptId={prompt.id}
                  currentVersion={prompt.currentVersion}
                  isOwner={prompt.isOwner}
                />
              )}

              {/* AI Improve Button */}
              <AIImproveButton
                promptId={prompt.id}
                canAccess={prompt.isOwner || prompt.hasPurchased || prompt.priceJPY === 0}
              />
            </div>

            {/* Usage Guide */}
            {prompt.usageGuide && (
              <div className="card">
                <h2 className="text-lg font-medium mb-4">使い方</h2>
                <p className="text-[var(--text-secondary)] whitespace-pre-wrap text-sm">
                  {prompt.usageGuide}
                </p>
              </div>
            )}

            {/* Example */}
            <div className="card">
              <h2 className="text-lg font-medium mb-4">入出力例</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">入力</h3>
                  <pre className="whitespace-pre-wrap bg-[var(--bg-primary)] p-3 rounded-lg text-sm border border-[var(--border-subtle)]">
                    {prompt.exampleInput}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">出力</h3>
                  <pre className="whitespace-pre-wrap bg-[var(--bg-primary)] p-3 rounded-lg text-sm border border-[var(--border-subtle)]">
                    {prompt.exampleOutput}
                  </pre>
                </div>
              </div>
            </div>

            {/* Result Log Summary */}
            {prompt.resultLogSummary.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-medium mb-4">📊 成果レポート</h2>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {prompt.resultLogCount}件の成果が報告されています
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {prompt.resultLogSummary.map((summary) => (
                    <div key={summary.metricType} className="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-subtle)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1">
                        {METRIC_TYPE_LABELS[summary.metricType] || summary.metricType}
                      </p>
                      <p className="text-xl font-semibold">
                        {summary.average.toLocaleString()}
                        <span className="text-sm font-normal text-[var(--text-muted)] ml-1">
                          {summary.unit}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        平均 ({summary.count}件)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">レビュー ({prompt.reviewCount})</h2>
                {canReview && !hasReviewed && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="btn btn-sm btn-secondary"
                  >
                    レビューを書く
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="mb-6 p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">評価</label>
                    <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">コメント (任意)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="input"
                      rows={3}
                      placeholder="このプロンプトの感想..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={submittingReview} className="btn btn-primary">
                      {submittingReview ? '投稿中...' : '投稿'}
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="btn btn-ghost">
                      キャンセル
                    </button>
                  </div>
                </form>
              )}

              {prompt.reviews.length > 0 ? (
                <div className="space-y-3">
                  {prompt.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          <Link
                            href={`/profile/${review.user.username}`}
                            className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-secondary)]"
                          >
                            @{review.user.username}
                          </Link>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-[var(--text-secondary)]">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-sm">まだレビューはありません</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Purchase Card */}
            {!prompt.isOwner && (
              <div className="card sticky top-20 lg:top-24">
                <div className="text-center mb-6">
                  {prompt.priceJPY === 0 ? (
                    <p className="text-2xl font-bold text-[var(--success)]">無料</p>
                  ) : (
                    <p className="text-2xl font-bold">
                      <span className="text-[var(--gold)]">◆</span>
                      {prompt.priceJPY.toLocaleString()}
                    </p>
                  )}
                </div>

                {prompt.hasPurchased || prompt.priceJPY === 0 ? (
                  <div className="text-center">
                    <p className="text-[var(--success)] font-medium mb-4 flex items-center justify-center gap-2">
                      <span>✓</span>
                      <span>{prompt.priceJPY === 0 ? 'アクセス可能' : '購入済み'}</span>
                    </p>
                    {canLogResult && (
                      <button
                        onClick={() => setShowResultForm(!showResultForm)}
                        className="btn btn-secondary w-full"
                      >
                        📊 成果を記録
                      </button>
                    )}
                  </div>
                ) : (
                  <PaymentButton
                    promptId={prompt.id}
                    priceJPY={prompt.priceJPY}
                    title={prompt.title}
                    onSuccess={() => {
                      // Refresh prompt data
                      fetch(`/api/prompts/${id}`)
                        .then((res) => res.json())
                        .then((data) => setPrompt(data))
                        .catch(console.error)
                    }}
                  />
                )}

                {showResultForm && (
                  <form onSubmit={handleResultSubmit} className="mt-4 p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                    <h3 className="font-medium mb-3 text-sm">成果を記録</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-[var(--text-muted)]">指標</label>
                        <select
                          value={resultMetricType}
                          onChange={(e) => setResultMetricType(e.target.value)}
                          className="input"
                        >
                          <option value="time_saved">時間短縮</option>
                          <option value="revenue">収益</option>
                          <option value="quality">品質向上</option>
                          <option value="other">その他</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-muted)]">数値</label>
                          <input
                            type="number"
                            value={resultMetricValue}
                            onChange={(e) => setResultMetricValue(e.target.value)}
                            className="input"
                            required
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-muted)]">単位</label>
                          <select
                            value={resultMetricUnit}
                            onChange={(e) => setResultMetricUnit(e.target.value)}
                            className="input"
                          >
                            <option value="min">分</option>
                            <option value="JPY">円</option>
                            <option value="%">%</option>
                            <option value="score">スコア</option>
                            <option value="other">その他</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-[var(--text-muted)]">メモ</label>
                        <textarea
                          value={resultNote}
                          onChange={(e) => setResultNote(e.target.value)}
                          className="input"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={submittingResult} className="btn btn-primary btn-sm flex-1">
                          {submittingResult ? '記録中...' : '記録'}
                        </button>
                        <button type="button" onClick={() => setShowResultForm(false)} className="btn btn-ghost btn-sm">
                          ×
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Owner Stats */}
            {prompt.isOwner && (
              <div className="card">
                <h3 className="font-medium mb-4">パフォーマンス</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">閲覧数</span>
                    <span>{prompt.views}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">購入数</span>
                    <span>{prompt.purchaseCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">レビュー数</span>
                    <span>{prompt.reviewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">成果報告数</span>
                    <span>{prompt.resultLogCount}</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between font-medium">
                    <span>推定収益</span>
                    <span className="text-[var(--success)]">
                      ◆{Math.round(prompt.purchaseCount * prompt.priceJPY * 0.8).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
