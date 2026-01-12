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

      // Auto login after signup
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        showToast('アカウントを作成しました！1,000クレジットをプレゼント🎁', 'success')
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">アカウント作成</h1>
          <p className="text-sm text-[var(--text-muted)]">
            無料で始めて、1,000クレジットをゲット
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="your_username"
                required
                minLength={3}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">3文字以上、英数字とアンダースコア</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">6文字以上</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? '作成中...' : 'アカウントを作成'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg-secondary)] px-4 text-[var(--text-muted)]">または</span>
            </div>
          </div>

          <SocialLoginButtons />

          <div className="divider" />

          <p className="text-center text-sm text-[var(--text-muted)]">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-[var(--accent-secondary)] hover:underline">
              ログイン
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            登録することで
            <Link href="/terms" className="text-[var(--accent-secondary)] hover:underline mx-1">利用規約</Link>
            に同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  )
}
