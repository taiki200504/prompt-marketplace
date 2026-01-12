'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Service Worker登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }

    // インストール済みチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // インストールプロンプトを保存
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // 初回表示から3日後、または前回から7日後にバナー表示
      const lastDismissed = localStorage.getItem('pwa_banner_dismissed')
      if (!lastDismissed) {
        setTimeout(() => setShowBanner(true), 5000)
      } else {
        const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
        if (daysSinceDismissed > 7) {
          setTimeout(() => setShowBanner(true), 5000)
        }
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // インストール完了検知
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center flex-shrink-0">
            <span className="text-[var(--bg-primary)] font-bold text-lg">P</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">アプリをインストール</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              ホーム画面に追加して、より快適にお使いいただけます
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="btn btn-primary btn-sm"
              >
                インストール
              </button>
              <button
                onClick={handleDismiss}
                className="btn btn-ghost btn-sm"
              >
                後で
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
