import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signUpSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = signUpSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { username, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスまたはユーザー名は既に使用されています' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user with 1000 starter credits
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: username,
        credits: 1000,
        creditHistory: {
          create: {
            amount: 1000,
            type: 'bonus',
            description: '新規登録ボーナス',
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        credits: true,
      },
    })

    return NextResponse.json(
      { message: '登録が完了しました', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    const isDatabaseError = error instanceof Error &&
      (error.message.includes('prisma') || error.message.includes('database') || error.message.includes('connect'))
    return NextResponse.json(
      { error: isDatabaseError ? 'データベース接続エラーが発生しました。しばらく経ってからお試しください。' : '登録に失敗しました' },
      { status: isDatabaseError ? 503 : 500 }
    )
  }
}
