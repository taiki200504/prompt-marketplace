import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { promptSchema } from '@/lib/validations'

// GET /api/prompts/[id] - Get single prompt detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        resultLogs: {
          select: {
            id: true,
            metricType: true,
            metricValue: true,
            metricUnit: true,
            note: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        purchases: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // Check if current user is owner or has purchased
    const isOwner = session?.user?.id === prompt.ownerId
    const hasPurchased = prompt.purchases.some(
      (p) => p.userId === session?.user?.id
    )
    const isFree = prompt.priceJPY === 0

    // Calculate stats
    const avgRating =
      prompt.reviews.length > 0
        ? prompt.reviews.reduce((sum, r) => sum + r.rating, 0) / prompt.reviews.length
        : 0

    // Group result logs by metric type
    const resultLogStats = prompt.resultLogs.reduce(
      (acc, log) => {
        if (!acc[log.metricType]) {
          acc[log.metricType] = {
            count: 0,
            total: 0,
            unit: log.metricUnit,
          }
        }
        acc[log.metricType].count++
        acc[log.metricType].total += log.metricValue
        return acc
      },
      {} as Record<string, { count: number; total: number; unit: string }>
    )

    const resultLogSummary = Object.entries(resultLogStats).map(([type, stats]) => ({
      metricType: type,
      count: stats.count,
      average: Math.round((stats.total / stats.count) * 10) / 10,
      total: Math.round(stats.total * 10) / 10,
      unit: stats.unit,
    }))

    // Mask prompt body if not owner and not purchased (unless free)
    let promptBody = prompt.promptBody
    if (!isOwner && !hasPurchased && !isFree) {
      promptBody = prompt.promptBody.substring(0, 50) + '...[購入すると全文が表示されます]'
    }

    return NextResponse.json({
      id: prompt.id,
      title: prompt.title,
      shortDescription: prompt.shortDescription,
      category: prompt.category,
      promptBody,
      usageGuide: prompt.usageGuide,
      exampleInput: prompt.exampleInput,
      exampleOutput: prompt.exampleOutput,
      priceJPY: prompt.priceJPY,
      tags: prompt.tags,
      views: prompt.views,
      isPublished: prompt.isPublished,
      publishedAt: prompt.publishedAt,
      createdAt: prompt.createdAt,
      owner: prompt.owner,
      reviews: prompt.reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: prompt.reviews.length,
      purchaseCount: prompt.purchases.length,
      resultLogCount: prompt.resultLogs.length,
      resultLogSummary,
      isOwner,
      hasPurchased,
      canViewFullPrompt: isOwner || hasPurchased || isFree,
      currentVersion: prompt.currentVersion,
    })
  } catch (error) {
    console.error('Error fetching prompt:', error)
    return NextResponse.json(
      { error: 'プロンプトの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT /api/prompts/[id] - Update prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    if (prompt.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: '編集権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = promptSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    // If publishing for the first time, set publishedAt
    let publishedAt = prompt.publishedAt
    if (result.data.isPublished && !prompt.isPublished) {
      publishedAt = new Date()
    }

    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data: {
        ...result.data,
        publishedAt,
      },
    })

    return NextResponse.json(updatedPrompt)
  } catch (error) {
    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { error: 'プロンプトの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/prompts/[id] - Delete prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    if (prompt.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: '削除権限がありません' },
        { status: 403 }
      )
    }

    await prisma.prompt.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'プロンプトを削除しました' })
  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json(
      { error: 'プロンプトの削除に失敗しました' },
      { status: 500 }
    )
  }
}

