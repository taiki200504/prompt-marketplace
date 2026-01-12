import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          username: user.username,
        }
      },
    }),
    // Google Provider (環境変数が設定されている場合のみ有効)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // GitHub Provider (環境変数が設定されている場合のみ有効)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // ソーシャルログインの場合、ユーザーを作成または取得
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user.email) {
          return false
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // 新規ユーザー作成
          const username = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20)
          
          // ユーザー名の重複チェック
          let finalUsername = username
          let counter = 1
          while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
            finalUsername = `${username}${counter}`
            counter++
          }

          await prisma.user.create({
            data: {
              email: user.email,
              username: finalUsername,
              passwordHash: '', // ソーシャルログインなのでパスワード不要
              displayName: user.name || finalUsername,
              avatarUrl: user.image || null,
              credits: 1000,
              creditHistory: {
                create: {
                  amount: 1000,
                  type: 'bonus',
                  description: '新規登録ボーナス',
                },
              },
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        // 初回ログイン時
        if (account?.provider === 'google' || account?.provider === 'github') {
          // ソーシャルログインの場合、DBからユーザー情報を取得
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.username = dbUser.username
          }
        } else {
          token.id = user.id
          token.username = (user as { username: string }).username
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
