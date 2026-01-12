import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  username: z
    .string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(20, 'ユーザー名は20文字以下で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'),
  password: z
    .string()
    .min(6, 'パスワードは6文字以上で入力してください'),
  displayName: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

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

export const promptSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100, 'タイトルは100文字以下で入力してください'),
  shortDescription: z
    .string()
    .min(1, '概要は必須です')
    .max(200, '概要は200文字以下で入力してください'),
  category: z.enum(CATEGORIES, { message: 'カテゴリを選択してください' }),
  promptBody: z.string().min(1, 'プロンプト本文は必須です'),
  usageGuide: z.string().optional(),
  exampleInput: z.string().min(1, '入力例は必須です'),
  exampleOutput: z.string().min(1, '出力例は必須です'),
  priceJPY: z.number().min(0, '価格は0以上で入力してください'),
  tags: z.string().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional(),
})

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export const METRIC_TYPES = [
  'time_saved',
  'revenue',
  'quality',
  'other',
] as const

export const METRIC_UNITS = [
  'min',
  'JPY',
  '%',
  'score',
  'other',
] as const

export const resultLogSchema = z.object({
  metricType: z.enum(METRIC_TYPES),
  metricValue: z.number().positive('値は正の数で入力してください'),
  metricUnit: z.enum(METRIC_UNITS),
  note: z.string().max(500, 'メモは500文字以下で入力してください').optional(),
})

// プロンプト実行リクエスト
export const executePromptSchema = z.object({
  variables: z.record(z.string(), z.string().max(5000, '変数の値は5000文字以下で入力してください')),
  model: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']).optional(),
  stream: z.boolean().optional(),
})

// 出金リクエスト
export const payoutRequestSchema = z.object({
  amount: z.number().min(1000, '最低1000円から出金可能です'),
  bankName: z.string().min(1, '銀行名を入力してください').max(50),
  branchName: z.string().min(1, '支店名を入力してください').max(50),
  accountType: z.enum(['普通', '当座']),
  accountNumber: z.string().regex(/^\d{7}$/, '口座番号は7桁の数字で入力してください'),
  accountHolder: z.string().min(1, '口座名義を入力してください').max(50),
})

// ユーザープロフィール更新
export const updateProfileSchema = z.object({
  displayName: z.string().max(50, '表示名は50文字以下で入力してください').optional(),
  bio: z.string().max(500, '自己紹介は500文字以下で入力してください').optional(),
  avatarUrl: z.string().url('有効なURLを入力してください').optional(),
})

// 紹介コード
export const referralCodeSchema = z.string()
  .length(8, '紹介コードは8文字です')
  .regex(/^[A-Z0-9]+$/, '紹介コードは英大文字と数字のみです')

