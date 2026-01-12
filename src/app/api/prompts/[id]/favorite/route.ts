import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/prompts/[id]/favorite - Check if favorited
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorited: false })
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId,
        },
      },
    })

    return NextResponse.json({ isFavorited: !!favorite })
  } catch (error) {
    console.error('Error checking favorite:', error)
    return NextResponse.json({ isFavorited: false })
  }
}

// POST /api/prompts/[id]/favorite - Toggle favorite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      )
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId,
        },
      },
    })

    if (existingFavorite) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      })
      return NextResponse.json({ isFavorited: false, message: 'お気に入りを解除しました' })
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          promptId,
        },
      })
      return NextResponse.json({ isFavorited: true, message: 'お気に入りに追加しました' })
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json(
      { error: 'お気に入りの更新に失敗しました' },
      { status: 500 }
    )
  }
}

