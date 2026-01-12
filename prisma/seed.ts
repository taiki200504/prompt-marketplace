import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.resultLog.deleteMany()
  await prisma.review.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.creditHistory.deleteMany()
  await prisma.prompt.deleteMany()
  await prisma.user.deleteMany()

  console.log('✓ Cleared existing data')

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12)

  const user1 = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      username: 'demo_creator',
      passwordHash,
      displayName: 'デモクリエイター',
      bio: 'AIプロンプトクリエイター。マーケティングと開発効率化が専門。',
      credits: 5000,
      creditHistory: {
        create: {
          amount: 5000,
          type: 'bonus',
          description: '新規登録ボーナス',
        },
      },
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'dev@example.com',
      username: 'dev_master',
      passwordHash,
      displayName: '開発マスター',
      bio: 'フルスタックエンジニア。コード生成・最適化プロンプトを作成。',
      credits: 3000,
      creditHistory: {
        create: {
          amount: 3000,
          type: 'bonus',
          description: '新規登録ボーナス',
        },
      },
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'buyer@example.com',
      username: 'prompt_buyer',
      passwordHash,
      displayName: 'プロンプトバイヤー',
      bio: 'AIを活用して業務効率化を目指すマーケター。',
      credits: 2000,
      creditHistory: {
        create: {
          amount: 2000,
          type: 'bonus',
          description: '新規登録ボーナス',
        },
      },
    },
  })

  console.log('✓ Created users')

  // Create prompts
  const prompts = await Promise.all([
    prisma.prompt.create({
      data: {
        ownerId: user1.id,
        title: 'SEO最適化ブログ記事生成',
        shortDescription: 'SEOに強い構造化されたブログ記事を自動生成。見出し、メタディスクリプション付き。',
        category: 'Marketing',
        promptBody: `あなたはSEOに精通したプロのコンテンツライターです。

以下のトピックについて、検索エンジンに最適化された高品質なブログ記事を生成してください。

## 要件
- 読者の検索意図を深く理解し、それに応える内容
- 魅力的なタイトルとメタディスクリプション
- 適切な見出し（H2, H3）で構造化
- キーワードを自然に含め、SEO効果を最大化
- 記事の最後に行動喚起（CTA）を含める

## トピック
{input}`,
        usageGuide: '1. {input}にブログのトピックを入力\n2. 生成された記事をそのまま、または編集して使用\n3. 画像の挿入位置も提案されます',
        exampleInput: 'AIを活用した業務効率化の方法',
        exampleOutput: '# AIを活用した業務効率化｜今すぐ始められる5つの方法\n\n【メタディスクリプション】\nAIを活用した業務効率化の具体的な方法を5つ紹介。自動化ツールの選び方から導入手順まで...',
        priceJPY: 500,
        tags: 'SEO,ブログ,コンテンツ,マーケティング',
        isPublished: true,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        views: 342,
      },
    }),
    prisma.prompt.create({
      data: {
        ownerId: user1.id,
        title: 'Twitter/Xバイラル投稿生成',
        shortDescription: 'エンゲージメントを最大化するTwitter/X投稿を生成。バズる構造で作成。',
        category: 'Marketing',
        promptBody: `あなたはTwitter/Xのバイラルコンテンツ作成の専門家です。

以下のテーマについて、エンゲージメントを最大化し、リツイートやいいねを誘発する投稿を生成してください。

## 投稿の要素
- 読者の目を引くフック
- 簡潔で分かりやすいメッセージ
- 感情を揺さぶる要素
- 行動喚起（リツイート、コメントなど）
- 絵文字の効果的な活用

## テーマ
{input}`,
        usageGuide: '{input}に投稿のテーマを入力してください',
        exampleInput: 'AIツールの最新トレンド',
        exampleOutput: '🔥 AIツールの最新トレンドがヤバい！\n\n最近の進化が速すぎてついていけない人も多いはず。\n\n✅ 画像生成AIのリアルさ\n✅ 自然言語処理の精度向上\n✅ 自動コード生成の衝撃\n\nどのAIツールに注目してる？コメントで教えて👇',
        priceJPY: 300,
        tags: 'Twitter,SNS,マーケティング,バイラル',
        isPublished: true,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        views: 567,
      },
    }),
    prisma.prompt.create({
      data: {
        ownerId: user2.id,
        title: 'TypeScript型定義自動生成',
        shortDescription: 'JSONやAPIレスポンスからTypeScriptの型定義を自動生成。複雑なネスト構造にも対応。',
        category: 'Dev',
        promptBody: `あなたはTypeScriptの型定義の専門家です。

以下のJSONデータまたはAPIレスポンスの例から、最適なTypeScriptの型定義を生成してください。

## 要件
- 可能な限り厳密な型定義
- ネストされたオブジェクトや配列にも対応
- 必要に応じてUnion型やLiteral型も活用
- コメントで各プロパティの説明を追加

## JSONデータ/APIレスポンス例
{input}`,
        usageGuide: '{input}にJSONデータを貼り付けてください',
        exampleInput: '{"id": "123", "name": "John", "orders": [{"orderId": "A001", "amount": 100}]}',
        exampleOutput: 'interface User {\n  id: string;\n  name: string;\n  orders: Array<{\n    orderId: string;\n    amount: number;\n  }>;\n}',
        priceJPY: 0,
        tags: 'TypeScript,開発,型定義,JSON',
        isPublished: true,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        views: 1234,
      },
    }),
    prisma.prompt.create({
      data: {
        ownerId: user2.id,
        title: 'React コンポーネント設計アシスタント',
        shortDescription: 'コンポーネントの仕様からベストプラクティスに沿ったReactコードを生成。',
        category: 'Dev',
        promptBody: `あなたはReactの専門家です。

以下のコンポーネントの仕様に基づいて、TypeScriptとTailwind CSSを使用したReactコンポーネントのコードを生成してください。

## 要件
- 関数コンポーネントとして実装
- propsの型定義を適切に行う
- Tailwind CSSでスタイリング
- 必要に応じてuseState/useEffectも使用
- コメントでコードの説明を追加

## コンポーネント仕様
{input}`,
        usageGuide: 'コンポーネントの要件を詳細に記述してください',
        exampleInput: 'ボタンコンポーネント。\nprops: text, onClick, variant (primary | secondary)',
        exampleOutput: 'const Button: React.FC<ButtonProps> = ({ text, onClick, variant = "primary" }) => {\n  const variantStyle = variant === "primary" ? "bg-blue-600" : "bg-gray-200";\n  return <button onClick={onClick}>{text}</button>;\n}',
        priceJPY: 800,
        tags: 'React,TypeScript,TailwindCSS,開発',
        isPublished: true,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        views: 456,
      },
    }),
    prisma.prompt.create({
      data: {
        ownerId: user1.id,
        title: 'キャリア相談・自己分析プロンプト',
        shortDescription: '転職や昇進を考えている方向け。強み・弱みを分析し、キャリアプランを提案。',
        category: 'Career',
        promptBody: `あなたはキャリアコンサルタントの専門家です。

以下の情報に基づいて、ユーザーの強み・弱みを分析し、具体的なキャリアプランやアドバイスを提案してください。

## 分析項目
- 現在の職務内容
- 経験年数
- 達成したこと
- 課題と感じていること
- 将来の目標
- 興味のある分野

## ユーザー情報
{input}`,
        usageGuide: '自身のキャリア情報を詳しく入力してください',
        exampleInput: '現在：Webエンジニア3年目、フロントエンド中心\n目標：フルスタックかテックリード',
        exampleOutput: '## キャリア分析\n\n### 強み\n- フロントエンド開発経験\n- 成長意欲の高さ\n\n### 推奨アクション\n1. バックエンド技術の習得\n2. マネジメント研修への参加',
        priceJPY: 400,
        tags: 'キャリア,自己分析,転職',
        isPublished: true,
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        views: 234,
      },
    }),
    prisma.prompt.create({
      data: {
        ownerId: user1.id,
        title: '英語学習：シャドーイング台本生成',
        shortDescription: 'レベルに合わせた英語シャドーイング用の台本を生成。解説・和訳付き。',
        category: 'Study',
        promptBody: `あなたは英語学習の専門家です。

以下のテーマとレベルに基づいて、シャドーイングに最適な英語の台本を生成してください。

## 要件
- 自然な会話、または短いスピーチ形式
- 適切な長さ（約1〜2分程度）
- 難しい単語やフレーズには解説と和訳
- 発音のポイントも簡単に示す

## テーマとレベル
{input}`,
        usageGuide: 'テーマとレベル（初級/中級/上級）を入力してください',
        exampleInput: 'テーマ: 旅行の計画\nレベル: 中級',
        exampleOutput: '## シャドーイング台本：旅行の計画\n\nE: Hey Tom, what are you doing this summer?\n   (ねえトム、今年の夏は何するの？)\n\n**発音ポイント**: "doing" の ng は鼻音',
        priceJPY: 0,
        tags: '英語学習,シャドーイング,語学',
        isPublished: true,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        views: 789,
      },
    }),
  ])

  console.log('✓ Created prompts')

  // Create purchases
  const purchase1 = await prisma.purchase.create({
    data: {
      userId: user3.id,
      promptId: prompts[0].id,
      priceAtPurchase: prompts[0].priceJPY,
    },
  })

  const purchase2 = await prisma.purchase.create({
    data: {
      userId: user3.id,
      promptId: prompts[1].id,
      priceAtPurchase: prompts[1].priceJPY,
    },
  })

  await prisma.purchase.create({
    data: {
      userId: user3.id,
      promptId: prompts[3].id,
      priceAtPurchase: prompts[3].priceJPY,
    },
  })

  // Add credit history for purchases
  await prisma.creditHistory.createMany({
    data: [
      { userId: user3.id, amount: -500, type: 'purchase', description: '「SEO最適化ブログ記事生成」を購入' },
      { userId: user3.id, amount: -300, type: 'purchase', description: '「Twitter/Xバイラル投稿生成」を購入' },
      { userId: user3.id, amount: -800, type: 'purchase', description: '「React コンポーネント設計アシスタント」を購入' },
      { userId: user1.id, amount: 400, type: 'sale', description: '「SEO最適化ブログ記事生成」が売れました' },
      { userId: user1.id, amount: 240, type: 'sale', description: '「Twitter/Xバイラル投稿生成」が売れました' },
      { userId: user2.id, amount: 640, type: 'sale', description: '「React コンポーネント設計アシスタント」が売れました' },
    ],
  })

  console.log('✓ Created purchases')

  // Create reviews
  await prisma.review.createMany({
    data: [
      {
        userId: user3.id,
        promptId: prompts[0].id,
        rating: 5,
        comment: 'SEOに最適化された記事が簡単に作れます！構造もしっかりしていて、そのまま使えるクオリティです。',
      },
      {
        userId: user3.id,
        promptId: prompts[1].id,
        rating: 4,
        comment: 'Twitterの投稿作成が劇的に楽になりました。エンゲージメントも上がって満足です。',
      },
      {
        userId: user3.id,
        promptId: prompts[3].id,
        rating: 5,
        comment: 'Reactコンポーネントの設計が苦手でしたが、このプロンプトのおかげでベストプラクティスに沿ったコードが書けるようになりました。',
      },
    ],
  })

  console.log('✓ Created reviews')

  // Create result logs
  await prisma.resultLog.createMany({
    data: [
      {
        userId: user3.id,
        promptId: prompts[0].id,
        metricType: 'time_saved',
        metricValue: 45,
        metricUnit: 'min',
        note: '記事作成時間が45分短縮されました',
      },
      {
        userId: user3.id,
        promptId: prompts[0].id,
        metricType: 'quality',
        metricValue: 30,
        metricUnit: '%',
        note: 'SEOスコアが30%向上',
      },
      {
        userId: user3.id,
        promptId: prompts[1].id,
        metricType: 'revenue',
        metricValue: 15000,
        metricUnit: 'JPY',
        note: 'フォロワー増加による広告収益アップ',
      },
    ],
  })

  console.log('✓ Created result logs')

  // Create favorites
  await prisma.favorite.createMany({
    data: [
      { userId: user3.id, promptId: prompts[2].id },
      { userId: user3.id, promptId: prompts[4].id },
    ],
  })

  console.log('✓ Created favorites')

  console.log('\n✨ Database seeded successfully!')
  console.log('\n📝 Demo accounts:')
  console.log('   demo@example.com / password123 (Creator)')
  console.log('   dev@example.com / password123 (Developer)')
  console.log('   buyer@example.com / password123 (Buyer)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
