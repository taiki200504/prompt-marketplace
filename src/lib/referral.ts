/**
 * リファラルプログラム管理
 */

import { prisma } from './prisma'
import { REFERRAL_CONFIG } from './constants'

// =============================================================================
// 紹介コード生成
// =============================================================================

/**
 * ランダムな紹介コードを生成
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字を除外
  let code = ''
  for (let i = 0; i < REFERRAL_CONFIG.codeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * ユーザーの紹介コードを取得または作成
 */
export async function getOrCreateReferralCode(userId: string): Promise<{
  code: string
  totalSignups: number
  totalRewards: number
  tier: { title: string; rewardPerReferral: number }
}> {
  // 既存のリファラルを確認
  let referral = await prisma.referral.findFirst({
    where: { referrerId: userId },
  })

  if (!referral) {
    // 新規作成（一意のコードになるまで再試行）
    let attempts = 0
    while (attempts < 10) {
      const code = generateReferralCode()
      try {
        referral = await prisma.referral.create({
          data: {
            referrerId: userId,
            referrerCode: code,
          },
        })
        break
      } catch {
        attempts++
      }
    }

    if (!referral) {
      throw new Error('紹介コードの生成に失敗しました')
    }
  }

  // 現在のティアを計算
  const tier = REFERRAL_CONFIG.tiers
    .slice()
    .reverse()
    .find((t) => referral!.totalSignups >= t.minReferrals) || REFERRAL_CONFIG.tiers[0]

  return {
    code: referral.referrerCode,
    totalSignups: referral.totalSignups,
    totalRewards: referral.totalRewards,
    tier,
  }
}

// =============================================================================
// 紹介登録処理
// =============================================================================

/**
 * 紹介コードを使った新規登録処理
 */
export async function processReferralSignup(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string }> {
  // 紹介コードを検索
  const referral = await prisma.referral.findUnique({
    where: { referrerCode: referralCode.toUpperCase() },
  })

  if (!referral) {
    return { success: false, message: '無効な紹介コードです' }
  }

  // 自己参照防止
  if (referral.referrerId === newUserId) {
    return { success: false, message: '自分の紹介コードは使用できません' }
  }

  // 既に紹介済みかチェック
  const existingSignup = await prisma.referralSignup.findUnique({
    where: { referredUserId: newUserId },
  })

  if (existingSignup) {
    return { success: false, message: '既に紹介登録済みです' }
  }

  // 紹介登録を作成
  await prisma.$transaction([
    prisma.referralSignup.create({
      data: {
        referralId: referral.id,
        referredUserId: newUserId,
        rewardStatus: 'pending',
      },
    }),
    prisma.referral.update({
      where: { id: referral.id },
      data: { totalSignups: { increment: 1 } },
    }),
  ])

  return { success: true, message: '紹介登録が完了しました' }
}

// =============================================================================
// 報酬処理
// =============================================================================

/**
 * 購入時に紹介報酬をチェック・付与
 */
export async function checkAndGrantReferralReward(userId: string): Promise<{
  rewarded: boolean
  amount?: number
}> {
  // 紹介登録を確認
  const signup = await prisma.referralSignup.findUnique({
    where: { referredUserId: userId },
    include: { referral: true },
  })

  if (!signup || signup.rewardStatus !== 'pending') {
    return { rewarded: false }
  }

  // 購入数をチェック
  const purchaseCount = await prisma.purchase.count({
    where: { userId, status: 'completed' },
  })

  if (purchaseCount < REFERRAL_CONFIG.requiredPurchases) {
    return { rewarded: false }
  }

  // 不正チェック
  const fraudCheck = await checkReferralFraud(signup.referral.referrerId, userId)
  if (fraudCheck.isFraudulent) {
    await prisma.referralSignup.update({
      where: { id: signup.id },
      data: {
        rewardStatus: 'fraudulent',
        isSuspicious: true,
        suspicionReason: fraudCheck.reasons.join(', '),
      },
    })
    return { rewarded: false }
  }

  // 紹介者のティアに基づく報酬額
  const referrer = await prisma.referral.findUnique({
    where: { id: signup.referralId },
  })
  
  const tier = REFERRAL_CONFIG.tiers
    .slice()
    .reverse()
    .find((t) => (referrer?.totalSignups || 0) >= t.minReferrals) || REFERRAL_CONFIG.tiers[0]

  const rewardAmount = tier.rewardPerReferral

  // 報酬を付与
  await prisma.$transaction(async (tx) => {
    // 紹介者のウォレットに報酬追加
    const referrerWallet = await tx.wallet.upsert({
      where: { userId: signup.referral.referrerId },
      update: { balance: { increment: rewardAmount } },
      create: { userId: signup.referral.referrerId, balance: rewardAmount },
    })

    // 取引記録
    await tx.transaction.create({
      data: {
        walletId: referrerWallet.id,
        type: 'referral_reward',
        amount: rewardAmount,
        description: `紹介報酬（${tier.title}ティア）`,
      },
    })

    // 紹介者のクレジットにも追加
    await tx.user.update({
      where: { id: signup.referral.referrerId },
      data: { credits: { increment: rewardAmount } },
    })

    await tx.creditHistory.create({
      data: {
        userId: signup.referral.referrerId,
        amount: rewardAmount,
        type: 'bonus',
        description: '紹介報酬',
      },
    })

    // ステータス更新
    await tx.referralSignup.update({
      where: { id: signup.id },
      data: {
        rewardStatus: 'paid',
        rewardAmount,
        paidAt: new Date(),
      },
    })

    // リファラル統計更新
    await tx.referral.update({
      where: { id: signup.referralId },
      data: { totalRewards: { increment: rewardAmount } },
    })
  })

  return { rewarded: true, amount: rewardAmount }
}

// =============================================================================
// 不正検知
// =============================================================================

interface FraudCheckResult {
  isFraudulent: boolean
  score: number
  reasons: string[]
}

/**
 * リファラル不正をチェック
 */
async function checkReferralFraud(
  referrerId: string,
  referredUserId: string
): Promise<FraudCheckResult> {
  const reasons: string[] = []
  let score = 0

  // 1. 同じIPアドレスからの登録チェック
  const [referrerLogs, referredLogs] = await Promise.all([
    prisma.loginLog.findMany({
      where: { userId: referrerId },
      select: { ipAddress: true },
      take: 10,
    }),
    prisma.loginLog.findMany({
      where: { userId: referredUserId },
      select: { ipAddress: true },
      take: 10,
    }),
  ])

  const referrerIPs = new Set(referrerLogs.map((l) => l.ipAddress))
  const sharedIPs = referredLogs.filter((l) => referrerIPs.has(l.ipAddress))
  
  if (sharedIPs.length > 0) {
    score += 40
    reasons.push('同一IPアドレス検出')
  }

  // 2. メールドメインパターン
  const [referrer, referred] = await Promise.all([
    prisma.user.findUnique({ where: { id: referrerId }, select: { email: true } }),
    prisma.user.findUnique({ where: { id: referredUserId }, select: { email: true } }),
  ])

  if (referrer?.email && referred?.email) {
    const referrerDomain = referrer.email.split('@')[1]
    const referredDomain = referred.email.split('@')[1]

    // 同じドメイン（一般的なフリーメール以外）
    const freeMailDomains = ['gmail.com', 'yahoo.co.jp', 'hotmail.com', 'outlook.com']
    if (referrerDomain === referredDomain && !freeMailDomains.includes(referrerDomain)) {
      score += 20
      reasons.push('同一メールドメイン')
    }

    // 連番パターン（example1@, example2@）
    const numberPattern = /\d+@/
    if (numberPattern.test(referrer.email) && numberPattern.test(referred.email)) {
      score += 15
      reasons.push('連番メールパターン')
    }
  }

  // 3. 短期間での大量紹介
  const recentSignups = await prisma.referralSignup.count({
    where: {
      referral: { referrerId },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 過去24時間
    },
  })

  if (recentSignups >= 5) {
    score += 25
    reasons.push('短期間での大量紹介')
  }

  return {
    isFraudulent: score >= 50,
    score,
    reasons,
  }
}

// =============================================================================
// 継続報酬（収益シェア）
// =============================================================================

/**
 * 売上発生時に紹介者への継続報酬を計算・付与
 */
export async function grantOngoingRevenueShare(
  sellerId: string,
  saleAmount: number
): Promise<{ granted: boolean; amount?: number; referrerId?: string }> {
  // 売主が紹介経由で登録したかチェック
  const signup = await prisma.referralSignup.findUnique({
    where: { referredUserId: sellerId },
    include: { referral: true },
  })

  if (!signup || signup.rewardStatus === 'fraudulent') {
    return { granted: false }
  }

  const shareAmount = Math.floor(saleAmount * REFERRAL_CONFIG.ongoingRevenueShare)
  
  if (shareAmount <= 0) {
    return { granted: false }
  }

  await prisma.$transaction(async (tx) => {
    const referrerWallet = await tx.wallet.upsert({
      where: { userId: signup.referral.referrerId },
      update: { balance: { increment: shareAmount } },
      create: { userId: signup.referral.referrerId, balance: shareAmount },
    })

    await tx.transaction.create({
      data: {
        walletId: referrerWallet.id,
        type: 'referral_reward',
        amount: shareAmount,
        description: `継続報酬（${REFERRAL_CONFIG.ongoingRevenueShare * 100}%シェア）`,
      },
    })

    await tx.referral.update({
      where: { id: signup.referralId },
      data: { totalRewards: { increment: shareAmount } },
    })
  })

  return {
    granted: true,
    amount: shareAmount,
    referrerId: signup.referral.referrerId,
  }
}

