'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import SocialLoginButtons from '@/components/SocialLoginButtons'

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || '登録に失敗しました', 'error')
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        showToast('アカウントを作成しました！1,000クレジットをプレゼント', 'success')
        router.push('/')
        router.refresh()
      }
    } catch {
      showToast('登録に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-gradient">Prompt</span>
              <span className="text-[var(--text-primary)]">Market</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold mb-1.5">アカウント作成</h1>
          <p className="text-sm text-[var(--text-muted)]">
            無料で始めて、1,000クレジットをゲット
          </p>
        </div>

        <div className="card">
          <SocialLoginButtons />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg-secondary)] px-3 text-[var(--text-muted)]">または</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="your_username"
                required
                minLength={3}
                autoComplete="username"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">3文字以上、英数字とアンダースコア</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">6文字以上</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? '作成中...' : 'アカウントを作成'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-[var(--accent-secondary)] hover:underline font-medium">
            ログイン
          </Link>
        </p>

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-4">
          登録することで利用規約に同意したものとみなされます
        </p>
      </div>
    </div>
  )
}
