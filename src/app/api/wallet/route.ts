import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PAYOUT_CONFIG } from '@/lib/constants'

/**
 * GET /api/wallet
 * ウォレット情報を取得
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    // ウォレット情報を取得（なければ作成）
    const wallet = await prisma.wallet.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            type: true,
            amount: true,
            description: true,
          },
        },
        payoutRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            createdAt: true,
            status: true,
            amount: true,
            netAmount: true,
          },
        },
      },
    })

    // ユーザーのクレジット残高も取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    // 出金可能額の計算
    const withdrawableAmount = Math.max(0, wallet.balance - PAYOUT_CONFIG.bankTransferFee)
    const canWithdraw = withdrawableAmount >= PAYOUT_CONFIG.minimumAmount

    return NextResponse.json({
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      credits: user?.credits || 0,
      
      // 出金関連
      withdrawableAmount,
      canWithdraw,
      minimumWithdrawal: PAYOUT_CONFIG.minimumAmount,
      transferFee: PAYOUT_CONFIG.bankTransferFee,
      
      // Orynth連携
      orynthConnected: wallet.orynthConnected,
      
      // 履歴
      recentTransactions: wallet.transactions,
      recentPayouts: wallet.payoutRequests,
    })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json(
      { error: 'ウォレット情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/wallet/transactions
 * 取引履歴を取得（ページネーション対応）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const body = await request.json()
    const cursor = body.cursor
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100)
    const type = typeof body.type === 'string' ? body.type : undefined

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ transactions: [], hasMore: false })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: {
        id: true,
        createdAt: true,
        type: true,
        amount: true,
        description: true,
      },
    })

    const hasMore = transactions.length > limit
    if (hasMore) transactions.pop()

    return NextResponse.json({
      transactions,
      hasMore,
      nextCursor: hasMore ? transactions[transactions.length - 1].id : null,
    })
  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json(
      { error: '取引履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}

