import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// データベース接続URLの検証
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set')
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 接続テスト（本番環境のみ、非同期で実行）
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  prisma.$connect().catch((error) => {
    console.error('❌ Failed to connect to database:', error)
    // 接続エラーでもアプリケーションは起動を続ける
  })
}
