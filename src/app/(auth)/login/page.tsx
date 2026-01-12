'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import SocialLoginButtons from '@/components/SocialLoginButtons'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        showToast('ログインしました', 'success')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      showToast('ログインに失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">ログイン</h1>
        <p className="text-sm text-[var(--text-muted)]">
          アカウントにログインして続ける
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
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

        <SocialLoginButtons callbackUrl={callbackUrl} />

        <div className="divider" />

        <p className="text-center text-sm text-[var(--text-muted)]">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-[var(--accent-secondary)] hover:underline">
            新規登録
          </Link>
        </p>
      </div>

      <div className="mt-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-muted)] text-center mb-2">デモアカウント</p>
        <div className="text-xs text-center space-y-1">
          <p><code className="text-[var(--text-secondary)]">demo@example.com</code> / <code>password123</code></p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={
        <div className="w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--bg-tertiary)] rounded mb-8 mx-auto w-32" />
            <div className="card p-6">
              <div className="space-y-4">
                <div className="h-12 bg-[var(--bg-tertiary)] rounded" />
                <div className="h-12 bg-[var(--bg-tertiary)] rounded" />
                <div className="h-12 bg-[var(--bg-tertiary)] rounded" />
              </div>
            </div>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
