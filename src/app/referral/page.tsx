'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ReferralData {
  referralCode: string
  totalSignups: number
  totalRewards: number
  referredUsers: {
    id: string
    createdAt: string
    rewardStatus: string
    rewardAmount: number
  }[]
}

export default function ReferralPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchReferralData() {
      try {
        const res = await fetch('/api/referral')
        if (res.ok) {
          const data = await res.json()
          setReferralData(data)
        }
      } catch (error) {
        console.error('Error fetching referral data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchReferralData()
    }
  }, [session])

  const createReferralCode = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setReferralData(data)
      }
    } catch (error) {
      console.error('Error creating referral code:', error)
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async () => {
    if (referralData?.referralCode) {
      const url = `${window.location.origin}/signup?ref=${referralData.referralCode}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--gold)] border-t-transparent" />
      </div>
    )
  }

  const referralUrl = referralData?.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralData.referralCode}`
    : ''

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold-muted)] border border-[var(--border-accent)] mb-6">
            <span className="text-[var(--gold)] text-xs">🎁</span>
            <span className="text-sm text-[var(--gold)] font-medium">リファラルプログラム</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            友達を招待して<span className="text-gradient">報酬</span>を獲得
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            紹介コードを使って新規ユーザーを招待すると、あなたと招待された方の両方に
            <span className="text-[var(--gold)] font-semibold">500クレジット</span>がプレゼントされます。
          </p>
        </div>

        {/* Stats Cards */}
        {referralData && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-[var(--gold)] mb-2">
                {referralData.totalSignups}
              </p>
              <p className="text-sm text-[var(--text-muted)]">招待した人数</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-[var(--success)] mb-2">
                {referralData.totalRewards.toLocaleString()}
              </p>
              <p className="text-sm text-[var(--text-muted)]">獲得報酬（クレジット）</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-[var(--accent-primary)] mb-2">
                500
              </p>
              <p className="text-sm text-[var(--text-muted)]">1人あたりの報酬</p>
            </div>
          </div>
        )}

        {/* Referral Link Section */}
        <div className="card-premium p-8 mb-12">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            あなたの紹介リンク
          </h2>
          
          {referralData?.referralCode ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  className="input flex-1 bg-[var(--bg-tertiary)] text-sm font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="btn btn-primary whitespace-nowrap"
                >
                  {copied ? '✓ コピー完了' : 'コピー'}
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="text-[var(--gold)]">💡</span>
                このリンクをSNSやメールで共有しましょう
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--text-muted)] mb-6">
                まだ紹介コードを作成していません
              </p>
              <button
                onClick={createReferralCode}
                disabled={creating}
                className="btn btn-primary"
              >
                {creating ? '作成中...' : '紹介コードを作成'}
              </button>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="card p-8 mb-12">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
            仕組み
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--gold-muted)] text-[var(--gold)] text-xl mb-4">
                1
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">リンクを共有</h3>
              <p className="text-sm text-[var(--text-muted)]">
                あなた専用の紹介リンクをSNSやメールで友達に共有
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--gold-muted)] text-[var(--gold)] text-xl mb-4">
                2
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">友達が登録</h3>
              <p className="text-sm text-[var(--text-muted)]">
                友達がリンク経由でアカウントを作成
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--gold-muted)] text-[var(--gold)] text-xl mb-4">
                3
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">報酬を獲得</h3>
              <p className="text-sm text-[var(--text-muted)]">
                両者に500クレジットがプレゼント
              </p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        {referralData && referralData.referredUsers.length > 0 && (
          <div className="card p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
              招待履歴
            </h2>
            <div className="space-y-4">
              {referralData.referredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-lg"
                >
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        user.rewardStatus === 'paid'
                          ? 'bg-[var(--success)]/10 text-[var(--success)]'
                          : user.rewardStatus === 'eligible'
                          ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
                      }`}
                    >
                      {user.rewardStatus === 'paid'
                        ? '報酬付与済み'
                        : user.rewardStatus === 'eligible'
                        ? '報酬対象'
                        : '確認中'}
                    </span>
                    <span className="text-[var(--gold)] font-semibold">
                      +{user.rewardAmount} クレジット
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
