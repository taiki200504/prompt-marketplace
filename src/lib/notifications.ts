import { prisma } from './prisma'

export type NotificationType = 
  | 'purchase'      // プロンプトを購入した（買い手向け）
  | 'sale'          // プロンプトが売れた（売り手向け）
  | 'review'        // レビューがついた（売り手向け）
  | 'result_log'    // 成果が記録された（売り手向け）
  | 'refund'        // 返金された
  | 'achievement'   // 実績解除
  | 'system'        // システム通知

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
}

/**
 * 通知を作成
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, link, metadata } = params

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

/**
 * プロンプト購入時の通知を作成
 */
export async function notifyPurchase(
  buyerId: string,
  sellerId: string,
  promptId: string,
  promptTitle: string,
  price: number
) {
  // 購入者への通知
  await createNotification({
    userId: buyerId,
    type: 'purchase',
    title: 'プロンプトを購入しました',
    message: `「${promptTitle}」を購入しました。`,
    link: `/prompts/${promptId}`,
    metadata: { promptId, price },
  })

  // 販売者への通知
  const sellerAmount = Math.round(price * 0.8) // 80%還元
  await createNotification({
    userId: sellerId,
    type: 'sale',
    title: 'プロンプトが売れました！ 🎉',
    message: `「${promptTitle}」が売れました。+${sellerAmount}クレジット`,
    link: `/prompts/${promptId}`,
    metadata: { promptId, price, amount: sellerAmount },
  })
}

/**
 * レビュー投稿時の通知を作成
 */
export async function notifyReview(
  sellerId: string,
  reviewerUsername: string,
  promptId: string,
  promptTitle: string,
  rating: number
) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  
  await createNotification({
    userId: sellerId,
    type: 'review',
    title: '新しいレビューがつきました',
    message: `@${reviewerUsername}さんが「${promptTitle}」に${stars}の評価をつけました。`,
    link: `/prompts/${promptId}`,
    metadata: { promptId, rating, reviewerUsername },
  })
}

/**
 * 成果記録時の通知を作成
 */
export async function notifyResultLog(
  sellerId: string,
  loggerUsername: string,
  promptId: string,
  promptTitle: string,
  metricType: string,
  metricValue: number,
  metricUnit: string
) {
  const metricLabels: Record<string, string> = {
    time_saved: '時間短縮',
    revenue: '収益',
    quality: '品質向上',
    other: 'その他',
  }
  
  await createNotification({
    userId: sellerId,
    type: 'result_log',
    title: '成果が報告されました 📊',
    message: `@${loggerUsername}さんが「${promptTitle}」で${metricLabels[metricType] || metricType}: ${metricValue}${metricUnit}を達成しました。`,
    link: `/prompts/${promptId}`,
    metadata: { promptId, metricType, metricValue, metricUnit },
  })
}

/**
 * 実績解除の通知を作成
 */
export async function notifyAchievement(
  userId: string,
  achievementTitle: string,
  achievementMessage: string
) {
  await createNotification({
    userId,
    type: 'achievement',
    title: `🏆 ${achievementTitle}`,
    message: achievementMessage,
  })
}

/**
 * システム通知を作成
 */
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  await createNotification({
    userId,
    type: 'system',
    title,
    message,
    link,
  })
}
