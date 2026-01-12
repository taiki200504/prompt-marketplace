import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/payments
 * ユーザーの決済履歴を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') as 'completed' | 'pending' | 'failed' | 'refunded' | null

    const purchases = await prisma.purchase.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
      },
      include: {
        prompt: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const payments = purchases.map((purchase) => ({
      id: purchase.id,
      promptId: purchase.prompt.id,
      promptTitle: purchase.prompt.title,
      price: purchase.priceAtPurchase,
      status: purchase.status,
      paymentProvider: purchase.paymentProvider || 'credits',
      createdAt: purchase.createdAt.toISOString(),
      completedAt: purchase.status === 'completed' ? purchase.updatedAt.toISOString() : undefined,
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: '決済履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}
