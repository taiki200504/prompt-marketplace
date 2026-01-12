'use client'

import { useState } from 'react'

interface Suggestion {
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  example?: string
}

interface AIImproveResult {
  analysis?: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  }
  suggestions?: Suggestion[]
  improvedPrompt?: string
  expectedImprovements?: string[]
  error?: string
}

interface AIImproveButtonProps {
  promptId: string
  canAccess: boolean
}

export default function AIImproveButton({ promptId, canAccess }: AIImproveButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIImproveResult | null>(null)
  const [focusArea, setFocusArea] = useState<string>('general')
  const [error, setError] = useState<string | null>(null)

  const handleImprove = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/prompts/${promptId}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusArea }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || '改善提案の取得に失敗しました')
        return
      }
      
      setResult(data.suggestions)
    } catch (err) {
      console.error('Error:', err)
      setError('改善提案の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!canAccess) return null

  const priorityColors = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>AI改善提案</span>
        <span className="text-xs px-2 py-0.5 bg-[var(--gold-muted)] text-[var(--gold)] rounded-full">
          50クレジット
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 p-6 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-subtle)]">
          {!result ? (
            <>
              <h4 className="font-semibold text-[var(--text-primary)] mb-4">
                AIがプロンプトを分析し、改善提案を生成します
              </h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">フォーカスエリア</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'general', label: '全般的な改善' },
                    { value: 'clarity', label: '明確さ向上' },
                    { value: 'effectiveness', label: '効果性向上' },
                    { value: 'specificity', label: '具体性向上' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFocusArea(option.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        focusArea === option.value
                          ? 'bg-[var(--gold-muted)] border-[var(--gold)] text-[var(--gold)]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-[var(--error)] mb-4">{error}</p>
              )}

              <button
                onClick={handleImprove}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    分析中...
                  </span>
                ) : (
                  '改善提案を生成（50クレジット）'
                )}
              </button>
            </>
          ) : (
            <div className="space-y-6">
              {/* Analysis */}
              {result.analysis && (
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">📊 分析結果</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <h5 className="text-sm font-medium text-green-400 mb-2">強み</h5>
                      <ul className="space-y-1">
                        {result.analysis.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-[var(--text-secondary)]">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                      <h5 className="text-sm font-medium text-red-400 mb-2">弱点</h5>
                      <ul className="space-y-1">
                        {result.analysis.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-[var(--text-secondary)]">• {w}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                      <h5 className="text-sm font-medium text-blue-400 mb-2">改善機会</h5>
                      <ul className="space-y-1">
                        {result.analysis.opportunities.map((o, i) => (
                          <li key={i} className="text-xs text-[var(--text-secondary)]">• {o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">💡 改善提案</h4>
                  <div className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[var(--text-muted)]">{s.category}</span>
                              <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[s.priority]}`}>
                                {s.priority === 'high' ? '高' : s.priority === 'medium' ? '中' : '低'}優先度
                              </span>
                            </div>
                            <h5 className="font-medium text-[var(--text-primary)]">{s.title}</h5>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">{s.description}</p>
                            {s.example && (
                              <div className="mt-2 p-2 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-muted)] font-mono">
                                {s.example}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improved Prompt */}
              {result.improvedPrompt && (
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">✨ 改善後プロンプト</h4>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                    <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-mono">
                      {result.improvedPrompt}
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.improvedPrompt!)}
                      className="mt-3 btn btn-ghost btn-sm"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              )}

              {/* Expected Improvements */}
              {result.expectedImprovements && result.expectedImprovements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">🎯 期待される効果</h4>
                  <ul className="space-y-2">
                    {result.expectedImprovements.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-[var(--success)]">✓</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="btn btn-ghost w-full"
              >
                再度分析する
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
