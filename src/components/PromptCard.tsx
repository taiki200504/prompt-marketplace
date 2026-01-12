'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface PromptCardProps {
  id: string
  title: string
  shortDescription: string
  category: string
  priceJPY: number
  avgRating: number
  reviewCount: number
  purchaseCount: number
  views: number
  thumbnailUrl?: string | null
  owner: {
    username: string
    displayName?: string | null
  }
  trendingScore?: number
  compact?: boolean
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[var(--gold)] text-sm">★</span>
      <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
        {rating > 0 ? rating.toFixed(1) : '—'}
      </span>
      {count > 0 && (
        <span className="text-xs text-[var(--text-muted)]">({count})</span>
      )}
    </div>
  )
}

export default function PromptCard({
  id,
  title,
  shortDescription,
  category,
  priceJPY,
  avgRating,
  reviewCount,
  purchaseCount,
  thumbnailUrl,
  owner,
  trendingScore,
  compact = false,
}: PromptCardProps) {
  const router = useRouter()
  const isFree = priceJPY === 0
  const isTrending = trendingScore && trendingScore > 5

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${owner.username}`)
  }

  return (
    <Link href={`/prompts/${id}`} className="block group h-full">
      <div 
        className={`relative bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[var(--border-accent)] hover:shadow-[0_0_40px_rgba(212,175,55,0.12)] hover:scale-[1.02] hover:-translate-y-1 h-full flex flex-col shadow-sm hover:shadow-xl`}
      >
        {/* Thumbnail */}
        {thumbnailUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent opacity-60" />
            {/* Price badge on thumbnail */}
            <div className="absolute top-3 right-3">
              {isFree ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--success)] text-white text-xs font-semibold shadow-lg">
                  FREE
                </span>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)]/90 backdrop-blur-sm border border-[var(--border-accent)]">
                  <span className="text-[var(--gold)] text-xs">◆</span>
                  <span className="text-sm font-semibold text-[var(--gold)] tabular-nums">
                    {priceJPY.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {/* Trending badge on thumbnail */}
            {isTrending && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--warning)] text-white text-xs font-medium shadow-lg">
                  <span>🔥</span>
                  <span>Trending</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Trending indicator - subtle top border glow */}
            {isTrending && (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
            )}
          </>
        )}

        <div className={`${compact ? 'p-4' : 'p-6'} flex-1 flex flex-col`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--gold)] transition-colors duration-200 text-lg sm:text-xl leading-tight mb-1">
              {title}
            </h3>
          </div>
          {!thumbnailUrl && (
            <div className="flex-shrink-0">
              {isFree ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--success-muted)] text-[var(--success)] text-xs font-semibold">
                  FREE
                </span>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--gold-muted)] border border-[var(--border-accent)]">
                  <span className="text-[var(--gold)] text-xs">◆</span>
                  <span className="text-sm font-semibold text-[var(--gold)] tabular-nums">
                    {priceJPY.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-5 leading-relaxed flex-1">
          {shortDescription}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors">
            {category}
          </span>
          {isTrending && !thumbnailUrl && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--warning-muted)] text-[var(--warning)] text-xs font-medium">
              <span>🔥</span>
              <span>Trending</span>
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-auto">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <StarRating rating={avgRating} count={reviewCount} />
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <span className="opacity-60">📥</span>
              <span className="tabular-nums">{purchaseCount}</span>
            </div>
          </div>
          <span
            role="link"
            tabIndex={0}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors duration-200 cursor-pointer whitespace-nowrap ml-2"
            onClick={handleProfileClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleProfileClick(e as unknown as React.MouseEvent)
              }
            }}
          >
            @{owner.username}
          </span>
        </div>
        </div>
      </div>
    </Link>
  )
}
