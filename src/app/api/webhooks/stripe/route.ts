import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CREATOR_REVENUE_RATE } from '@/lib/constants'

/**
 * POST /api/webhooks/stripe
 * Stripe Webhookハンドラー
 */
export async function POST(request: NextRequest) {
  // Stripeが設定されていない場合
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    switch (event.type) {
      case 'checkout.session.completed':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleCheckoutCompleted(event.data.object as any)
        break

      case 'payment_intent.payment_failed':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handlePaymentFailed(event.data.object as any)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook error' },
      { status: 400 }
    )
  }
}

/**
 * Checkout完了時の処理
 */
async function handleCheckoutCompleted(session: {
  id: string
  payment_intent: string | null
  metadata: Record<string, string> | null
}) {
  const metadata = session.metadata
  if (!metadata) {
    console.error('No metadata in checkout session')
    return
  }

  const { promptId, buyerId, sellerId, price } = metadata
  const priceAmount = parseInt(price)

  await prisma.$transaction(async (tx) => {
    // 1. 購入ステータス更新
    const purchase = await tx.purchase.updateMany({
      where: { stripeSessionId: session.id },
      data: {
        status: 'completed',
        stripePaymentId: session.payment_intent as string,
      },
    })

    if (purchase.count === 0) {
      console.error('Purchase not found for session:', session.id)
      return
    }

    // 購入レコードを取得
    const purchaseRecord = await tx.purchase.findFirst({
      where: { stripeSessionId: session.id },
    })

    if (!purchaseRecord) return

    // 2. 売主ウォレット取得/作成
    const sellerWallet = await tx.wallet.upsert({
      where: { userId: sellerId },
      update: {},
      create: { userId: sellerId },
    })

    // 3. 収益計算
    const sellerRevenue = Math.floor(priceAmount * CREATOR_REVENUE_RATE)

    // 4. 売主への収益加算（保留として）
    await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: {
        pendingBalance: { increment: sellerRevenue },
      },
    })

    // 5. 取引履歴記録
    await tx.transaction.create({
      data: {
        walletId: sellerWallet.id,
        type: 'purchase_revenue',
        amount: sellerRevenue,
        description: `プロンプト売上（Stripe）（保留中）`,
        purchaseId: purchaseRecord.id,
      },
    })

    // 6. 売主のクレジット加算
    const prompt = await tx.prompt.findUnique({
      where: { id: promptId },
      select: { title: true },
    })

    await tx.user.update({
      where: { id: sellerId },
      data: { credits: { increment: sellerRevenue } },
    })

    await tx.creditHistory.create({
      data: {
        userId: sellerId,
        amount: sellerRevenue,
        type: 'sale',
        description: `プロンプト売上（Stripe）: ${prompt?.title.slice(0, 30) || promptId}`,
      },
    })

    // 7. 購入者のクレジット履歴（参考用）
    await tx.creditHistory.create({
      data: {
        userId: buyerId,
        amount: 0, // Stripeで支払済みなのでクレジット変動なし
        type: 'purchase',
        description: `プロンプト購入（Stripe）: ${prompt?.title.slice(0, 30) || promptId}`,
      },
    })
  })

  console.log('Checkout completed:', session.id)
}

/**
 * 支払い失敗時の処理
 */
async function handlePaymentFailed(paymentIntent: {
  id: string
  metadata: Record<string, string> | null
}) {
  console.log('Payment failed:', paymentIntent.id)
  
  // 関連する購入レコードを失敗ステータスに更新
  await prisma.purchase.updateMany({
    where: { stripePaymentId: paymentIntent.id },
    data: { status: 'pending' }, // 再試行可能な状態に
  })
}

