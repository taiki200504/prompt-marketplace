import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { promptSchema } from '@/lib/validations'

// GET /api/prompts - List prompts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'trending'
    const free = searchParams.get('free') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: Record<string, unknown> = {
      isPublished: true,
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { shortDescription: { contains: q } },
        { tags: { contains: q } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (free) {
      where.priceJPY = 0
    }

    // Determine order
    let orderBy: Record<string, string> = {}
    switch (sort) {
      case 'new':
        orderBy = { publishedAt: 'desc' }
        break
      case 'popular':
        orderBy = { views: 'desc' }
        break
      case 'rating':
        // Will sort after fetch
        orderBy = { createdAt: 'desc' }
        break
      default:
        // trending - will sort after fetch
        orderBy = { createdAt: 'desc' }
    }

    const prompts = await prisma.prompt.findMany({
      where,
      include: {
        owner: {
          select: { id: true, username: true, displayName: true },
        },
        reviews: { select: { rating: true } },
        purchases: { select: { id: true } },
        resultLogs: { select: { id: true } },
      },
      orderBy,
      take: limit,
    })

    // Calculate stats and trending score
    const promptsWithStats = prompts.map((prompt) => {
      const avgRating =
        prompt.reviews.length > 0
          ? prompt.reviews.reduce((sum, r) => sum + r.rating, 0) / prompt.reviews.length
          : 0

      const daysSincePublished = prompt.publishedAt
        ? Math.floor((Date.now() - new Date(prompt.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const newnessBoost = Math.max(0, 7 - daysSincePublished) * 0.5
      const trendingScore =
        prompt.views * 0.05 +
        prompt.purchases.length * 1.5 +
        avgRating * 2 +
        prompt.resultLogs.length * 1.2 +
        newnessBoost

      return {
        id: prompt.id,
        title: prompt.title,
        shortDescription: prompt.shortDescription,
        category: prompt.category,
        priceJPY: prompt.priceJPY,
        views: prompt.views,
        thumbnailUrl: prompt.thumbnailUrl,
        owner: prompt.owner,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: prompt.reviews.length,
        purchaseCount: prompt.purchases.length,
        trendingScore: Math.round(trendingScore * 100) / 100,
      }
    })

    // Sort by trending or rating
    if (sort === 'trending') {
      promptsWithStats.sort((a, b) => b.trendingScore - a.trendingScore)
    } else if (sort === 'rating') {
      promptsWithStats.sort((a, b) => b.avgRating - a.avgRating)
    }

    return NextResponse.json({ prompts: promptsWithStats })
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'プロンプトの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/prompts - Create a new prompt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const body = await request.json()
    const result = promptSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const prompt = await prisma.prompt.create({
      data: {
        ...result.data,
        ownerId: session.user.id,
        publishedAt: result.data.isPublished ? new Date() : null,
      },
    })

    return NextResponse.json(prompt, { status: 201 })
  } catch (error) {
    console.error('Error creating prompt:', error)
    return NextResponse.json(
      { error: 'プロンプトの作成に失敗しました' },
      { status: 500 }
    )
  }
}
