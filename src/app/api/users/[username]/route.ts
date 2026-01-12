import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/[username] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        createdAt: true,
        prompts: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            shortDescription: true,
            category: true,
            priceJPY: true,
            views: true,
            publishedAt: true,
            reviews: {
              select: { rating: true },
            },
            purchases: {
              select: { id: true, priceAtPurchase: true },
            },
          },
          orderBy: { publishedAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // Calculate stats
    let totalEarnings = 0
    let totalReviews = 0
    let totalRating = 0

    const promptsWithStats = user.prompts.map((prompt) => {
      const avgRating =
        prompt.reviews.length > 0
          ? prompt.reviews.reduce((sum, r) => sum + r.rating, 0) / prompt.reviews.length
          : 0

      totalReviews += prompt.reviews.length
      totalRating += prompt.reviews.reduce((sum, r) => sum + r.rating, 0)

      const earnings = prompt.purchases.reduce(
        (sum, p) => sum + p.priceAtPurchase * 0.8,
        0
      )
      totalEarnings += earnings

      return {
        id: prompt.id,
        title: prompt.title,
        shortDescription: prompt.shortDescription,
        category: prompt.category,
        priceJPY: prompt.priceJPY,
        views: prompt.views,
        publishedAt: prompt.publishedAt,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: prompt.reviews.length,
        purchaseCount: prompt.purchases.length,
      }
    })

    const avgRatingOverall = totalReviews > 0 ? totalRating / totalReviews : 0

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      createdAt: user.createdAt,
      promptCount: user.prompts.length,
      totalEarnings: Math.round(totalEarnings),
      avgRating: Math.round(avgRatingOverall * 10) / 10,
      totalReviews,
      prompts: promptsWithStats,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

