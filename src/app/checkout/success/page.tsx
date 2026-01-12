'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

// 動的レンダリングを強制（ビルド時の静的生成を無効化）
export const dynamic = 'force-dynamic'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [purchase, setPurchase] = useState<{
    promptId: string
    promptTitle: string
    price: number
  } | null>(null)

  const sessionId = searchParams?.get('session_id')

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    if (!sessionId) {
      router.push('/prompts')
      return
    }

    // Stripeセッションから購入情報を取得
    const fetchPurchaseInfo = async () => {
      try {
        const res = await fetch(`/api/checkout/session?session_id=${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setPurchase(data)
        } else {
          router.push('/prompts')
        }
      } catch (error) {
        console.error('Error fetching purchase info:', error)
        router.push('/prompts')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchaseInfo()
  }, [session, sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">決済情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">決済情報が見つかりません</h1>
          <p className="text-[var(--text-muted)] mb-6">
            決済が完了していないか、セッションが無効です
          </p>
          <Link href="/prompts" className="btn btn-primary">
            プロンプト一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-[var(--success-muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-[var(--success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">決済が完了しました！</h1>
              <p className="text-[var(--text-secondary)]">
                プロンプトの購入が正常に完了しました
              </p>
            </div>

            {/* Purchase Details */}
            <div className="bg-[var(--bg-primary)] rounded-lg p-6 mb-6 border border-[var(--border-subtle)]">
              <h2 className="font-medium mb-4">購入内容</h2>
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">プロンプト</span>
                  <span className="font-medium">{purchase.promptTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">支払い金額</span>
                  <span className="font-bold text-[var(--gold)]">
                    ¥{purchase.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">決済方法</span>
                  <span>クレジットカード（Stripe）</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/prompts/${purchase.promptId}`}
                className="btn btn-primary"
              >
                プロンプトを確認する
              </Link>
              <Link href="/prompts" className="btn btn-secondary">
                他のプロンプトを見る
              </Link>
              <Link href="/payments" className="btn btn-outline">
                決済履歴を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">読み込み中...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
