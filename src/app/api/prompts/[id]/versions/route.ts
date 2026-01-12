import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/prompts/[id]/versions - バージョン履歴を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        currentVersion: true,
        versions: {
          orderBy: { version: 'desc' },
          select: {
            id: true,
            version: true,
            title: true,
            shortDescription: true,
            changeLog: true,
            createdAt: true,
          },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // オーナーのみバージョン履歴を閲覧可能
    const isOwner = session?.user?.id === prompt.ownerId
    if (!isOwner) {
      return NextResponse.json(
        { error: 'バージョン履歴を閲覧する権限がありません' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      currentVersion: prompt.currentVersion,
      versions: prompt.versions,
    })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'バージョン履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/prompts/[id]/versions - 新しいバージョンを作成
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

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    if (prompt.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'バージョンを作成する権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { changeLog } = body

    // 現在のコンテンツをバージョン履歴に保存
    const newVersion = prompt.currentVersion + 1

    // トランザクションで新バージョンを作成
    const result = await prisma.$transaction(async (tx) => {
      // 新しいバージョンレコードを作成（現在のコンテンツを保存）
      await tx.promptVersion.create({
        data: {
          promptId: prompt.id,
          version: prompt.currentVersion,
          title: prompt.title,
          shortDescription: prompt.shortDescription,
          promptBody: prompt.promptBody,
          usageGuide: prompt.usageGuide,
          exampleInput: prompt.exampleInput,
          exampleOutput: prompt.exampleOutput,
          changeLog: changeLog || null,
        },
      })

      // プロンプトのバージョン番号を更新
      const updatedPrompt = await tx.prompt.update({
        where: { id: prompt.id },
        data: {
          currentVersion: newVersion,
        },
      })

      return updatedPrompt
    })

    return NextResponse.json({
      message: 'バージョンを保存しました',
      currentVersion: result.currentVersion,
    })
  } catch (error) {
    console.error('Error creating version:', error)
    return NextResponse.json(
      { error: 'バージョンの作成に失敗しました' },
      { status: 500 }
    )
  }
}
