/**
 * API コスト管理ユーティリティ
 * OpenAI APIの使用量追跡とコスト計算
 */

import { prisma } from './prisma'
import { MODEL_COSTS, MONTHLY_API_COST_LIMIT_USD, type SupportedModel } from './constants'

// =============================================================================
// コスト計算
// =============================================================================

interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

/**
 * トークン使用量からUSDコストを計算
 */
export function calculateCostUSD(model: SupportedModel, usage: TokenUsage): number {
  const costs = MODEL_COSTS[model]
  if (!costs) {
    console.warn(`Unknown model: ${model}, using gpt-4o-mini costs`)
    return calculateCostUSD('gpt-4o-mini', usage)
  }

  const inputCost = (usage.inputTokens / 1_000_000) * costs.input
  const outputCost = (usage.outputTokens / 1_000_000) * costs.output
  
  return Math.round((inputCost + outputCost) * 1000000) / 1000000 // 6桁精度
}

/**
 * モデルごとの1回あたりの推定コスト（クレジット換算）
 */
export function getExecutionCost(model: SupportedModel): number {
  return MODEL_COSTS[model]?.creditsPerExecution || 10
}

// =============================================================================
// 使用量追跡
// =============================================================================

/**
 * API使用ログを記録
 */
export async function logApiUsage(
  model: string,
  tokens: number,
  costUSD: number
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.apiCostLog.create({
    data: {
      date: today,
      model,
      tokens,
      costUSD,
    },
  })
}

/**
 * 月間コストを取得
 */
export async function getMonthlyApiCost(): Promise<{
  totalCostUSD: number
  limitUSD: number
  usagePercent: number
  isOverLimit: boolean
}> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const result = await prisma.apiCostLog.aggregate({
    where: { date: { gte: startOfMonth } },
    _sum: { costUSD: true },
  })

  const totalCostUSD = result._sum.costUSD || 0
  const usagePercent = (totalCostUSD / MONTHLY_API_COST_LIMIT_USD) * 100

  return {
    totalCostUSD: Math.round(totalCostUSD * 100) / 100,
    limitUSD: MONTHLY_API_COST_LIMIT_USD,
    usagePercent: Math.round(usagePercent * 10) / 10,
    isOverLimit: totalCostUSD >= MONTHLY_API_COST_LIMIT_USD,
  }
}

/**
 * コスト上限チェック
 */
export async function checkCostLimit(): Promise<{
  allowed: boolean
  reason?: string
  remainingBudgetUSD?: number
}> {
  const monthlyStats = await getMonthlyApiCost()

  if (monthlyStats.isOverLimit) {
    return {
      allowed: false,
      reason: `月間APIコスト上限（$${MONTHLY_API_COST_LIMIT_USD}）に達しました。来月までお待ちください。`,
    }
  }

  // 90%以上で警告
  if (monthlyStats.usagePercent >= 90) {
    console.warn(`API cost warning: ${monthlyStats.usagePercent}% of monthly limit used`)
  }

  return {
    allowed: true,
    remainingBudgetUSD: MONTHLY_API_COST_LIMIT_USD - monthlyStats.totalCostUSD,
  }
}

// =============================================================================
// ユーザー使用量クォータ
// =============================================================================

/**
 * ユーザーの日次クォータを取得または作成
 */
export async function getUserDailyQuota(userId: string): Promise<{
  freeExecutions: number
  paidExecutions: number
  tokensUsed: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const quota = await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  })

  return {
    freeExecutions: quota.freeExecutions,
    paidExecutions: quota.paidExecutions,
    tokensUsed: quota.tokensUsed,
  }
}

/**
 * ユーザーのクォータを更新
 */
export async function incrementUserQuota(
  userId: string,
  isFree: boolean,
  tokensUsed: number
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date: today } },
    update: {
      freeExecutions: isFree ? { increment: 1 } : undefined,
      paidExecutions: !isFree ? { increment: 1 } : undefined,
      tokensUsed: { increment: tokensUsed },
    },
    create: {
      userId,
      date: today,
      freeExecutions: isFree ? 1 : 0,
      paidExecutions: !isFree ? 1 : 0,
      tokensUsed,
    },
  })
}

// =============================================================================
// 統計
// =============================================================================

/**
 * モデル別の使用統計を取得
 */
export async function getModelUsageStats(days: number = 30): Promise<Array<{
  model: string
  totalTokens: number
  totalCostUSD: number
  executionCount: number
}>> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const logs = await prisma.apiCostLog.groupBy({
    by: ['model'],
    where: { date: { gte: startDate } },
    _sum: { tokens: true, costUSD: true },
    _count: true,
  })

  return logs.map((log) => ({
    model: log.model,
    totalTokens: log._sum.tokens || 0,
    totalCostUSD: Math.round((log._sum.costUSD || 0) * 100) / 100,
    executionCount: log._count,
  }))
}

/**
 * 日別コスト推移を取得
 */
export async function getDailyCostTrend(days: number = 30): Promise<Array<{
  date: string
  costUSD: number
  tokens: number
}>> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const logs = await prisma.apiCostLog.findMany({
    where: { date: { gte: startDate } },
    select: { date: true, costUSD: true, tokens: true },
    orderBy: { date: 'asc' },
  })

  // 日付ごとに集計
  const dailyMap = new Map<string, { costUSD: number; tokens: number }>()
  
  for (const log of logs) {
    const dateKey = log.date.toISOString().split('T')[0]
    const existing = dailyMap.get(dateKey) || { costUSD: 0, tokens: 0 }
    dailyMap.set(dateKey, {
      costUSD: existing.costUSD + log.costUSD,
      tokens: existing.tokens + log.tokens,
    })
  }

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    costUSD: Math.round(data.costUSD * 100) / 100,
    tokens: data.tokens,
  }))
}

