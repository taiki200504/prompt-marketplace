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
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-8">クレジット</h1>

        {/* Balance Card */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-1">現在の残高</p>
              <p className="text-4xl font-bold">
                <span className="text-[var(--gold)]">◆</span>
                {credits.toLocaleString()}
              </p>
            </div>
            <button
              onClick={claimBonus}
              disabled={claiming}
              className="btn btn-primary"
            >
              {claiming ? '取得中...' : '🎁 ボーナスを受け取る'}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="card mb-8 bg-[var(--accent-muted)] border-[var(--accent-primary)]">
          <h3 className="font-medium mb-2">💡 クレジットについて</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>• クレジットはプロンプトの購入に使用できます</li>
            <li>• プロンプトが売れると、価格の80%がクレジットとして還元されます</li>
            <li>• 新規登録で1,000クレジットプレゼント！</li>
            <li>• デイリーボーナスで500クレジットを獲得できます</li>
          </ul>
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-medium mb-4">履歴</h2>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="card flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`badge badge-neutral ${getTypeStyle(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${item.amount >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-[var(--text-muted)]">履歴はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

