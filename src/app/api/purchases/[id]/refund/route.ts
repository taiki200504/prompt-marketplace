import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processRefund, isRefundable } from '@/lib/payment'
import { prisma } from '@/lib/prisma'
import { PAYOUT_CONFIG } from '@/lib/constants'

/**
 * POST /api/purchases/[id]/refund
 * 返金リクエスト
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: purchaseId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { reason } = await request.json().catch(() => ({ reason: undefined }))

    const result = await processRefund(purchaseId, session.user.id, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      message: '返金が完了しました',
      refundedAmount: result.refundedAmount,
    })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: '返金処理に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/purchases/[id]/refund
 * 返金可能かどうかをチェック
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: purchaseId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: {
        userId: true,
        createdAt: true,
        status: true,
        priceAtPurchase: true,
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: '購入記録が見つかりません' }, { status: 404 })
    }

    if (purchase.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    const refundable = isRefundable(purchase.createdAt)
    const daysRemaining = Math.max(
      0,
      PAYOUT_CONFIG.refundPeriodDays - 
        Math.floor((Date.now() - purchase.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    )

    return NextResponse.json({
      refundable: refundable && purchase.status === 'completed',
      daysRemaining,
      amount: purchase.priceAtPurchase,
      status: purchase.status,
      message: refundable
        ? `あと${daysRemaining}日以内に返金可能です`
        : '返金期間を過ぎています',
    })
  } catch (error) {
    console.error('Refund check error:', error)
    return NextResponse.json(
      { error: '返金可否の確認に失敗しました' },
      { status: 500 }
    )
  }
}

