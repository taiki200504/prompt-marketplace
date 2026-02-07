'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import { ImageUpload } from '@/components/ImageUpload'

const CATEGORIES = [
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Dev', label: 'Dev' },
  { value: 'Design', label: 'Design' },
  { value: 'Career', label: 'Career' },
  { value: 'Study', label: 'Study' },
  { value: 'Fun', label: 'Fun' },
  { value: 'Other', label: 'Other' },
]

interface VersionInfo {
  id: string
  version: number
  title: string
  shortDescription: string
  changeLog: string | null
  createdAt: string
}

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(1)
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [changeLog, setChangeLog] = useState('')
  const [aiImproving, setAiImproving] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    category: 'Marketing',
    promptBody: '',
    usageGuide: '',
    exampleInput: '',
    exampleOutput: '',
    priceJPY: 0,
    tags: '',
    thumbnailUrl: null as string | null,
    isPublished: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    const fetchPrompt = async () => {
      try {
        const [promptRes, versionsRes] = await Promise.all([
          fetch(`/api/prompts/${id}`),
          fetch(`/api/prompts/${id}/versions`),
        ])

        if (!promptRes.ok) {
          router.push('/prompts')
          return
        }
        const data = await promptRes.json()
        
        if (!data.isOwner) {
          showToast('編集権限がありません', 'error')
          router.push(`/prompts/${id}`)
          return
        }

        setFormData({
          title: data.title,
          shortDescription: data.shortDescription,
          category: data.category,
          promptBody: data.promptBody,
          usageGuide: data.usageGuide || '',
          exampleInput: data.exampleInput,
          exampleOutput: data.exampleOutput,
          priceJPY: data.priceJPY,
          tags: data.tags || '',
          thumbnailUrl: data.thumbnailUrl || null,
          isPublished: data.isPublished,
        })

        if (versionsRes.ok) {
          const versionsData = await versionsRes.json()
          setVersions(versionsData.versions)
          setCurrentVersion(versionsData.currentVersion)
        }
      } catch (error) {
        console.error('Error fetching prompt:', error)
        router.push('/prompts')
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchPrompt()
    }
  }, [id, status, router, showToast])

  // バージョンを保存して更新
  const handleVersionedSubmit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault()
    setSaving(true)

    try {
      // 変更がある場合はバージョンを作成
      const versionRes = await fetch(`/api/prompts/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          changeLog: changeLog || null,
          isPublished: publish !== undefined ? publish : formData.isPublished,
        }),
      })

      if (versionRes.ok) {
        const data = await versionRes.json()
        showToast(`バージョン ${data.version} として保存しました`, 'success')
        router.push(`/prompts/${id}`)
      } else {
        const data = await versionRes.json()
        showToast(data.error || '保存に失敗しました', 'error')
      }
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  // AI改善提案を取得
  const handleAiImprove = async (type: string = 'general') => {
    setAiImproving(true)
    setShowAiModal(true)
    setAiSuggestion(null)

    try {
      const res = await fetch(`/api/prompts/${id}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ improvementType: type }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiSuggestion(data.suggestion)
      } else {
        const data = await res.json()
        showToast(data.error || 'AI改善提案の取得に失敗しました', 'error')
        setShowAiModal(false)
      }
    } catch {
      showToast('AI改善提案の取得に失敗しました', 'error')
      setShowAiModal(false)
    } finally {
      setAiImproving(false)
    }
  }

  // 過去バージョンを復元
  const restoreVersion = async (version: number) => {
    try {
      const res = await fetch(`/api/prompts/${id}/versions/${version}`)
      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({
          ...prev,
          title: data.title,
          shortDescription: data.shortDescription,
          promptBody: data.promptBody,
          usageGuide: data.usageGuide || '',
          exampleInput: data.exampleInput,
          exampleOutput: data.exampleOutput,
        }))
        setShowVersionHistory(false)
        showToast(`バージョン ${version} を復元しました（保存はされていません）`, 'info')
      }
    } catch {
      showToast('バージョンの復元に失敗しました', 'error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublished: publish !== undefined ? publish : formData.isPublished,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showToast('変更を保存しました', 'success')
        router.push(`/prompts/${id}`)
      } else {
        showToast(data.error || '保存に失敗しました', 'error')
      }
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('本当にこのプロンプトを削除しますか？この操作は元に戻せません。')) {
      return
    }

    try {
      const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' })
      
      if (res.ok) {
        showToast('プロンプトを削除しました', 'success')
        router.push('/prompts')
      } else {
        const data = await res.json()
        showToast(data.error || '削除に失敗しました', 'error')
      }
    } catch {
      showToast('削除に失敗しました', 'error')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-48 skeleton mb-8" />
          <div className="card">
            <div className="h-64 skeleton" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">プロンプトを編集</h1>
            <div className="flex items-center gap-2">
              {formData.isPublished ? (
                <span className="badge badge-success">公開中</span>
              ) : (
                <span className="badge badge-neutral">下書き</span>
              )}
              <span className="text-sm text-[var(--text-muted)]">
                v{currentVersion}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="btn btn-ghost btn-sm"
            >
              📜 履歴
            </button>
            <button
              type="button"
              onClick={() => handleAiImprove('general')}
              className="btn btn-secondary btn-sm"
            >
              ✨ AI改善
            </button>
            <Link href={`/prompts/${id}`} className="btn btn-ghost">
              戻る
            </Link>
          </div>
        </div>

        {/* Version History Panel */}
        {showVersionHistory && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">📜 バージョン履歴</h2>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            {versions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--gold)]/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">v{currentVersion}</span>
                      <span className="text-xs text-[var(--gold)] ml-2">現在</span>
                    </div>
                  </div>
                </div>
                {versions.map((v) => (
                  <div key={v.id} className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">v{v.version}</span>
                        <span className="text-xs text-[var(--text-muted)] ml-2">
                          {new Date(v.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <button
                        onClick={() => restoreVersion(v.version)}
                        className="text-xs text-[var(--accent-secondary)] hover:underline"
                      >
                        復元
                      </button>
                    </div>
                    {v.changeLog && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">{v.changeLog}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">まだバージョン履歴はありません</p>
            )}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 className="text-lg font-medium mb-4">基本情報</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">タイトル *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">短い説明 *</label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">カテゴリ *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">価格（クレジット）</label>
                    <input
                      type="number"
                      name="priceJPY"
                      value={formData.priceJPY}
                      onChange={handleChange}
                      className="input"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">タグ</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="input"
                    placeholder="カンマ区切りで入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">サムネイル画像</label>
                  <ImageUpload
                    value={formData.thumbnailUrl}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, thumbnailUrl: url }))
                    }
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    プロンプトカードに表示されるサムネイル画像（推奨: 16:9）
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt Content */}
            <div className="card">
              <h2 className="text-lg font-medium mb-4">プロンプト内容</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">プロンプト本文 *</label>
                  <textarea
                    name="promptBody"
                    value={formData.promptBody}
                    onChange={handleChange}
                    className="input font-mono"
                    rows={10}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">使い方ガイド</label>
                  <textarea
                    name="usageGuide"
                    value={formData.usageGuide}
                    onChange={handleChange}
                    className="input"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Examples */}
            <div className="card">
              <h2 className="text-lg font-medium mb-4">入出力例</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">入力例 *</label>
                  <textarea
                    name="exampleInput"
                    value={formData.exampleInput}
                    onChange={handleChange}
                    className="input font-mono"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">出力例 *</label>
                  <textarea
                    name="exampleOutput"
                    value={formData.exampleOutput}
                    onChange={handleChange}
                    className="input font-mono"
                    rows={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Version Change Log */}
            <div className="card">
              <h2 className="text-lg font-medium mb-4">変更内容</h2>
              <div>
                <label className="block text-sm font-medium mb-2">
                  この更新で変更した内容（任意）
                </label>
                <textarea
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="例: プロンプトの指示を明確化、出力フォーマットを改善..."
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  保存するとバージョン {currentVersion + 1} として記録されます
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-between">
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
              >
                削除
              </button>
              
              <div className="flex gap-3">
                {formData.isPublished ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleVersionedSubmit(e, false)}
                      disabled={saving}
                      className="btn btn-secondary"
                    >
                      非公開にする
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleVersionedSubmit(e)}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? '保存中...' : `v${currentVersion + 1} として保存`}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleVersionedSubmit(e)}
                      disabled={saving}
                      className="btn btn-secondary"
                    >
                      {saving ? '保存中...' : '下書き保存'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleVersionedSubmit(e, true)}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      公開する
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* AI Improvement Modal */}
      {showAiModal && (
        <div className="modal-overlay" onClick={() => !aiImproving && setShowAiModal(false)}>
          <div 
            className="modal-content max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">✨ AI改善提案</h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                disabled={aiImproving}
              >
                ✕
              </button>
            </div>

            {/* Improvement Type Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { type: 'general', label: '総合改善' },
                { type: 'clarity', label: '明確性' },
                { type: 'output_format', label: '出力形式' },
                { type: 'performance', label: 'パフォーマンス' },
                { type: 'examples', label: '例示改善' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAiImprove(item.type)}
                  disabled={aiImproving}
                  className="btn btn-sm btn-secondary"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {aiImproving ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[var(--text-muted)]">AIが分析中...</p>
                </div>
              ) : aiSuggestion ? (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-subtle)]">
                    {aiSuggestion}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setShowAiModal(false)}
                className="btn btn-ghost"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
