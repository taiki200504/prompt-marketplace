'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface CreditHistoryItem {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

export default function CreditsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [credits, setCredits] = useState<number>(0)
  const [history, setHistory] = useState<CreditHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/credits')
      return
    }

    if (status === 'authenticated') {
      fetchCredits()
    }
  }, [status, router])

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/users/credits')
      const data = await res.json()
      setCredits(data.credits || 0)
      setHistory(data.history || [])
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimBonus = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/users/credits', { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        setCredits(data.credits)
        showToast(data.message, 'success')
        fetchCredits()
      } else {
        showToast(data.error || 'エラーが発生しました', 'error')
      }
    } catch {
      showToast('エラーが発生しました', 'error')
    } finally {
      setClaiming(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return '購入'
      case 'sale': return '売上'
      case 'bonus': return 'ボーナス'
      case 'refund': return '返金'
      default: return type
    }
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-[var(--danger)]'
      case 'sale': return 'text-[var(--success)]'
      case 'bonus': return 'text-[var(--gold)]'
      case 'refund': return 'text-[var(--text-secondary)]'
      default: return ''
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 skeleton mb-8" />
          <div className="card mb-6">
            <div className="h-20 skeleton" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-10">クレジット</h1>

        {/* Balance Card */}
        <div className="card mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-2">現在の残高</p>
              <p className="text-4xl font-bold">
                <span className="text-[var(--gold)]">◆ </span>
                {credits.toLocaleString()}
              </p>
            </div>
            <button
              onClick={claimBonus}
              disabled={claiming}
              className="btn btn-primary w-full sm:w-auto"
            >
              {claiming ? '取得中...' : 'デイリーボーナスを受け取る'}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="card mb-10 bg-[var(--accent-muted)] border-[var(--accent-primary)]">
          <h3 className="font-medium mb-4">クレジットについて</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-3">
            <li>プロンプトの購入に使用できます</li>
            <li>売上の80%がクレジットとして還元されます</li>
            <li>毎日500クレジットのデイリーボーナスあり</li>
          </ul>
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-semibold mb-6">取引履歴</h2>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="card flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <span className={`badge badge-neutral ${getTypeStyle(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className={`font-medium ${item.amount >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-10">
              <p className="text-[var(--text-muted)]">履歴はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

