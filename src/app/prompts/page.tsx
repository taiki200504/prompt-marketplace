'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PromptCard from '@/components/PromptCard'

interface Prompt {
  id: string
  title: string
  shortDescription: string
  category: string
  priceJPY: number
  avgRating: number
  reviewCount: number
  purchaseCount: number
  views: number
  owner: {
    username: string
    displayName?: string | null
  }
  trendingScore: number
}

const CATEGORIES = [
  { value: '', label: 'すべて' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Dev', label: 'Dev' },
  { value: 'Design', label: 'Design' },
  { value: 'Career', label: 'Career' },
  { value: 'Study', label: 'Study' },
  { value: 'Fun', label: 'Fun' },
  { value: 'Other', label: 'Other' },
]

const SORT_OPTIONS = [
  { value: 'trending', label: 'トレンド' },
  { value: 'new', label: '新着' },
  { value: 'popular', label: '人気' },
  { value: 'rating', label: '高評価' },
]

function PromptsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'trending')
  const [freeOnly, setFreeOnly] = useState(searchParams.get('free') === 'true')

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (category) params.set('category', category)
      if (sort) params.set('sort', sort)
      if (freeOnly) params.set('free', 'true')

      try {
        const res = await fetch(`/api/prompts?${params}`)
        const data = await res.json()
        setPrompts(data.prompts || [])
      } catch (error) {
        console.error('Error fetching prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrompts()
  }, [search, category, sort, freeOnly])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    if (sort) params.set('sort', sort)
    if (freeOnly) params.set('free', 'true')
    router.push(`/prompts?${params}`)
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">プロンプトを探す</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {prompts.length}件のプロンプトが見つかりました
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search */}
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="キーワードで検索..."
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary">
              検索
            </button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">カテゴリ:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input py-1.5 w-auto"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">並び替え:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input py-1.5 w-auto"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Free only toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="rounded bg-[var(--bg-tertiary)] border-[var(--border-default)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">無料のみ</span>
            </label>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-6 skeleton mb-3" />
              <div className="h-4 skeleton w-3/4 mb-2" />
              <div className="h-4 skeleton w-1/2" />
            </div>
          ))}
        </div>
      ) : prompts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} {...prompt} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <p className="text-[var(--text-muted)] mb-4">
            条件に一致するプロンプトがありません
          </p>
          <button
            onClick={() => {
              setSearch('')
              setCategory('')
              setSort('trending')
              setFreeOnly(false)
            }}
            className="btn btn-secondary"
          >
            フィルターをリセット
          </button>
        </div>
      )}
    </div>
  )
}

export default function PromptsPage() {
  return (
    <Suspense fallback={
      <div className="container py-12">
        <div className="h-8 w-48 skeleton mb-8" />
      </div>
    }>
      <PromptsContent />
    </Suspense>
  )
}
