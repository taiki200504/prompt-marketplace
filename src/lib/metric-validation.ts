/**
 * 成果記録のバリデーション
 */

import { METRIC_BOUNDS, type MetricType } from './constants'

// =============================================================================
// 型定義
// =============================================================================

export interface MetricValidationResult {
  valid: boolean
  flagged: boolean
  normalizedValue?: number
  message?: string
}

export interface MetricDisplayInfo {
  label: string
  icon: string
  color: string
  formatValue: (value: number, unit: string) => string
}

// =============================================================================
// バリデーション
// =============================================================================

/**
 * 成果値の妥当性をチェック
 */
export function validateMetricValue(
  type: string,
  value: number,
  unit: string
): MetricValidationResult {
  const bounds = METRIC_BOUNDS[type as MetricType]
  
  if (!bounds) {
    // 未知のタイプは警告付きで許可
    return {
      valid: true,
      flagged: true,
      normalizedValue: value,
      message: `未知の成果タイプ: ${type}`,
    }
  }

  // 範囲チェック
  if (value < bounds.min) {
    return {
      valid: false,
      flagged: false,
      message: `${bounds.label}は${bounds.min}${bounds.unit}以上で入力してください`,
    }
  }

  if (value > bounds.max) {
    return {
      valid: false,
      flagged: false,
      message: `${bounds.label}は${bounds.max}${bounds.unit}以下で入力してください`,
    }
  }

  // 上位10%の値は要確認フラグ（異常に高い値の可能性）
  const highThreshold = bounds.max * 0.9
  const isSuspiciouslyHigh = value > highThreshold

  // 単位の不一致チェック
  const expectedUnit = bounds.unit
  const unitMismatch = unit !== expectedUnit && unit !== 'other'

  return {
    valid: true,
    flagged: isSuspiciouslyHigh || unitMismatch,
    normalizedValue: value,
    message: isSuspiciouslyHigh
      ? `非常に高い値です。内容を確認してください。`
      : unitMismatch
        ? `推奨単位は「${expectedUnit}」です`
        : undefined,
  }
}

/**
 * 複数の成果記録の統計的異常検知
 */
export async function detectStatisticalAnomalies(
  promptId: string,
  newValue: number,
  metricType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any
): Promise<{ isAnomaly: boolean; zScore?: number; message?: string }> {
  // 既存の成果記録を取得
  const existingLogs = await prisma.resultLog.findMany({
    where: { promptId, metricType, isFlagged: false },
    select: { metricValue: true },
    take: 100,
    orderBy: { createdAt: 'desc' },
  })

  if (existingLogs.length < 5) {
    // データが少なすぎる場合は判定しない
    return { isAnomaly: false }
  }

  const values = existingLogs.map((log: { metricValue: number }) => log.metricValue)
  
  // 平均と標準偏差を計算
  const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length
  const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) {
    // 全て同じ値の場合
    return { isAnomaly: newValue !== mean }
  }

  // Z-score計算
  const zScore = (newValue - mean) / stdDev

  // |Z| > 3 は異常値とみなす（99.7%の範囲外）
  if (Math.abs(zScore) > 3) {
    return {
      isAnomaly: true,
      zScore: Math.round(zScore * 100) / 100,
      message: `この値は通常の範囲（平均: ${Math.round(mean)}）から大きく外れています`,
    }
  }

  return { isAnomaly: false, zScore: Math.round(zScore * 100) / 100 }
}

// =============================================================================
// 表示用ヘルパー
// =============================================================================

/**
 * 成果タイプの表示情報を取得
 */
export const METRIC_DISPLAY: Record<MetricType | string, MetricDisplayInfo> = {
  time_saved: {
    label: '時間節約',
    icon: '⏱️',
    color: '#22c55e',
    formatValue: (value: number, unit: string) => {
      if (unit === 'min') {
        if (value >= 60) {
          const hours = Math.floor(value / 60)
          const mins = value % 60
          return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`
        }
        return `${value}分`
      }
      return `${value}${unit}`
    },
  },
  revenue: {
    label: '収益増加',
    icon: '💰',
    color: '#fbbf24',
    formatValue: (value: number, unit: string) => {
      if (unit === 'JPY') return `¥${value.toLocaleString()}`
      if (unit === 'USD') return `$${value.toLocaleString()}`
      return `${value.toLocaleString()}${unit}`
    },
  },
  quality: {
    label: '品質向上',
    icon: '✨',
    color: '#8b5cf6',
    formatValue: (value: number, unit: string) => {
      if (unit === '%') return `${value}%`
      if (unit === 'score') return `${value}点`
      return `${value}${unit}`
    },
  },
  other: {
    label: 'その他',
    icon: '📊',
    color: '#6366f1',
    formatValue: (value: number, unit: string) => `${value}${unit}`,
  },
}

/**
 * 成果値をフォーマット
 */
export function formatMetricValue(
  type: string,
  value: number,
  unit: string
): string {
  const display = METRIC_DISPLAY[type] || METRIC_DISPLAY.other
  return display.formatValue(value, unit)
}

/**
 * 成果タイプのラベルを取得
 */
export function getMetricLabel(type: string): string {
  return METRIC_DISPLAY[type]?.label || type
}

/**
 * 成果タイプのアイコンを取得
 */
export function getMetricIcon(type: string): string {
  return METRIC_DISPLAY[type]?.icon || '📊'
}

/**
 * 成果タイプの色を取得
 */
export function getMetricColor(type: string): string {
  return METRIC_DISPLAY[type]?.color || '#6366f1'
}

// =============================================================================
// 集計ヘルパー
// =============================================================================

interface AggregatedMetric {
  type: string
  label: string
  icon: string
  color: string
  count: number
  total: number
  average: number
  unit: string
  formattedTotal: string
  formattedAverage: string
}

/**
 * 成果記録を集計
 */
export function aggregateMetrics(
  logs: Array<{ metricType: string; metricValue: number; metricUnit: string }>
): AggregatedMetric[] {
  const grouped: Record<string, { values: number[]; unit: string }> = {}

  for (const log of logs) {
    if (!grouped[log.metricType]) {
      grouped[log.metricType] = { values: [], unit: log.metricUnit }
    }
    grouped[log.metricType].values.push(log.metricValue)
  }

  return Object.entries(grouped).map(([type, data]) => {
    const total = data.values.reduce((a, b) => a + b, 0)
    const average = total / data.values.length

    return {
      type,
      label: getMetricLabel(type),
      icon: getMetricIcon(type),
      color: getMetricColor(type),
      count: data.values.length,
      total: Math.round(total * 10) / 10,
      average: Math.round(average * 10) / 10,
      unit: data.unit,
      formattedTotal: formatMetricValue(type, Math.round(total), data.unit),
      formattedAverage: formatMetricValue(type, Math.round(average * 10) / 10, data.unit),
    }
  })
}

