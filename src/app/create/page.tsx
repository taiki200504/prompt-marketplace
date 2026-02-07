'use client'

import { useState } from 'react'
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

export default function CreatePromptPage() {
  const { status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
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

  if (status === 'loading') {
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

  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/create')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublished: publish,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showToast(publish ? 'プロンプトを公開しました' : '下書きを保存しました', 'success')
        router.push(`/prompts/${data.id}`)
      } else {
        showToast(data.error || '作成に失敗しました', 'error')
      }
    } catch {
      showToast('作成に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">新規プロンプト作成</h1>
            <p className="text-sm text-[var(--text-muted)]">
              プロンプトを作成して共有・販売しましょう
            </p>
          </div>
          <Link href="/prompts" className="btn btn-ghost">
            キャンセル
          </Link>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
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
                    placeholder="SEO最適化ブログ記事生成プロンプト"
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
                    placeholder="一覧に表示される短い説明文"
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
                    <p className="text-xs text-[var(--text-muted)] mt-1">0 = 無料</p>
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
                    placeholder="SEO,ブログ,マーケティング（カンマ区切り）"
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
                    placeholder="プロンプトの本文を入力してください。変数は {input} のように記述できます。"
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
                    placeholder="このプロンプトの効果的な使い方を説明してください"
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
                    placeholder="ユーザーが入力する例"
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
                    placeholder="AIが生成する出力の例"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? '保存中...' : '下書き保存'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? '公開中...' : '公開する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
