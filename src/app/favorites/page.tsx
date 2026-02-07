'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PromptCard from '@/components/PromptCard'

interface FavoritePrompt {
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
}

export default function FavoritesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoritePrompt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/favorites')
      return
    }

    if (status === 'authenticated') {
      fetch('/api/users/favorites')
        .then((res) => res.json())
        .then((data) => {
          setFavorites(data.favorites || [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="container py-12">
        <div className="h-8 w-48 skeleton mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-6 skeleton mb-3" />
              <div className="h-4 skeleton w-3/4 mb-2" />
              <div className="h-4 skeleton w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">お気に入り</h1>
        <p className="text-sm text-[var(--text-muted)]">
          お気に入りに追加したプロンプト
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((prompt) => (
            <PromptCard key={prompt.id} {...prompt} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">♥</p>
          <p className="text-[var(--text-secondary)] mb-4">
            まだお気に入りがありません
          </p>
          <Link href="/prompts" className="btn btn-primary">
            プロンプトを探す
          </Link>
        </div>
      )}
    </div>
  )
}

