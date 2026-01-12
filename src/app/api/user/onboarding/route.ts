import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// オンボーディングステップの定義
const ONBOARDING_STEPS = {
  creator: [
    { id: 'profile', label: 'プロフィールを設定', field: 'profileCompleted', icon: '👤' },
    { id: 'view', label: 'プロンプトを見てみる', field: 'firstPromptViewed', icon: '👀' },
    { id: 'create', label: 'プロンプトを作成', field: 'firstPromptCreated', icon: '✍️' },
    { id: 'publish', label: 'プロンプトを公開', field: 'firstPromptPublished', icon: '🚀' },
    { id: 'bank', label: '振込先を登録', field: 'bankAccountAdded', icon: '🏦' },
  ],
  buyer: [
    { id: 'profile', label: 'プロフィールを設定', field: 'profileCompleted', icon: '👤' },
    { id: 'view', label: 'プロンプトを見てみる', field: 'firstPromptViewed', icon: '👀' },
    { id: 'try', label: 'プロンプトを試す', field: 'firstPromptTried', icon: '🧪' },
    { id: 'purchase', label: 'プロンプトを購入/取得', field: 'firstPurchase', icon: '🛒' },
    { id: 'review', label: 'レビューを書く', field: 'firstReview', icon: '⭐' },
    { id: 'result', label: '成果を記録', field: 'firstResultLog', icon: '📊' },
  ],
  both: [
    { id: 'profile', label: 'プロフィールを設定', field: 'profileCompleted', icon: '👤' },
    { id: 'view', label: 'プロンプトを見てみる', field: 'firstPromptViewed', icon: '👀' },
    { id: 'create', label: 'プロンプトを作成', field: 'firstPromptCreated', icon: '✍️' },
    { id: 'purchase', label: 'プロンプトを購入', field: 'firstPurchase', icon: '🛒' },
  ],
} as const

type UserType = keyof typeof ONBOARDING_STEPS

/**
 * GET /api/user/onboarding
 * オンボーディング進捗を取得
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    })

    const userType = (onboarding.userType as UserType) || 'buyer'
    const stepDefinitions = ONBOARDING_STEPS[userType] || ONBOARDING_STEPS.buyer

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const steps = stepDefinitions.map((step: any) => ({
      id: step.id,
      label: step.label,
      icon: step.icon,
      completed: (onboarding as Record<string, unknown>)[step.field] === true,
    }))

    const completedCount = steps.filter((s) => s.completed).length
    const progress = Math.round((completedCount / steps.length) * 100)

    // 次にやるべきステップ
    const nextStep = steps.find((s) => !s.completed)

    return NextResponse.json({
      userType,
      steps,
      progress,
      completedCount,
      totalSteps: steps.length,
      showTour: !onboarding.tourShown,
      isComplete: completedCount === steps.length,
      nextStep: nextStep || null,
    })
  } catch (error) {
    console.error('Onboarding fetch error:', error)
    return NextResponse.json(
      { error: 'オンボーディング情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/onboarding
 * オンボーディング進捗を更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { step, userType, tourShown } = body

    const updateData: Record<string, boolean | string> = {}

    // ユーザータイプの設定
    if (userType && ['creator', 'buyer', 'both'].includes(userType)) {
      updateData.userType = userType
    }

    // ツアー表示フラグ
    if (tourShown === true) {
      updateData.tourShown = true
    }

    // ステップ完了の更新
    if (step) {
      const fieldMap: Record<string, string> = {
        profile: 'profileCompleted',
        view: 'firstPromptViewed',
        create: 'firstPromptCreated',
        publish: 'firstPromptPublished',
        bank: 'bankAccountAdded',
        sale: 'firstSale',
        try: 'firstPromptTried',
        purchase: 'firstPurchase',
        review: 'firstReview',
        result: 'firstResultLog',
        payment: 'paymentMethodAdded',
      }

      const field = fieldMap[step]
      if (field) {
        updateData[field] = true
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '更新するデータがありません' }, { status: 400 })
    }

    const updated = await prisma.userOnboarding.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    })

    return NextResponse.json({
      success: true,
      updated: updateData,
      onboarding: updated,
    })
  } catch (error) {
    console.error('Onboarding update error:', error)
    return NextResponse.json(
      { error: 'オンボーディングの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/onboarding/reset
 * オンボーディングをリセット（開発用）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    // 本番環境では無効化
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'この操作は開発環境でのみ利用可能です' }, { status: 403 })
    }

    await prisma.userOnboarding.delete({
      where: { userId: session.user.id },
    }).catch(() => {
      // 存在しない場合は無視
    })

    return NextResponse.json({ success: true, message: 'オンボーディングをリセットしました' })
  } catch (error) {
    console.error('Onboarding reset error:', error)
    return NextResponse.json(
      { error: 'リセットに失敗しました' },
      { status: 500 }
    )
  }
}

