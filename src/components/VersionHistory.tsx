'use client'

import { useState, useEffect } from 'react'

interface Version {
  id: string
  version: number
  title: string
  shortDescription: string
  changeLog: string | null
  createdAt: string
}

interface VersionHistoryProps {
  promptId: string
  currentVersion: number
  isOwner: boolean
}

export default function VersionHistory({ promptId, currentVersion, isOwner }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [restoring, setRestoring] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && isOwner && versions.length === 0) {
      fetchVersions()
    }
  }, [isOpen, isOwner])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (version: number) => {
    if (!confirm(`v${version}に復元しますか？現在のバージョンはバックアップされます。`)) {
      return
    }

    setRestoring(version)
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions/${version}`, {
        method: 'POST',
      })
      if (res.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error restoring version:', error)
    } finally {
      setRestoring(null)
    }
  }

  if (!isOwner) return null

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>バージョン履歴 (v{currentVersion})</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-subtle)]">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--gold)] border-t-transparent" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              まだバージョン履歴がありません
            </p>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--gold)]">v{v.version}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(v.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{v.title}</p>
                    {v.changeLog && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">{v.changeLog}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRestore(v.version)}
                    disabled={restoring !== null}
                    className="ml-3 px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--gold-muted)] text-[var(--text-secondary)] hover:text-[var(--gold)] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {restoring === v.version ? '復元中...' : '復元'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
