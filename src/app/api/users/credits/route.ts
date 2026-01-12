import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/credits - Get current user's credits
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        credits: true,
        creditHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({
      credits: user.credits,
      history: user.creditHistory,
    })
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json(
      { error: 'クレジット情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/users/credits - Add credits (bonus or top-up)
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    // For MVP: Add 500 bonus credits
    const bonusAmount = 500

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        credits: { increment: bonusAmount },
        creditHistory: {
          create: {
            amount: bonusAmount,
            type: 'bonus',
            description: 'デイリーボーナス',
          },
        },
      },
      select: { credits: true },
    })

    return NextResponse.json({
      message: `${bonusAmount}クレジットを獲得しました！`,
      credits: user.credits,
    })
  } catch (error) {
    console.error('Error adding credits:', error)
    return NextResponse.json(
      { error: 'クレジットの追加に失敗しました' },
      { status: 500 }
    )
  }
}

