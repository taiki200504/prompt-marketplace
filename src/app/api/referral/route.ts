import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateReferralCode } from '@/lib/referral'
import { REFERRAL_CONFIG } from '@/lib/constants'

/**
 * GET /api/referral
 * 自分の紹介コードと統計を取得
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const referralInfo = await getOrCreateReferralCode(session.user.id)

    // 紹介したユーザーの詳細を取得
    const referral = await prisma.referral.findFirst({
      where: { referrerId: session.user.id },
      include: {
        referredUsers: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            createdAt: true,
            rewardStatus: true,
            rewardAmount: true,
            referredUser: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    // 次のティアまでの必要紹介数
    const currentTierIndex = REFERRAL_CONFIG.tiers.findIndex(
      (t) => t.title === referralInfo.tier.title
    )
    const nextTier = REFERRAL_CONFIG.tiers[currentTierIndex + 1]
    const remainingForNextTier = nextTier
      ? nextTier.minReferrals - referralInfo.totalSignups
      : 0

    return NextResponse.json({
      code: referralInfo.code,
      totalSignups: referralInfo.totalSignups,
      totalRewards: referralInfo.totalRewards,
      currentTier: referralInfo.tier,
      nextTier: nextTier || null,
      remainingForNextTier,
      ongoingRevenueShare: `${REFERRAL_CONFIG.ongoingRevenueShare * 100}%`,
      referredUsers: referral?.referredUsers.map((u) => ({
        id: u.id,
        username: u.referredUser.username,
        displayName: u.referredUser.displayName,
        createdAt: u.createdAt,
        rewardStatus: u.rewardStatus,
        rewardAmount: u.rewardAmount,
      })) || [],
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/signup?ref=${referralInfo.code}`,
    })
  } catch (error) {
    console.error('Referral fetch error:', error)
    return NextResponse.json(
      { error: '紹介情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/referral/validate
 * 紹介コードの有効性を確認
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ valid: false, error: 'コードが必要です' })
    }

    const referral = await prisma.referral.findUnique({
      where: { referrerCode: code.toUpperCase() },
      include: {
        referrer: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    })

    if (!referral) {
      return NextResponse.json({ valid: false, error: '無効な紹介コードです' })
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        username: referral.referrer.username,
        displayName: referral.referrer.displayName,
      },
    })
  } catch (error) {
    console.error('Referral validation error:', error)
    return NextResponse.json({ valid: false, error: '検証に失敗しました' })
  }
}

