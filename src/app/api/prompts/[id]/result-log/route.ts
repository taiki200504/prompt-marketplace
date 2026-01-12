import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resultLogSchema } from '@/lib/validations'
import { validateMetricValue, detectStatisticalAnomalies } from '@/lib/metric-validation'
import { notifyResultLog } from '@/lib/notifications'

// POST /api/prompts/[id]/result-log - Create a result log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        purchases: {
          where: { userId: session.user.id, status: 'completed' },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // Check if user can log result (owner, purchased, or free)
    const hasPurchased = prompt.purchases.length > 0
    const isFree = prompt.priceJPY === 0
    const isOwner = prompt.ownerId === session.user.id

    if (!hasPurchased && !isFree && !isOwner) {
      return NextResponse.json(
        { error: '購入後に成果を記録できます' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = resultLogSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { metricType, metricValue, metricUnit, note } = result.data

    // 1. 値の妥当性チェック
    const validation = validateMetricValue(metricType, metricValue, metricUnit)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      )
    }

    // 2. 統計的異常検知
    const anomalyCheck = await detectStatisticalAnomalies(
      promptId,
      metricValue,
      metricType,
      prisma
    )

    // フラグを設定（異常値または妥当性チェックでフラグ付き）
    const shouldFlag = validation.flagged || anomalyCheck.isAnomaly

    const resultLog = await prisma.resultLog.create({
      data: {
        userId: session.user.id,
        promptId,
        metricType,
        metricValue,
        metricUnit,
        note,
        isFlagged: shouldFlag,
      },
    })

    // オンボーディング進捗を更新
    await prisma.userOnboarding.upsert({
      where: { userId: session.user.id },
      update: { firstResultLog: true },
      create: { userId: session.user.id, firstResultLog: true },
    })

    // 通知を送信（自分のプロンプトでなければ）
    if (!isOwner) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true },
      })

      if (user) {
        notifyResultLog(
          prompt.ownerId,
          user.username,
          promptId,
          prompt.title,
          metricType,
          metricValue,
          metricUnit
        ).catch((err) => console.error('Failed to send result log notification:', err))
      }
    }

    return NextResponse.json({
      ...resultLog,
      warning: validation.flagged ? validation.message : undefined,
      anomalyWarning: anomalyCheck.isAnomaly ? anomalyCheck.message : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating result log:', error)
    return NextResponse.json(
      { error: '成果の記録に失敗しました' },
      { status: 500 }
    )
  }
}

// GET /api/prompts/[id]/result-log - Get result logs for a prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeFlags = searchParams.get('includeFlags') === 'true'

    const resultLogs = await prisma.resultLog.findMany({
      where: {
        promptId,
        ...(includeFlags ? {} : { isFlagged: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        metricType: true,
        metricValue: true,
        metricUnit: true,
        note: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    })

    // 集計情報も返す
    const aggregation = await prisma.resultLog.groupBy({
      by: ['metricType'],
      where: { promptId, isFlagged: false },
      _count: true,
      _sum: { metricValue: true },
      _avg: { metricValue: true },
    })

    const summary = aggregation.map((agg) => ({
      metricType: agg.metricType,
      count: agg._count,
      total: Math.round((agg._sum.metricValue || 0) * 10) / 10,
      average: Math.round((agg._avg.metricValue || 0) * 10) / 10,
    }))

    return NextResponse.json({
      logs: resultLogs,
      summary,
      totalCount: resultLogs.length,
    })
  } catch (error) {
    console.error('Error fetching result logs:', error)
    return NextResponse.json(
      { error: '成果記録の取得に失敗しました' },
      { status: 500 }
    )
  }
}
