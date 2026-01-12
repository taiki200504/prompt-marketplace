/**
 * エラーハンドリングユーティリティ
 * 統一されたエラーレスポンス形式とエラーメッセージを提供
 */

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    }
  }
}

// エラーコード定義
export const ErrorCodes = {
  // 認証エラー
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // バリデーションエラー
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // リソースエラー
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // ビジネスロジックエラー
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PURCHASE_FAILED: 'PURCHASE_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // システムエラー
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // レート制限
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const

// ユーザーフレンドリーなエラーメッセージ
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: 'ログインが必要です',
  [ErrorCodes.FORBIDDEN]: 'この操作を実行する権限がありません',
  [ErrorCodes.SESSION_EXPIRED]: 'セッションが期限切れです。再度ログインしてください',
  
  [ErrorCodes.VALIDATION_ERROR]: '入力内容に誤りがあります',
  [ErrorCodes.INVALID_INPUT]: '無効な入力です',
  
  [ErrorCodes.NOT_FOUND]: 'リソースが見つかりません',
  [ErrorCodes.ALREADY_EXISTS]: '既に存在します',
  [ErrorCodes.CONFLICT]: '競合が発生しました',
  
  [ErrorCodes.INSUFFICIENT_CREDITS]: 'クレジットが不足しています',
  [ErrorCodes.PURCHASE_FAILED]: '購入に失敗しました',
  [ErrorCodes.PAYMENT_FAILED]: '決済に失敗しました',
  
  [ErrorCodes.INTERNAL_ERROR]: 'サーバーエラーが発生しました',
  [ErrorCodes.DATABASE_ERROR]: 'データベースエラーが発生しました',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: '外部サービスとの通信に失敗しました',
  
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'リクエストが多すぎます。しばらく待ってから再度お試しください',
}

/**
 * エラーからユーザーフレンドリーなメッセージを取得
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return ErrorMessages[error.code] || error.message
  }
  
  if (error instanceof Error) {
    // 既知のエラーメッセージをチェック
    for (const [code, message] of Object.entries(ErrorMessages)) {
      if (error.message.includes(code) || error.message.includes(message)) {
        return message
      }
    }
    return error.message
  }
  
  return '予期しないエラーが発生しました'
}

/**
 * エラーログを構造化して記録
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  }
  
  // 本番環境では構造化ログとして出力
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorInfo))
  } else {
    console.error('Error:', errorInfo)
  }
  
  // TODO: Sentry等のエラートラッキングサービスに送信
}

/**
 * APIエラーレスポンスを作成
 */
export function createErrorResponse(
  error: unknown,
  defaultStatusCode: number = 500
): { error: ApiError; statusCode: number } {
  if (error instanceof AppError) {
    return {
      error: error.toJSON(),
      statusCode: error.statusCode,
    }
  }
  
  const message = getUserFriendlyMessage(error)
  const code = error instanceof Error && error.name ? error.name : ErrorCodes.INTERNAL_ERROR
  
  return {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
    statusCode: defaultStatusCode,
  }
}
