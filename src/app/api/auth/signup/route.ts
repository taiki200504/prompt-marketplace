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
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています' },
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
    return NextResponse.json(
      { error: '登録に失敗しました' },
      { status: 500 }
    )
  }
}
