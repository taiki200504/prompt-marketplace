import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard - クリエイターダッシュボードデータを取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    let dateFrom: Date | undefined
    const now = new Date()
    switch (period) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        dateFrom = undefined
    }

    // Get user's prompts with stats
    const prompts = await prisma.prompt.findMany({
      where: { ownerId: session.user.id },
      include: {
        purchases: {
          where: dateFrom ? { createdAt: { gte: dateFrom } } : undefined,
          include: {
            user: {
              select: { username: true },
            },
          },
        },
        reviews: {
          where: dateFrom ? { createdAt: { gte: dateFrom } } : undefined,
          select: { rating: true },
        },
        resultLogs: {
          where: dateFrom ? { createdAt: { gte: dateFrom } } : undefined,
          select: { id: true },
        },
      },
    })

    // Calculate stats
    const totalPrompts = prompts.length
    const publishedPrompts = prompts.filter((p) => p.isPublished).length
    const totalViews = prompts.reduce((sum, p) => sum + p.views, 0)
    const allPurchases = prompts.flatMap((p) => p.purchases)
    const totalPurchases = allPurchases.length
    const totalRevenue = allPurchases.reduce((sum, p) => sum + (p.priceAtPurchase * 0.8), 0) // 80% creator share
    const allReviews = prompts.flatMap((p) => p.reviews)
    const totalReviews = allReviews.length
    const avgRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0
    const totalResultLogs = prompts.flatMap((p) => p.resultLogs).length

    // Recent sales (last 10)
    const recentSales = allPurchases
      .map((purchase) => {
        const prompt = prompts.find((p) => p.purchases.includes(purchase))
        return {
          id: purchase.id,
          promptTitle: prompt?.title || '',
          price: Math.floor(purchase.priceAtPurchase * 0.8),
          createdAt: purchase.createdAt.toISOString(),
          buyerUsername: purchase.user.username,
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    // Top performing prompts
    const topPrompts = prompts
      .filter((p) => p.isPublished)
      .map((p) => {
        const promptReviews = p.reviews
        const promptAvgRating = promptReviews.length > 0
          ? promptReviews.reduce((sum, r) => sum + r.rating, 0) / promptReviews.length
          : 0
        const revenue = p.purchases.reduce((sum, pur) => sum + (pur.priceAtPurchase * 0.8), 0)
        return {
          id: p.id,
          title: p.title,
          views: p.views,
          purchases: p.purchases.length,
          avgRating: Math.round(promptAvgRating * 10) / 10,
          revenue: Math.floor(revenue),
        }
      })
      .sort((a, b) => b.revenue - a.revenue || b.purchases - a.purchases)
      .slice(0, 5)

    // Monthly stats (last 6 months)
    const monthlyStats: { month: string; views: number; purchases: number; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      
      const monthPurchases = allPurchases.filter((p) => {
        const date = new Date(p.createdAt)
        return date >= monthStart && date <= monthEnd
      })
      
      monthlyStats.push({
        month: monthStart.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }),
        views: 0, // Views are not timestamped, so we can't calculate this
        purchases: monthPurchases.length,
        revenue: Math.floor(monthPurchases.reduce((sum, p) => sum + (p.priceAtPurchase * 0.8), 0)),
      })
    }

    return NextResponse.json({
      stats: {
        totalPrompts,
        publishedPrompts,
        totalViews,
        totalPurchases,
        totalRevenue: Math.floor(totalRevenue),
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        totalResultLogs,
      },
      recentSales,
      topPrompts,
      monthlyStats,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    )
  }
}
