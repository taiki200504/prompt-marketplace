/**
 * Orynth.dev 連携クライアント
 * 
 * Orynthプラットフォームとの連携機能:
 * - プロジェクトアクティビティの投稿
 * - ウォレット連携
 * - マーケットキャップ・統計取得
 */

import { prisma } from './prisma'
import { ORYNTH_CONFIG } from './constants'

// =============================================================================
// 型定義
// =============================================================================

interface OrynthProjectStats {
  marketCap: number
  investorCount: number
  feesEarned: number
  trending: boolean
  rank?: number
}

interface OrynthWalletInfo {
  walletId: string
  balanceUSDC: number
  connected: boolean
}

interface OrynthActivityPayload {
  type: 'new_prompt' | 'milestone' | 'update' | 'sale'
  title: string
  description?: string
  link?: string
  imageUrl?: string
}

interface OrynthPaymentRequest {
  amount: number  // USDC
  recipientWalletId: string
  memo: string
}

// =============================================================================
// Orynth API クライアント
// =============================================================================

class OrynthClient {
  private baseUrl: string
  private apiKey: string
  private projectId: string
  private enabled: boolean

  constructor() {
    this.baseUrl = ORYNTH_CONFIG.apiBaseUrl
    this.apiKey = process.env.ORYNTH_API_KEY || ''
    this.projectId = ORYNTH_CONFIG.projectId
    this.enabled = ORYNTH_CONFIG.enabled
  }

  /**
   * API有効性チェック
   */
  isEnabled(): boolean {
    return this.enabled && !!this.apiKey && !!this.projectId
  }

  /**
   * 共通リクエストメソッド
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T | null> {
    if (!this.isEnabled()) {
      console.warn('Orynth integration is not enabled')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Project-Id': this.projectId,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`Orynth API error (${response.status}):`, error)
        return null
      }

      return await response.json() as T
    } catch (error) {
      console.error('Orynth API request failed:', error)
      return null
    }
  }

  // ===========================================================================
  // プロジェクト統計
  // ===========================================================================

  /**
   * プロジェクトの統計情報を取得
   */
  async getProjectStats(): Promise<OrynthProjectStats | null> {
    return this.request<OrynthProjectStats>(`/projects/${this.projectId}/stats`)
  }

  /**
   * トレンディングプロジェクト一覧を取得
   */
  async getTrendingProjects(): Promise<Array<{ id: string; name: string; marketCap: number }> | null> {
    return this.request('/trending')
  }

  // ===========================================================================
  // アクティビティ投稿
  // ===========================================================================

  /**
   * プロジェクトページにアクティビティを投稿
   */
  async postActivity(activity: OrynthActivityPayload): Promise<{ postId: string } | null> {
    // まずDBに記録
    const dbActivity = await prisma.orynthActivity.create({
      data: {
        type: activity.type,
        title: activity.title,
        description: activity.description,
        link: activity.link,
      },
    })

    // Orynth APIに投稿
    const result = await this.request<{ postId: string }>(
      `/projects/${this.projectId}/activities`,
      'POST',
      {
        type: activity.type,
        title: activity.title,
        description: activity.description,
        link: activity.link,
        imageUrl: activity.imageUrl,
      }
    )

    // 結果を記録
    if (result?.postId) {
      await prisma.orynthActivity.update({
        where: { id: dbActivity.id },
        data: {
          orynthPostId: result.postId,
          isPosted: true,
          postedAt: new Date(),
        },
      })
    }

    return result
  }

  /**
   * 新しいプロンプト公開を通知
   */
  async notifyNewPrompt(promptId: string, title: string, creatorUsername: string): Promise<void> {
    await this.postActivity({
      type: 'new_prompt',
      title: `🆕 新しいプロンプト「${title}」`,
      description: `@${creatorUsername}さんが新しいプロンプトを公開しました`,
      link: `/prompts/${promptId}`,
    })
  }

  /**
   * マイルストーン達成を通知
   */
  async notifyMilestone(milestone: string, details: string): Promise<void> {
    await this.postActivity({
      type: 'milestone',
      title: `🎉 ${milestone}`,
      description: details,
    })
  }

  /**
   * 売上通知
   */
  async notifySale(promptTitle: string, price: number): Promise<void> {
    await this.postActivity({
      type: 'sale',
      title: `💰 プロンプトが購入されました`,
      description: `「${promptTitle}」が¥${price.toLocaleString()}で購入されました`,
    })
  }

  // ===========================================================================
  // ウォレット連携
  // ===========================================================================

  /**
   * ユーザーのOrynthウォレット情報を取得
   */
  async getWalletInfo(orynthWalletId: string): Promise<OrynthWalletInfo | null> {
    return this.request<OrynthWalletInfo>(`/wallets/${orynthWalletId}`)
  }

  /**
   * Orynthウォレットを連携
   */
  async linkWallet(userId: string, orynthWalletId: string): Promise<boolean> {
    // ウォレット情報を確認
    const walletInfo = await this.getWalletInfo(orynthWalletId)
    if (!walletInfo) {
      return false
    }

    // DBに連携情報を保存
    await prisma.wallet.upsert({
      where: { userId },
      update: {
        orynthWalletId,
        orynthConnected: true,
      },
      create: {
        userId,
        orynthWalletId,
        orynthConnected: true,
      },
    })

    return true
  }

  /**
   * Orynthウォレットへの送金（USDCでの収益受取）
   */
  async sendPayment(request: OrynthPaymentRequest): Promise<{ txId: string } | null> {
    return this.request<{ txId: string }>(
      '/payments',
      'POST',
      {
        amount: request.amount,
        recipientWalletId: request.recipientWalletId,
        memo: request.memo,
        currency: 'USDC',
      }
    )
  }

  // ===========================================================================
  // 認証連携
  // ===========================================================================

  /**
   * Orynthアカウントでのログイン検証
   */
  async verifyOrynthAuth(authToken: string): Promise<{
    valid: boolean
    userId?: string
    username?: string
    walletId?: string
  } | null> {
    return this.request('/auth/verify', 'POST', { token: authToken })
  }
}

// シングルトンインスタンス
export const orynthClient = new OrynthClient()

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * JPY から USDC への変換（概算レート）
 * 実際の実装では為替APIを使用すべき
 */
export function jpyToUsdc(jpyAmount: number): number {
  const JPY_TO_USD_RATE = 0.0067  // 1 JPY = 0.0067 USD (概算)
  return Math.round(jpyAmount * JPY_TO_USD_RATE * 100) / 100
}

/**
 * USDC から JPY への変換（概算レート）
 */
export function usdcToJpy(usdcAmount: number): number {
  const USD_TO_JPY_RATE = 150  // 1 USD = 150 JPY (概算)
  return Math.round(usdcAmount * USD_TO_JPY_RATE)
}

// =============================================================================
// 自動通知トリガー
// =============================================================================

/**
 * プロンプト公開時に自動通知
 */
export async function triggerPromptPublishedNotification(
  promptId: string,
  title: string,
  creatorUsername: string
): Promise<void> {
  if (!orynthClient.isEnabled()) return

  try {
    await orynthClient.notifyNewPrompt(promptId, title, creatorUsername)
  } catch (error) {
    console.error('Failed to notify Orynth about new prompt:', error)
    // 通知失敗はユーザーに影響させない
  }
}

/**
 * マイルストーンチェック（定期実行用）
 */
export async function checkAndNotifyMilestones(): Promise<void> {
  if (!orynthClient.isEnabled()) return

  try {
    // 総プロンプト数
    const promptCount = await prisma.prompt.count({ where: { isPublished: true } })
    const milestones = [10, 50, 100, 500, 1000]
    
    for (const milestone of milestones) {
      if (promptCount === milestone) {
        await orynthClient.notifyMilestone(
          `${milestone}プロンプト達成！`,
          `プラットフォームに${milestone}個のプロンプトが公開されました 🎊`
        )
        break
      }
    }

    // 総売上チェック
    const totalSales = await prisma.purchase.aggregate({
      where: { status: 'completed' },
      _sum: { priceAtPurchase: true },
    })
    
    const salesAmount = totalSales._sum.priceAtPurchase || 0
    const salesMilestones = [10000, 50000, 100000, 500000, 1000000]
    
    for (const milestone of salesMilestones) {
      // 前日比で初めて超えた場合のみ通知（実装簡略化）
      if (salesAmount >= milestone && salesAmount < milestone * 1.1) {
        await orynthClient.notifyMilestone(
          `売上¥${milestone.toLocaleString()}達成！`,
          `クリエイターへの総還元額が¥${Math.round(milestone * 0.8).toLocaleString()}を超えました`
        )
        break
      }
    }
  } catch (error) {
    console.error('Failed to check milestones:', error)
  }
}

