import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/checkout/session
 * Stripeセッション情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'セッションIDが必要です' }, { status: 400 })
    }

    // Stripeが設定されていない場合
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe決済は現在利用できません' },
        { status: 503 }
      )
    }

    // 購入レコードを取得
    const purchase = await prisma.purchase.findFirst({
      where: {
        stripeSessionId: sessionId,
        userId: session.user.id,
      },
      include: {
        prompt: {
          select: {
            id: true,
            title: true,
            priceJPY: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: '購入情報が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      promptId: purchase.prompt.id,
      promptTitle: purchase.prompt.title,
      price: purchase.priceAtPurchase,
    })
  } catch (error) {
    console.error('Error fetching checkout session:', error)
    return NextResponse.json(
      { error: 'セッション情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
