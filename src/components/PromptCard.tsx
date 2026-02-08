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
    <div className="flex items-center gap-1">
      <span className="text-[var(--gold)] text-xs">★</span>
      <span className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">
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
      <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[var(--border-accent)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.2),0_0_32px_rgba(212,175,55,0.06)] hover:-translate-y-1 h-full flex flex-col">
        {/* Thumbnail */}
        {thumbnailUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-[var(--bg-tertiary)]">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)]/80 via-transparent to-transparent" />
            <div className="absolute top-3 right-3">
              {isFree ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--success)] text-white text-xs font-semibold">FREE</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-primary)]/80 backdrop-blur-sm border border-[var(--border-accent)] text-[var(--gold)] text-xs font-semibold tabular-nums">
                  ◆ {priceJPY.toLocaleString()}
                </span>
              )}
            </div>
            {isTrending && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--warning)]/90 text-white text-xs font-medium">Trending</span>
              </div>
            )}
          </div>
        ) : (
          isTrending && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-40" />
          )
        )}

        <div className={`${compact ? 'p-4' : 'p-5'} flex-1 flex flex-col`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--gold)] transition-colors text-[15px] leading-snug flex-1">
              {title}
            </h3>
            {!thumbnailUrl && (
              <div className="shrink-0">
                {isFree ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--success-muted)] text-[var(--success)] text-xs font-semibold">FREE</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--gold-muted)] text-[var(--gold)] text-xs font-semibold tabular-nums">
                    ◆ {priceJPY.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed flex-1">
            {shortDescription}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-medium border border-[var(--border-subtle)]">
              {category}
            </span>
            {isTrending && !thumbnailUrl && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--warning-muted)] text-[var(--warning)] text-xs font-medium">Trending</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] mt-auto">
            <div className="flex items-center gap-3">
              <StarRating rating={avgRating} count={reviewCount} />
              <span className="text-xs text-[var(--text-muted)] tabular-nums">{purchaseCount} sales</span>
            </div>
            <span
              role="link"
              tabIndex={0}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors cursor-pointer"
              onClick={handleProfileClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleProfileClick(e as unknown as React.MouseEvent)
              }}
            >@{owner.username}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
