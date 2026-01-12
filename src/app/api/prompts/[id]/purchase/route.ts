import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyPurchase } from '@/lib/notifications'

// POST /api/prompts/[id]/purchase - Purchase a prompt with credits
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
        owner: { select: { id: true } },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    if (!prompt.isPublished) {
      return NextResponse.json(
        { error: 'このプロンプトは公開されていません' },
        { status: 400 }
      )
    }

    // Check if already purchased
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId,
        },
      },
    })

    if (existingPurchase) {
      return NextResponse.json(
        { error: '既に購入済みです' },
        { status: 400 }
      )
    }

    // Can't purchase own prompt
    if (prompt.ownerId === session.user.id) {
      return NextResponse.json(
        { error: '自分のプロンプトは購入できません' },
        { status: 400 }
      )
    }

    // Check user's credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    if (prompt.priceJPY > 0 && user.credits < prompt.priceJPY) {
      return NextResponse.json(
        { error: 'クレジットが不足しています' },
        { status: 400 }
      )
    }

    // Process purchase with transaction
    await prisma.$transaction(async (tx) => {
      // Deduct credits from buyer
      if (prompt.priceJPY > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            credits: { decrement: prompt.priceJPY },
            creditHistory: {
              create: {
                amount: -prompt.priceJPY,
                type: 'purchase',
                description: `「${prompt.title}」を購入`,
              },
            },
          },
        })

        // Add credits to seller (80% of price)
        const sellerAmount = Math.floor(prompt.priceJPY * 0.8)
        await tx.user.update({
          where: { id: prompt.ownerId },
          data: {
            credits: { increment: sellerAmount },
            creditHistory: {
              create: {
                amount: sellerAmount,
                type: 'sale',
                description: `「${prompt.title}」が売れました`,
              },
            },
          },
        })
      }

      // Create purchase record
      await tx.purchase.create({
        data: {
          userId: session.user.id,
          promptId,
          priceAtPurchase: prompt.priceJPY,
        },
      })
    })

    // 通知を送信（非同期で実行）
    notifyPurchase(
      session.user.id,
      prompt.ownerId,
      promptId,
      prompt.title,
      prompt.priceJPY
    ).catch((err) => console.error('Failed to send purchase notification:', err))

    return NextResponse.json(
      { message: '購入が完了しました' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error purchasing prompt:', error)
    return NextResponse.json(
      { error: '購入に失敗しました' },
      { status: 500 }
    )
  }
}
