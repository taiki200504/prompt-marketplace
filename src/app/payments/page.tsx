'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payment {
  id: string
  promptId: string
  promptTitle: string
  price: number
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  paymentProvider: 'credits' | 'stripe' | 'orynth'
  createdAt: string
  completedAt?: string
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchPayments()
    }
  }, [status, router])

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Payment['status']) => {
    const badges = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      refunded: 'badge-neutral',
    }
    return badges[status] || 'badge-neutral'
  }

  const getStatusLabel = (status: Payment['status']) => {
    const labels = {
      completed: '完了',
      pending: '処理中',
      failed: '失敗',
      refunded: '返金済み',
    }
    return labels[status] || status
  }

  const getProviderLabel = (provider: Payment['paymentProvider']) => {
    const labels = {
      credits: 'クレジット',
      stripe: 'クレジットカード',
      orynth: 'USDC',
    }
    return labels[provider] || provider
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">決済履歴</h1>
              <p className="text-[var(--text-muted)]">
                あなたの購入履歴を確認できます
              </p>
            </div>
            <Link href="/prompts" className="btn btn-secondary">
              プロンプトを探す
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">💳</div>
              <p className="text-[var(--text-muted)] mb-6">
                まだ決済履歴がありません
              </p>
              <Link href="/prompts" className="btn btn-primary">
                プロンプトを探す
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="card p-6 hover:border-[var(--border-accent)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/prompts/${payment.promptId}`}
                          className="font-medium text-[var(--text-primary)] hover:text-[var(--gold)] transition-colors"
                        >
                          {payment.promptTitle}
                        </Link>
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                        <span>{getProviderLabel(payment.paymentProvider)}</span>
                        <span>
                          {new Date(payment.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[var(--gold)]">
                        ◆{payment.price.toLocaleString()}
                      </p>
                      {payment.completedAt && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          完了: {new Date(payment.completedAt).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
