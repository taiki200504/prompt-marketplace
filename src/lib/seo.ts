/**
 * SEOユーティリティ
 * メタタグ、OGP、構造化データの生成
 */

export interface SEOData {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  siteName?: string
}

const DEFAULT_SITE_NAME = 'PromptMarket'
const DEFAULT_DESCRIPTION = '高品質なAIプロンプトを売買・共有できるプレミアムマーケットプレイス'

/**
 * メタタグを生成
 */
export function generateMetadata(data: SEOData) {
  const title = data.title
    ? `${data.title} | ${DEFAULT_SITE_NAME}`
    : DEFAULT_SITE_NAME
  const description = data.description || DEFAULT_DESCRIPTION
  const image = data.image || '/og-image.png'
  const url = data.url || 'https://prompt-marketplace.vercel.app'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: data.siteName || DEFAULT_SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ja_JP',
      type: data.type || 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

/**
 * 構造化データ（JSON-LD）を生成
 */
export function generateStructuredData(data: {
  type: 'WebSite' | 'Article' | 'Product'
  title: string
  description: string
  url?: string
  image?: string
  author?: string
  datePublished?: string
  price?: number
  currency?: string
}) {
  const base = {
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.title,
    description: data.description,
    ...(data.url && { url: data.url }),
    ...(data.image && {
      image: {
        '@type': 'ImageObject',
        url: data.image,
      },
    }),
  }

  if (data.type === 'Article') {
    return {
      ...base,
      ...(data.author && {
        author: {
          '@type': 'Person',
          name: data.author,
        },
      }),
      ...(data.datePublished && { datePublished: data.datePublished }),
    }
  }

  if (data.type === 'Product') {
    return {
      ...base,
      '@type': 'Product',
      ...(data.price && {
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: data.currency || 'JPY',
        },
      }),
    }
  }

  return base
}

/**
 * サイトマップ用のURLを生成
 */
export function generateSitemapUrl(
  url: string,
  lastmod?: string,
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'weekly',
  priority: number = 0.5
) {
  return {
    url,
    lastmod,
    changefreq,
    priority,
  }
}
