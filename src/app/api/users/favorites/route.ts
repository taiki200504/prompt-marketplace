import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/favorites - Get user's favorites
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        prompt: {
          include: {
            owner: {
              select: { id: true, username: true, displayName: true },
            },
            reviews: { select: { rating: true } },
            purchases: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const promptsWithStats = favorites
      .filter((f) => f.prompt.isPublished)
      .map((f) => {
        const avgRating =
          f.prompt.reviews.length > 0
            ? f.prompt.reviews.reduce((sum, r) => sum + r.rating, 0) / f.prompt.reviews.length
            : 0

        return {
          id: f.prompt.id,
          title: f.prompt.title,
          shortDescription: f.prompt.shortDescription,
          category: f.prompt.category,
          priceJPY: f.prompt.priceJPY,
          views: f.prompt.views,
          owner: f.prompt.owner,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: f.prompt.reviews.length,
          purchaseCount: f.prompt.purchases.length,
        }
      })

    return NextResponse.json({ favorites: promptsWithStats })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'お気に入りの取得に失敗しました' },
      { status: 500 }
    )
  }
}

