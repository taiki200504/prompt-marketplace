import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reviewSchema } from '@/lib/validations'
import { notifyReview } from '@/lib/notifications'

// POST /api/prompts/[id]/review - Create a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        purchases: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // Check if user can review (purchased or free)
    const hasPurchased = prompt.purchases.length > 0
    const isFree = prompt.priceJPY === 0
    const isOwner = prompt.ownerId === session.user.id

    if (isOwner) {
      return NextResponse.json(
        { error: '自分のプロンプトにはレビューできません' },
        { status: 400 }
      )
    }

    if (!hasPurchased && !isFree) {
      return NextResponse.json(
        { error: '購入後にレビューできます' },
        { status: 403 }
      )
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: '既にレビュー済みです' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const result = reviewSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        promptId,
        rating: result.data.rating,
        comment: result.data.comment,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true },
        },
      },
    })

    // 通知を送信（非同期で実行）
    notifyReview(
      prompt.ownerId,
      review.user.username,
      promptId,
      prompt.title,
      result.data.rating
    ).catch((err) => console.error('Failed to send review notification:', err))

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'レビューの投稿に失敗しました' },
      { status: 500 }
    )
  }
}
