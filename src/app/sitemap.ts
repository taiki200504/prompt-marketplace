import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://prompt-marketplace.vercel.app'

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/prompts`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  try {
    // 公開されているプロンプトを取得
    const prompts = await prisma.prompt.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000, // 最大1000件
    })

    // プロンプト詳細ページ
    const promptPages: MetadataRoute.Sitemap = prompts.map((prompt) => ({
      url: `${baseUrl}/prompts/${prompt.id}`,
      lastModified: prompt.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    // ユーザープロフィールページ（公開されているユーザーのみ）
    const users = await prisma.user.findMany({
      where: {
        prompts: {
          some: {
            isPublished: true,
          },
        },
      },
      select: {
        username: true,
        updatedAt: true,
      },
      take: 500, // 最大500件
    })

    const profilePages: MetadataRoute.Sitemap = users.map((user) => ({
      url: `${baseUrl}/profile/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticPages, ...promptPages, ...profilePages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // エラーが発生した場合は静的ページのみ返す
    return staticPages
  }
}
