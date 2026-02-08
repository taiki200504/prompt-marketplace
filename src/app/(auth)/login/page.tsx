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
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-6">
          <span className="text-xl font-semibold tracking-tight">
            <span className="text-gradient">Prompt</span>
            <span className="text-[var(--text-primary)]">Market</span>
          </span>
        </Link>
        <h1 className="text-xl font-bold mb-1.5">おかえりなさい</h1>
        <p className="text-sm text-[var(--text-muted)]">
          アカウントにログインして続ける
        </p>
      </div>

      <div className="card">
        <SocialLoginButtons callbackUrl={callbackUrl} />

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
              autoComplete="current-password"
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
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-6">
        アカウントをお持ちでない方は{' '}
        <Link href="/signup" className="text-[var(--accent-secondary)] hover:underline font-medium">
          新規登録
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--bg-tertiary)] rounded mb-8 mx-auto w-32" />
            <div className="card p-6">
              <div className="space-y-3.5">
                <div className="h-10 bg-[var(--bg-tertiary)] rounded" />
                <div className="h-10 bg-[var(--bg-tertiary)] rounded" />
                <div className="h-10 bg-[var(--bg-tertiary)] rounded" />
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
