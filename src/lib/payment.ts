/**
 * 決済・返金処理ユーティリティ
 * 
 * 対応決済方法:
 * - クレジット（内部通貨）
 * - Stripe（クレジットカード）
 * - Orynth（USDC）
 */

import { prisma } from './prisma'
import { PLATFORM_FEE_RATE, CREATOR_REVENUE_RATE, PAYOUT_CONFIG } from './constants'
import { orynthClient, jpyToUsdc } from './orynth'

// =============================================================================
// 型定義
// =============================================================================

export type PaymentProvider = 'credits' | 'stripe' | 'orynth'

export interface PaymentResult {
  success: boolean
  purchaseId?: string
  error?: string
  redirectUrl?: string  // Stripe Checkout用
}

export interface RefundResult {
  success: boolean
  refundedAmount?: number
  error?: string
}

// =============================================================================
// 購入処理
// =============================================================================

/**
 * クレジットでの購入処理
 */
export async function purchaseWithCredits(
  userId: string,
  promptId: string
): Promise<PaymentResult> {
  try {
    // プロンプト情報取得
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: { owner: true },
    })

    if (!prompt || !prompt.isPublished) {
      return { success: false, error: 'プロンプトが見つかりません' }
    }

    if (prompt.ownerId === userId) {
      return { success: false, error: '自分のプロンプトは購入できません' }
    }

    // 既に購入済みかチェック
    const existingPurchase = await prisma.purchase.findUnique({
      where: { userId_promptId: { userId, promptId } },
    })

    if (existingPurchase) {
      return { success: false, error: '既に購入済みです' }
    }

    // ユーザーのクレジット確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    if (!user || user.credits < prompt.priceJPY) {
      return { 
        success: false, 
        error: `クレジットが不足しています（必要: ${prompt.priceJPY}、残高: ${user?.credits || 0}）` 
      }
    }

    // トランザクションで一括処理
    const result = await prisma.$transaction(async (tx) => {
      // 1. 購入レコード作成
      const purchase = await tx.purchase.create({
        data: {
          userId,
          promptId,
          priceAtPurchase: prompt.priceJPY,
          status: 'completed',
          paymentProvider: 'credits',
        },
      })

      // 2. 購入者のクレジット減算
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: prompt.priceJPY } },
      })

      // 3. 購入者のクレジット履歴
      await tx.creditHistory.create({
        data: {
          userId,
          amount: -prompt.priceJPY,
          type: 'purchase',
          description: `プロンプト購入: ${prompt.title.slice(0, 30)}`,
        },
      })

      // 4. 売主への収益（無料プロンプトの場合はスキップ）
      if (prompt.priceJPY > 0) {
        const platformFee = Math.floor(prompt.priceJPY * PLATFORM_FEE_RATE)
        const sellerRevenue = prompt.priceJPY - platformFee

        // 売主のウォレット取得/作成
        const sellerWallet = await tx.wallet.upsert({
          where: { userId: prompt.ownerId },
          update: {},
          create: { userId: prompt.ownerId },
        })

        // 保留収益として追加（返金期間後に確定）
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: {
            pendingBalance: { increment: sellerRevenue },
          },
        })

        // 取引履歴
        await tx.transaction.create({
          data: {
            walletId: sellerWallet.id,
            type: 'purchase_revenue',
            amount: sellerRevenue,
            description: `プロンプト「${prompt.title.slice(0, 20)}」の売上（保留中）`,
            purchaseId: purchase.id,
          },
        })

        // 売主のクレジット加算（即時）
        await tx.user.update({
          where: { id: prompt.ownerId },
          data: { credits: { increment: sellerRevenue } },
        })

        await tx.creditHistory.create({
          data: {
            userId: prompt.ownerId,
            amount: sellerRevenue,
            type: 'sale',
            description: `プロンプト売上: ${prompt.title.slice(0, 30)}`,
          },
        })
      }

      return purchase
    })

    return { success: true, purchaseId: result.id }
  } catch (error) {
    console.error('Purchase with credits failed:', error)
    return { success: false, error: '購入処理に失敗しました' }
  }
}

/**
 * Stripe Checkout セッションを作成
 */
export async function createStripeCheckoutSession(
  userId: string,
  promptId: string,
  baseUrl: string
): Promise<PaymentResult> {
  // Stripeが設定されていない場合
  if (!process.env.STRIPE_SECRET_KEY) {
    return { success: false, error: 'Stripe決済は現在利用できません' }
  }

  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: { owner: true },
    })

    if (!prompt || !prompt.isPublished) {
      return { success: false, error: 'プロンプトが見つかりません' }
    }

    if (prompt.priceJPY === 0) {
      return { success: false, error: '無料プロンプトです' }
    }

    // 動的インポート（Stripeがインストールされている場合のみ）
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: prompt.title,
              description: prompt.shortDescription,
            },
            unit_amount: prompt.priceJPY,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/prompts/${promptId}`,
      metadata: {
        promptId,
        buyerId: userId,
        sellerId: prompt.ownerId,
        price: prompt.priceJPY.toString(),
      },
    })

    // 仮購入レコード作成
    await prisma.purchase.create({
      data: {
        userId,
        promptId,
        priceAtPurchase: prompt.priceJPY,
        status: 'pending',
        paymentProvider: 'stripe',
        stripeSessionId: checkoutSession.id,
      },
    })

    return { success: true, redirectUrl: checkoutSession.url || undefined }
  } catch (error) {
    console.error('Stripe checkout creation failed:', error)
    return { success: false, error: 'Stripe決済の開始に失敗しました' }
  }
}

/**
 * Orynthウォレットでの購入処理
 */
export async function purchaseWithOrynth(
  userId: string,
  promptId: string
): Promise<PaymentResult> {
  if (!orynthClient.isEnabled()) {
    return { success: false, error: 'Orynth決済は現在利用できません' }
  }

  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: { owner: true },
    })

    if (!prompt || !prompt.isPublished) {
      return { success: false, error: 'プロンプトが見つかりません' }
    }

    // ユーザーのOrynthウォレット確認
    const userWallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { orynthWalletId: true, orynthConnected: true },
    })

    if (!userWallet?.orynthConnected || !userWallet.orynthWalletId) {
      return { success: false, error: 'Orynthウォレットが連携されていません' }
    }

    // USDC換算
    const amountUSDC = jpyToUsdc(prompt.priceJPY)

    // Orynth支払い処理
    const paymentResult = await orynthClient.sendPayment({
      amount: amountUSDC,
      recipientWalletId: process.env.ORYNTH_PLATFORM_WALLET_ID || '',
      memo: `Prompt purchase: ${promptId}`,
    })

    if (!paymentResult?.txId) {
      return { success: false, error: 'Orynth決済に失敗しました' }
    }

    // 購入レコード作成
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        promptId,
        priceAtPurchase: prompt.priceJPY,
        status: 'completed',
        paymentProvider: 'orynth',
        orynthTxId: paymentResult.txId,
      },
    })

    // 売主への収益処理（クレジットと同様）
    if (prompt.priceJPY > 0) {
      const sellerRevenue = Math.floor(prompt.priceJPY * CREATOR_REVENUE_RATE)
      
      await prisma.$transaction([
        prisma.wallet.upsert({
          where: { userId: prompt.ownerId },
          update: { pendingBalance: { increment: sellerRevenue } },
          create: { userId: prompt.ownerId, pendingBalance: sellerRevenue },
        }),
        prisma.user.update({
          where: { id: prompt.ownerId },
          data: { credits: { increment: sellerRevenue } },
        }),
        prisma.creditHistory.create({
          data: {
            userId: prompt.ownerId,
            amount: sellerRevenue,
            type: 'sale',
            description: `プロンプト売上（Orynth）: ${prompt.title.slice(0, 30)}`,
          },
        }),
      ])
    }

    return { success: true, purchaseId: purchase.id }
  } catch (error) {
    console.error('Orynth purchase failed:', error)
    return { success: false, error: 'Orynth決済に失敗しました' }
  }
}

// =============================================================================
// 返金処理
// =============================================================================

/**
 * 返金可能かチェック
 */
export function isRefundable(purchaseDate: Date): boolean {
  const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysSincePurchase <= PAYOUT_CONFIG.refundPeriodDays
}

/**
 * 返金処理
 */
export async function processRefund(
  purchaseId: string,
  requesterId: string,
  reason?: string
): Promise<RefundResult> {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        prompt: { include: { owner: true } },
        user: true,
      },
    })

    if (!purchase) {
      return { success: false, error: '購入記録が見つかりません' }
    }

    if (purchase.userId !== requesterId) {
      return { success: false, error: '返金をリクエストする権限がありません' }
    }

    if (purchase.status === 'refunded') {
      return { success: false, error: '既に返金済みです' }
    }

    if (!isRefundable(purchase.createdAt)) {
      return { 
        success: false, 
        error: `購入から${PAYOUT_CONFIG.refundPeriodDays}日以上経過しているため返金できません` 
      }
    }

    const refundAmount = purchase.priceAtPurchase
    const sellerDeduction = Math.floor(refundAmount * CREATOR_REVENUE_RATE)

    // トランザクションで一括処理
    await prisma.$transaction(async (tx) => {
      // 1. 購入ステータス更新
      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
          refundReason: reason,
        },
      })

      // 2. Stripe返金（該当する場合）
      if (purchase.paymentProvider === 'stripe' && purchase.stripePaymentId) {
        try {
          const Stripe = (await import('stripe')).default
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
          await stripe.refunds.create({
            payment_intent: purchase.stripePaymentId,
          })
        } catch (stripeError) {
          console.error('Stripe refund failed:', stripeError)
          throw new Error('Stripe返金に失敗しました')
        }
      }

      // 3. クレジット返金（クレジット決済の場合）
      if (purchase.paymentProvider === 'credits') {
        await tx.user.update({
          where: { id: purchase.userId },
          data: { credits: { increment: refundAmount } },
        })

        await tx.creditHistory.create({
          data: {
            userId: purchase.userId,
            amount: refundAmount,
            type: 'refund',
            description: `返金: ${purchase.prompt.title.slice(0, 30)}`,
          },
        })
      }

      // 4. 売主の収益を取り消し
      if (refundAmount > 0) {
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: purchase.prompt.ownerId },
        })

        if (sellerWallet) {
          // 保留残高から減算
          await tx.wallet.update({
            where: { id: sellerWallet.id },
            data: {
              pendingBalance: { decrement: Math.min(sellerDeduction, sellerWallet.pendingBalance) },
            },
          })

          // 返金取引を記録
          await tx.transaction.create({
            data: {
              walletId: sellerWallet.id,
              type: 'refund',
              amount: -sellerDeduction,
              description: `返金による売上取消: ${purchase.prompt.title.slice(0, 20)}`,
              purchaseId,
            },
          })
        }

        // 売主のクレジットも減算
        await tx.user.update({
          where: { id: purchase.prompt.ownerId },
          data: { credits: { decrement: sellerDeduction } },
        })

        await tx.creditHistory.create({
          data: {
            userId: purchase.prompt.ownerId,
            amount: -sellerDeduction,
            type: 'refund',
            description: `返金による売上取消: ${purchase.prompt.title.slice(0, 30)}`,
          },
        })
      }
    })

    return { success: true, refundedAmount: refundAmount }
  } catch (error) {
    console.error('Refund processing failed:', error)
    return { success: false, error: error instanceof Error ? error.message : '返金処理に失敗しました' }
  }
}

// =============================================================================
// 収益確定処理（返金期間後）
// =============================================================================

/**
 * 保留中の収益を確定（バッチ処理用）
 */
export async function confirmPendingRevenues(): Promise<{
  confirmedCount: number
  totalAmount: number
}> {
  const refundDeadline = new Date()
  refundDeadline.setDate(refundDeadline.getDate() - PAYOUT_CONFIG.refundPeriodDays)

  // 返金期間を過ぎた未確定の購入を取得
  const eligiblePurchases = await prisma.purchase.findMany({
    where: {
      status: 'completed',
      createdAt: { lt: refundDeadline },
    },
    include: {
      prompt: true,
      transactions: {
        where: { type: 'purchase_revenue' },
      },
    },
  })

  let confirmedCount = 0
  let totalAmount = 0

  for (const purchase of eligiblePurchases) {
    // 既に確定済みの取引はスキップ
    const pendingTx = purchase.transactions.find(
      (tx) => tx.description?.includes('保留中')
    )
    if (!pendingTx) continue

    try {
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId: purchase.prompt.ownerId },
        })

        if (!wallet) return

        const revenueAmount = pendingTx.amount

        // 保留残高から確定残高へ移動
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            pendingBalance: { decrement: revenueAmount },
            balance: { increment: revenueAmount },
            totalEarned: { increment: revenueAmount },
          },
        })

        // 取引履歴を更新
        await tx.transaction.update({
          where: { id: pendingTx.id },
          data: {
            description: pendingTx.description?.replace('（保留中）', '（確定）'),
          },
        })

        confirmedCount++
        totalAmount += revenueAmount
      })
    } catch (error) {
      console.error(`Failed to confirm revenue for purchase ${purchase.id}:`, error)
    }
  }

  return { confirmedCount, totalAmount }
}

