import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PAYOUT_CONFIG } from '@/lib/constants'
import { z } from 'zod'

// バリデーションスキーマ
const payoutRequestSchema = z.object({
  amount: z.number().min(PAYOUT_CONFIG.minimumAmount, `最低${PAYOUT_CONFIG.minimumAmount}円から出金可能です`),
  bankName: z.string().min(1, '銀行名を入力してください'),
  branchName: z.string().min(1, '支店名を入力してください'),
  accountType: z.enum(['普通', '当座']),
  accountNumber: z.string().regex(/^\d{7}$/, '口座番号は7桁の数字で入力してください'),
  accountHolder: z.string().min(1, '口座名義を入力してください'),
})

/**
 * POST /api/wallet/payout
 * 出金リクエストを作成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const body = await request.json()
    const result = payoutRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { amount, bankName, branchName, accountType, accountNumber, accountHolder } = result.data

    // ウォレット確認
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'ウォレットが見つかりません' }, { status: 404 })
    }

    // 残高確認
    if (wallet.balance < amount) {
      return NextResponse.json(
        { error: `残高が不足しています（残高: ¥${wallet.balance.toLocaleString()}）` },
        { status: 400 }
      )
    }

    // 手数料計算
    const fee = PAYOUT_CONFIG.bankTransferFee
    const netAmount = amount - fee

    if (netAmount <= 0) {
      return NextResponse.json(
        { error: '出金額が振込手数料を下回っています' },
        { status: 400 }
      )
    }

    // 未処理の出金リクエストがないかチェック
    const pendingPayout = await prisma.payoutRequest.findFirst({
      where: {
        walletId: wallet.id,
        status: { in: ['pending', 'processing'] },
      },
    })

    if (pendingPayout) {
      return NextResponse.json(
        { error: '処理中の出金リクエストがあります。完了後に再度お試しください。' },
        { status: 400 }
      )
    }

    // トランザクションで出金リクエスト作成
    const payout = await prisma.$transaction(async (tx) => {
      // 1. 残高を減算
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        },
      })

      // 2. 出金リクエスト作成
      const payoutRequest = await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          amount,
          fee,
          netAmount,
          bankName,
          branchName,
          accountType,
          accountNumber,
          accountHolder,
          status: 'pending',
        },
      })

      // 3. 取引履歴記録
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'payout',
          amount: -amount,
          description: `出金リクエスト（${bankName} ${branchName}）`,
        },
      })

      return payoutRequest
    })

    return NextResponse.json({
      message: '出金リクエストを受け付けました',
      payoutId: payout.id,
      amount: payout.amount,
      fee: payout.fee,
      netAmount: payout.netAmount,
      estimatedProcessingDays: PAYOUT_CONFIG.processingDays,
    })
  } catch (error) {
    console.error('Payout request error:', error)
    return NextResponse.json(
      { error: '出金リクエストに失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/wallet/payout
 * 出金履歴を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ payouts: [] })
    }

    const payouts = await prisma.payoutRequest.findMany({
      where: {
        walletId: wallet.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        processedAt: true,
        status: true,
        amount: true,
        fee: true,
        netAmount: true,
        bankName: true,
        branchName: true,
        failureReason: true,
      },
    })

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error('Payout history fetch error:', error)
    return NextResponse.json(
      { error: '出金履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wallet/payout
 * 保留中の出金リクエストをキャンセル
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { payoutId } = await request.json()

    if (!payoutId) {
      return NextResponse.json({ error: '出金リクエストIDが必要です' }, { status: 400 })
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'ウォレットが見つかりません' }, { status: 404 })
    }

    const payout = await prisma.payoutRequest.findFirst({
      where: {
        id: payoutId,
        walletId: wallet.id,
      },
    })

    if (!payout) {
      return NextResponse.json({ error: '出金リクエストが見つかりません' }, { status: 404 })
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: '処理中または完了済みの出金リクエストはキャンセルできません' },
        { status: 400 }
      )
    }

    // トランザクションでキャンセル処理
    await prisma.$transaction(async (tx) => {
      // 1. 残高を戻す
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: payout.amount },
          totalWithdrawn: { decrement: payout.amount },
        },
      })

      // 2. ステータス更新
      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'cancelled' },
      })

      // 3. 取引履歴記録
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'payout',
          amount: payout.amount,
          description: '出金リクエストのキャンセル',
        },
      })
    })

    return NextResponse.json({
      message: '出金リクエストをキャンセルしました',
      refundedAmount: payout.amount,
    })
  } catch (error) {
    console.error('Payout cancel error:', error)
    return NextResponse.json(
      { error: 'キャンセル処理に失敗しました' },
      { status: 500 }
    )
  }
}

