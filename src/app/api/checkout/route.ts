import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  purchaseWithCredits, 
  createStripeCheckoutSession,
  purchaseWithOrynth,
  type PaymentProvider 
} from '@/lib/payment'

interface CheckoutRequest {
  promptId: string
  provider: PaymentProvider
}

/**
 * POST /api/checkout
 * 購入処理を開始
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { promptId, provider = 'credits' } = await request.json() as CheckoutRequest

    if (!promptId) {
      return NextResponse.json({ error: 'プロンプトIDが必要です' }, { status: 400 })
    }

    let result

    switch (provider) {
      case 'credits':
        result = await purchaseWithCredits(session.user.id, promptId)
        break

      case 'stripe':
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
          `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`
        result = await createStripeCheckoutSession(session.user.id, promptId, baseUrl)
        break

      case 'orynth':
        result = await purchaseWithOrynth(session.user.id, promptId)
        break

      default:
        return NextResponse.json(
          { error: `サポートされていない決済方法です: ${provider}` },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Stripeの場合はリダイレクトURLを返す
    if (result.redirectUrl) {
      return NextResponse.json({ redirectUrl: result.redirectUrl })
    }

    return NextResponse.json({
      message: '購入が完了しました',
      purchaseId: result.purchaseId,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: '購入処理に失敗しました' },
      { status: 500 }
    )
  }
}

