import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Geminiは遅延初期化
function getGemini() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

// POST /api/prompts/[id]/improve - AIによるプロンプト改善提案
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    if (!user || user.credits < 50) {
      return NextResponse.json(
        { error: 'クレジットが不足しています（50クレジット必要）' },
        { status: 402 }
      )
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        reviews: {
          select: { rating: true, comment: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        resultLogs: {
          select: { metricType: true, metricValue: true, note: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // オーナーまたは購入者のみ
    const isOwner = prompt.ownerId === session.user.id
    const hasPurchased = await prisma.purchase.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId: id,
        },
      },
    })

    if (!isOwner && !hasPurchased && prompt.priceJPY > 0) {
      return NextResponse.json(
        { error: '改善提案を取得する権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { focusArea } = body // 'clarity' | 'effectiveness' | 'specificity' | 'general'

    // レビューコメントを分析用に整形
    const reviewSummary = prompt.reviews
      .filter((r) => r.comment)
      .map((r) => `- 評価${r.rating}/5: ${r.comment}`)
      .join('\n')

    // 成果ログを分析用に整形
    const resultSummary = prompt.resultLogs
      .filter((r) => r.note)
      .map((r) => `- ${r.metricType}: ${r.metricValue} (${r.note})`)
      .join('\n')

    const focusInstructions = {
      clarity: '明確さと理解しやすさを重点的に改善してください。曖昧な表現を具体的にし、構造を明確にしてください。',
      effectiveness: '効果と成果を最大化するための改善を提案してください。より良い結果を得るためのテクニックを含めてください。',
      specificity: '具体性を高める改善を提案してください。詳細な指示や制約を追加し、出力の品質を向上させてください。',
      general: '全体的なバランスを考慮して改善を提案してください。',
    }

    const systemPrompt = `あなたはAIプロンプトエンジニアリングの専門家です。
与えられたプロンプトを分析し、改善提案を行ってください。

改善提案は以下のJSON形式で出力してください：
{
  "analysis": {
    "strengths": ["強み1", "強み2"],
    "weaknesses": ["弱点1", "弱点2"],
    "opportunities": ["改善機会1", "改善機会2"]
  },
  "suggestions": [
    {
      "category": "カテゴリ名",
      "title": "改善タイトル",
      "description": "具体的な説明",
      "priority": "high" | "medium" | "low",
      "example": "改善例（該当する場合）"
    }
  ],
  "improvedPrompt": "改善後のプロンプト全文",
  "expectedImprovements": ["期待される効果1", "期待される効果2"]
}

必ず有効なJSON形式のみを出力してください。コードブロックやマークダウン記法は使用しないでください。`

    const userPrompt = `## 対象プロンプト

タイトル: ${prompt.title}
カテゴリ: ${prompt.category}
説明: ${prompt.shortDescription}

### プロンプト本文
${prompt.promptBody}

### 使用ガイド
${prompt.usageGuide || 'なし'}

### 入力例
${prompt.exampleInput}

### 出力例
${prompt.exampleOutput}

## ユーザーフィードバック
${reviewSummary || 'レビューなし'}

## 成果ログ
${resultSummary || '成果記録なし'}

## 改善フォーカス
${focusInstructions[focusArea as keyof typeof focusInstructions] || focusInstructions.general}

上記のプロンプトを分析し、具体的な改善提案をJSON形式で出力してください。`

    const genAI = getGemini()
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ])

    const response = result.response
    const responseText = response.text()

    // トークン使用量を取得（Gemini APIでは usageMetadata で取得可能）
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0

    // クレジットを消費
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: 50 } },
      }),
      prisma.creditHistory.create({
        data: {
          userId: session.user.id,
          amount: -50,
          type: 'execution',
          description: `AI改善提案: ${prompt.title}`,
        },
      }),
    ])

    let suggestions
    try {
      suggestions = JSON.parse(responseText || '{}')
    } catch {
      suggestions = { error: 'AI応答のパースに失敗しました', raw: responseText }
    }

    return NextResponse.json({
      suggestions,
      tokensUsed,
      creditsUsed: 50,
    })
  } catch (error) {
    console.error('Error generating improvements:', error)
    return NextResponse.json(
      { error: 'AI改善提案の生成に失敗しました' },
      { status: 500 }
    )
  }
}
