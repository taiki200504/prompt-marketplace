import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/prompts/[id]/versions/[version] - 特定バージョンの詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { id, version } = await params
    const session = await getServerSession(authOptions)

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // オーナーのみ閲覧可能
    if (session?.user?.id !== prompt.ownerId) {
      return NextResponse.json(
        { error: 'このバージョンを閲覧する権限がありません' },
        { status: 403 }
      )
    }

    const versionNumber = parseInt(version, 10)
    const promptVersion = await prisma.promptVersion.findUnique({
      where: {
        promptId_version: {
          promptId: id,
          version: versionNumber,
        },
      },
    })

    if (!promptVersion) {
      return NextResponse.json(
        { error: 'バージョンが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(promptVersion)
  } catch (error) {
    console.error('Error fetching version:', error)
    return NextResponse.json(
      { error: 'バージョンの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/prompts/[id]/versions/[version]/restore - 特定バージョンに復元
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { id, version } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    if (prompt.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'バージョンを復元する権限がありません' },
        { status: 403 }
      )
    }

    const versionNumber = parseInt(version, 10)
    const targetVersion = await prisma.promptVersion.findUnique({
      where: {
        promptId_version: {
          promptId: id,
          version: versionNumber,
        },
      },
    })

    if (!targetVersion) {
      return NextResponse.json(
        { error: '復元するバージョンが見つかりません' },
        { status: 404 }
      )
    }

    // トランザクションで復元処理
    const result = await prisma.$transaction(async (tx) => {
      // 現在のバージョンを保存
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
          changeLog: `v${versionNumber}から復元前のバックアップ`,
        },
      })

      // 対象バージョンのコンテンツで更新
      const updatedPrompt = await tx.prompt.update({
        where: { id: prompt.id },
        data: {
          title: targetVersion.title,
          shortDescription: targetVersion.shortDescription,
          promptBody: targetVersion.promptBody,
          usageGuide: targetVersion.usageGuide,
          exampleInput: targetVersion.exampleInput,
          exampleOutput: targetVersion.exampleOutput,
          currentVersion: prompt.currentVersion + 1,
        },
      })

      return updatedPrompt
    })

    return NextResponse.json({
      message: `v${versionNumber}に復元しました`,
      currentVersion: result.currentVersion,
    })
  } catch (error) {
    console.error('Error restoring version:', error)
    return NextResponse.json(
      { error: 'バージョンの復元に失敗しました' },
      { status: 500 }
    )
  }
}
