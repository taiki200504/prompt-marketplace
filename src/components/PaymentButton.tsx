'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'

interface PaymentButtonProps {
  promptId: string
  priceJPY: number
  title: string
  onSuccess?: () => void
}

type PaymentMethod = 'credits' | 'stripe'

export function PaymentButton({ promptId, priceJPY, title, onSuccess }: PaymentButtonProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showMethodSelect, setShowMethodSelect] = useState(false)

  const handlePayment = async (method: PaymentMethod) => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId,
          provider: method,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMessage = data.error || '決済に失敗しました'
        showToast(errorMessage, 'error')
        
        // クレジット不足の場合はクレジットページに誘導
        if (errorMessage.includes('クレジットが不足')) {
          setTimeout(() => {
            router.push('/credits')
          }, 2000)
        }
        return
      }

      if (method === 'stripe' && data.redirectUrl) {
        // Stripe決済の場合はリダイレクト
        window.location.href = data.redirectUrl
      } else {
        // クレジット決済の場合は成功
        showToast('購入が完了しました！', 'success')
        setShowMethodSelect(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error('Payment error:', error)
      showToast('決済に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (priceJPY === 0) {
    return (
      <button
        onClick={() => handlePayment('credits')}
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? '処理中...' : '無料で取得'}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowMethodSelect(true)}
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? '処理中...' : '購入する'}
      </button>

      {/* Payment Method Selection Modal */}
      {showMethodSelect && (
        <div
          className="modal-overlay"
          onClick={() => !loading && setShowMethodSelect(false)}
        >
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">決済方法を選択</h2>
              <button
                onClick={() => setShowMethodSelect(false)}
                disabled={loading}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
              <p className="text-sm text-[var(--text-muted)] mb-1">購入するプロンプト</p>
              <p className="font-medium">{title}</p>
              <p className="text-xl font-bold mt-2">
                <span className="text-[var(--gold)]">◆</span>
                {priceJPY.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              {/* Credits Payment */}
              <button
                onClick={() => handlePayment('credits')}
                disabled={loading}
                className="w-full p-4 bg-[var(--bg-secondary)] border-2 border-[var(--border-subtle)] rounded-xl hover:border-[var(--gold)] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--gold-muted)] flex items-center justify-center text-2xl">
                      ◆
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">クレジットで購入</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        アカウントのクレジットを使用
                      </p>
                    </div>
                  </div>
                  <span className="text-[var(--gold)] group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </button>

              {/* Stripe Payment */}
              <button
                onClick={() => handlePayment('stripe')}
                disabled={loading}
                className="w-full p-4 bg-[var(--bg-secondary)] border-2 border-[var(--border-subtle)] rounded-xl hover:border-[var(--accent-primary)] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-[var(--accent-primary)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">クレジットカードで購入</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Stripe経由で安全に決済
                      </p>
                    </div>
                  </div>
                  <span className="text-[var(--accent-primary)] group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </button>
            </div>

            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[var(--text-muted)]">
                <div className="w-4 h-4 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">処理中...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
