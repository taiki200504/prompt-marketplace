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
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '')
  const [minRating, setMinRating] = useState(searchParams.get('rating') || '')
  const [tags, setTags] = useState(searchParams.get('tags') || '')

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (category) params.set('category', category)
      if (sort) params.set('sort', sort)
      if (freeOnly) params.set('free', 'true')
      if (priceRange) params.set('price', priceRange)
      if (minRating) params.set('rating', minRating)
      if (tags) params.set('tags', tags)

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
  }, [search, category, sort, freeOnly, priceRange, minRating, tags])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    if (sort) params.set('sort', sort)
    if (freeOnly) params.set('free', 'true')
    if (priceRange) params.set('price', priceRange)
    if (minRating) params.set('rating', minRating)
    if (tags) params.set('tags', tags)
    router.push(`/prompts?${params}`)
  }

  return (
    <div className="container py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[var(--text-primary)]">プロンプトを探す</h1>
        <p className="text-base text-[var(--text-secondary)]">
          {prompts.length}件のプロンプトが見つかりました
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-10 sm:mb-12 p-6 sm:p-8">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="キーワードで検索..."
              className="input flex-1 text-base"
            />
            <button type="submit" className="btn btn-primary w-full sm:w-auto px-8">
              検索
            </button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
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

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">価格:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="input py-1.5 w-auto"
              >
                <option value="">すべて</option>
                <option value="free">無料</option>
                <option value="0-500">~500円</option>
                <option value="500-1000">500-1000円</option>
                <option value="1000-5000">1000-5000円</option>
                <option value="5000+">5000円~</option>
              </select>
            </div>

            {/* Min Rating */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">評価:</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="input py-1.5 w-auto"
              >
                <option value="">すべて</option>
                <option value="4">4.0以上</option>
                <option value="4.5">4.5以上</option>
                <option value="5">5.0のみ</option>
              </select>
            </div>
          </div>

          {/* Tags Search */}
          <div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="タグで検索（カンマ区切り）..."
              className="input w-full"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 skeleton mb-4" />
              <div className="h-4 skeleton w-3/4 mb-3" />
              <div className="h-4 skeleton w-1/2 mb-4" />
              <div className="h-3 skeleton w-1/3" />
            </div>
          ))}
        </div>
      ) : prompts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
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
