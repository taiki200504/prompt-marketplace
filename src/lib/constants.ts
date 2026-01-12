// =============================================================================
// ビジネスロジック定数
// =============================================================================

// プラットフォーム手数料率 (20%)
export const PLATFORM_FEE_RATE = 0.20

// クリエイター還元率 (80%)
export const CREATOR_REVENUE_RATE = 0.80

// =============================================================================
// API実行制限
// =============================================================================

// 無料ユーザーの1日あたりの実行回数上限
export const FREE_DAILY_EXECUTION_LIMIT = 3

// 購入済みプロンプトの1日あたりの実行回数上限
export const PURCHASED_DAILY_EXECUTION_LIMIT = 50

// 月間APIコスト上限 (USD)
export const MONTHLY_API_COST_LIMIT_USD = 500

// =============================================================================
// モデル別コスト (USD per 1M tokens)
// =============================================================================

export const MODEL_COSTS = {
  'gpt-4o': {
    input: 2.50,
    output: 10.00,
    creditsPerExecution: 50,
  },
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.60,
    creditsPerExecution: 10,
  },
  'gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
    creditsPerExecution: 5,
  },
} as const

export type SupportedModel = keyof typeof MODEL_COSTS

export const DEFAULT_MODEL: SupportedModel = 'gpt-4o-mini'

// =============================================================================
// 出金設定
// =============================================================================

export const PAYOUT_CONFIG = {
  minimumAmount: 1000,        // 最低出金額: 1,000円
  bankTransferFee: 250,       // 振込手数料: 250円
  processingDays: 5,          // 処理日数: 5営業日
  refundPeriodDays: 7,        // 返金可能期間: 7日
} as const

// =============================================================================
// リファラル設定
// =============================================================================

export const REFERRAL_CONFIG = {
  baseReward: 500,                    // 基本報酬: 500円
  requiredPurchases: 1,               // 報酬条件: 1件の購入完了
  codeLength: 8,                      // 紹介コードの長さ
  
  // ティア制報酬
  tiers: [
    { minReferrals: 1, rewardPerReferral: 500, title: 'スターター' },
    { minReferrals: 5, rewardPerReferral: 600, title: 'アンバサダー' },
    { minReferrals: 20, rewardPerReferral: 800, title: 'インフルエンサー' },
    { minReferrals: 50, rewardPerReferral: 1000, title: 'レジェンド' },
  ],
  
  // 継続的な収益シェア率
  ongoingRevenueShare: 0.05,          // 紹介者の売上の5%
} as const

// =============================================================================
// 成果記録の妥当性チェック
// =============================================================================

export const METRIC_BOUNDS = {
  time_saved: { min: 1, max: 480, unit: 'min', label: '時間節約' },
  revenue: { min: 100, max: 10000000, unit: 'JPY', label: '収益増加' },
  quality: { min: 1, max: 100, unit: '%', label: '品質向上' },
  other: { min: 0, max: 1000000, unit: 'other', label: 'その他' },
} as const

export type MetricType = keyof typeof METRIC_BOUNDS

// =============================================================================
// カテゴリ
// =============================================================================

export const CATEGORIES = [
  'Marketing',
  'Dev',
  'Design',
  'Career',
  'Study',
  'Fun',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

// =============================================================================
// Orynth連携
// =============================================================================

export const ORYNTH_CONFIG = {
  apiBaseUrl: 'https://api.orynth.dev/v1',
  projectId: process.env.ORYNTH_PROJECT_ID || '',
  enabled: !!process.env.ORYNTH_API_KEY,
} as const

