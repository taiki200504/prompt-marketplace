import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  checkInputSecurity,
  buildFinalPrompt,
  createSafeSystemMessage,
  extractVariables,
} from '@/lib/prompt-security'
import {
  checkCostLimit,
  calculateCostUSD,
  logApiUsage,
  getUserDailyQuota,
  incrementUserQuota,
  getExecutionCost,
} from '@/lib/api-cost'
import {
  FREE_DAILY_EXECUTION_LIMIT,
  PURCHASED_DAILY_EXECUTION_LIMIT,
  MODEL_COSTS,
  type SupportedModel,
} from '@/lib/constants'

// OpenAI API (環境変数でAPIキーを設定)
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface ExecuteRequest {
  variables: Record<string, string>
  model?: SupportedModel
  stream?: boolean
}

// =============================================================================
// POST: プロンプト実行
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id: promptId } = await params

  try {
    // 1. 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const userId = session.user.id

    // 2. リクエストパース
    const body = await request.json() as ExecuteRequest
    const { variables = {}, model = 'gpt-4o-mini', stream = false } = body

    // 3. モデル検証
    if (!MODEL_COSTS[model]) {
      return NextResponse.json(
        { error: `サポートされていないモデルです: ${model}` },
        { status: 400 }
      )
    }

    // 4. プロンプト取得
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        purchases: { where: { userId, status: 'completed' } },
        owner: { select: { id: true } },
      },
    })

    if (!prompt || !prompt.isPublished) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // 5. アクセス権チェック
    const isOwner = prompt.owner.id === userId
    const hasPurchased = prompt.purchases.length > 0
    const isFree = prompt.priceJPY === 0
    const hasAccess = isOwner || hasPurchased || isFree

    // 6. 日次制限チェック
    const dailyLimit = hasAccess ? PURCHASED_DAILY_EXECUTION_LIMIT : FREE_DAILY_EXECUTION_LIMIT
    const quota = await getUserDailyQuota(userId)

    const totalExecutions = quota.freeExecutions + quota.paidExecutions
    if (totalExecutions >= dailyLimit) {
      return NextResponse.json(
        {
          error: `本日の実行上限（${dailyLimit}回）に達しました`,
          remainingExecutions: 0,
        },
        { status: 429 }
      )
    }

    // 7. 月間コスト上限チェック
    const costCheck = await checkCostLimit()
    if (!costCheck.allowed) {
      return NextResponse.json(
        { error: costCheck.reason },
        { status: 503 }
      )
    }

    // 8. 変数の検証
    const requiredVariables = extractVariables(prompt.promptBody)
    const missingVariables = requiredVariables.filter((v) => !(v in variables))
    
    if (missingVariables.length > 0) {
      return NextResponse.json(
        { error: `必須変数が不足しています: ${missingVariables.join(', ')}` },
        { status: 400 }
      )
    }

    // 9. 各変数のセキュリティチェック
    for (const [, value] of Object.entries(variables)) {
      const securityCheck = checkInputSecurity(value)
      if (!securityCheck.isSafe) {
        // 不正入力をログに記録
        await prisma.promptExecution.create({
          data: {
            userId,
            promptId,
            inputVariables: JSON.stringify(variables),
            model,
            outputText: '',
            tokensUsed: 0,
            latencyMs: Date.now() - startTime,
            costCredits: 0,
            wasBlocked: true,
            blockReason: securityCheck.blockedReason,
          },
        })

        return NextResponse.json(
          { error: securityCheck.blockedReason },
          { status: 400 }
        )
      }
    }

    // 10. 最終プロンプト構築
    const { prompt: finalPrompt, blocked, reason } = buildFinalPrompt(
      prompt.promptBody,
      variables
    )

    if (blocked) {
      return NextResponse.json({ error: reason }, { status: 400 })
    }

    // 11. クレジットチェック & 消費
    const executionCost = getExecutionCost(model)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    if (!user || user.credits < executionCost) {
      return NextResponse.json(
        { error: `クレジットが不足しています（必要: ${executionCost}、残高: ${user?.credits || 0}）` },
        { status: 402 }
      )
    }

    // 12. OpenAI API呼び出し
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: createSafeSystemMessage() },
          { role: 'user', content: finalPrompt },
        ],
        max_tokens: 2000,
        stream,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'AI実行に失敗しました' },
        { status: 500 }
      )
    }

    // 13. ストリーミングレスポンス
    if (stream) {
      return handleStreamingResponse(
        openaiResponse,
        userId,
        promptId,
        model,
        variables,
        executionCost,
        startTime,
        hasAccess
      )
    }

    // 14. 通常レスポンス
    const data = await openaiResponse.json()
    const outputText = data.choices?.[0]?.message?.content || ''
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    const latencyMs = Date.now() - startTime

    // 15. コスト計算 & ログ記録
    const costUSD = calculateCostUSD(model, {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
    })

    await Promise.all([
      // 実行ログ
      prisma.promptExecution.create({
        data: {
          userId,
          promptId,
          inputVariables: JSON.stringify(variables),
          model,
          outputText,
          tokensUsed: usage.total_tokens,
          latencyMs,
          costCredits: executionCost,
          wasBlocked: false,
        },
      }),
      // クレジット消費
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: executionCost } },
      }),
      // クレジット履歴
      prisma.creditHistory.create({
        data: {
          userId,
          amount: -executionCost,
          type: 'execution',
          description: `プロンプト実行: ${prompt.title.slice(0, 30)}`,
        },
      }),
      // クォータ更新
      incrementUserQuota(userId, !hasAccess, usage.total_tokens),
      // APIコストログ
      logApiUsage(model, usage.total_tokens, costUSD),
    ])

    return NextResponse.json({
      output: outputText,
      tokensUsed: usage.total_tokens,
      latencyMs,
      creditsUsed: executionCost,
      remainingCredits: user.credits - executionCost,
      remainingExecutions: dailyLimit - totalExecutions - 1,
    })
  } catch (error) {
    console.error('Error executing prompt:', error)
    return NextResponse.json(
      { error: 'プロンプトの実行に失敗しました' },
      { status: 500 }
    )
  }
}

// =============================================================================
// ストリーミングレスポンスハンドラー
// =============================================================================

async function handleStreamingResponse(
  openaiResponse: Response,
  userId: string,
  promptId: string,
  model: SupportedModel,
  variables: Record<string, string>,
  executionCost: number,
  startTime: number,
  hasAccess: boolean
): Promise<Response> {
  const reader = openaiResponse.body?.getReader()
  if (!reader) {
    return NextResponse.json({ error: 'ストリーム取得に失敗しました' }, { status: 500 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let fullOutput = ''
  let totalTokens = 0

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter((line) => line.trim() !== '')

          for (const line of lines) {
            if (line === 'data: [DONE]') {
              // ストリーム完了時の処理
              const latencyMs = Date.now() - startTime
              
              // 推定トークン数（実際のストリームではusageが返らないため）
              totalTokens = Math.ceil((fullOutput.length / 4) * 1.5) // 概算

              // 非同期でログ記録
              Promise.all([
                prisma.promptExecution.create({
                  data: {
                    userId,
                    promptId,
                    inputVariables: JSON.stringify(variables),
                    model,
                    outputText: fullOutput,
                    tokensUsed: totalTokens,
                    latencyMs,
                    costCredits: executionCost,
                    wasBlocked: false,
                  },
                }),
                prisma.user.update({
                  where: { id: userId },
                  data: { credits: { decrement: executionCost } },
                }),
                prisma.creditHistory.create({
                  data: {
                    userId,
                    amount: -executionCost,
                    type: 'execution',
                    description: `プロンプト実行（ストリーミング）`,
                  },
                }),
                incrementUserQuota(userId, !hasAccess, totalTokens),
              ]).catch(console.error)

              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              return
            }

            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6))
                const content = json.choices?.[0]?.delta?.content || ''
                if (content) {
                  fullOutput += content
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
                  )
                }
              } catch {
                // パースエラーは無視
              }
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error)
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// =============================================================================
// GET: 実行履歴取得
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const executions = await prisma.promptExecution.findMany({
      where: {
        promptId,
        userId: session.user.id,
        wasBlocked: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        model: true,
        tokensUsed: true,
        latencyMs: true,
        costCredits: true,
      },
    })

    return NextResponse.json(executions)
  } catch (error) {
    console.error('Error fetching executions:', error)
    return NextResponse.json(
      { error: '実行履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}

