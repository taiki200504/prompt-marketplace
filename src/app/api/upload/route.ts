import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

// Magic bytes for image format validation
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures) return true // Allow if no signature defined
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  )
}

/**
 * POST /api/upload
 * 画像をアップロード
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    // ファイルタイプの検証
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'サポートされていないファイル形式です（JPEG, PNG, WebP, GIFのみ）' },
        { status: 400 }
      )
    }

    // ファイルサイズの検証
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（最大5MB）' },
        { status: 400 }
      )
    }

    // ファイルを読み込み
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // マジックバイトで実際のファイル形式を検証
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'ファイル形式が不正です' },
        { status: 400 }
      )
    }

    // 拡張子をサニタイズ（許可リストのみ）
    const rawExt = file.name.split('.').pop()?.toLowerCase() || ''
    const ext = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : 'jpg'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filename = `${session.user.id}-${timestamp}-${randomStr}.${ext}`

    // アップロードディレクトリを確保
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // 公開URLを返す
    const url = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 }
    )
  }
}
