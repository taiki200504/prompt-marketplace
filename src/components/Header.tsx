'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { NotificationBell } from './NotificationBell'

export default function Header() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    // Initial check
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/users/credits')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch credits')
          return res.json()
        })
        .then((data) => {
          if (typeof data.credits === 'number') {
            setCredits(data.credits)
          }
        })
        .catch(() => {})
    }
  }, [session])

  return (
    <header 
      role="banner"
      suppressHydrationWarning
      className={`sticky top-0 z-50 transition-all duration-300 ${
        mounted && scrolled 
          ? 'bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-lg shadow-black/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-20 py-5">
          {/* Logo */}
          <div className="flex items-center gap-12 flex-1">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center shadow-lg shadow-[var(--gold)]/30 transition-transform group-hover:scale-105">
                <span className="text-[var(--bg-primary)] font-bold text-base">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">
                <span className="text-gradient">Prompt</span>
                <span className="text-[var(--text-primary)]">Market</span>
              </span>
            </Link>

            {/* Navigation - Desktop */}
            <nav role="navigation" aria-label="メインナビゲーション" className="hidden md:flex items-center gap-2">
              <Link
                href="/prompts"
                className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-all duration-200"
              >
                探索
              </Link>
              {status === 'authenticated' && (
                <>
                  <Link
                    href="/create"
                    className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                  >
                    投稿
                  </Link>
                  <Link
                    href="/favorites"
                    className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                  >
                    お気に入り
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!mounted || status === 'loading' ? (
              <div className="h-9 w-28 skeleton rounded-lg" />
            ) : status === 'authenticated' ? (
              <>
                {/* Credits Display */}
                <Link
                  href="/credits"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--gold-muted)] border border-[var(--border-accent)] rounded-xl text-sm hover:bg-[var(--gold)]/20 transition-all duration-200 group"
                >
                  <span className="text-[var(--gold)] text-base">◆</span>
                  <span className="text-[var(--gold)] font-semibold tabular-nums">
                    {credits !== null ? credits.toLocaleString() : '---'}
                  </span>
                </Link>

                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="ユーザーメニュー"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                  >
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] flex items-center justify-center text-[var(--bg-primary)] text-sm font-semibold shadow-lg shadow-[var(--gold)]/20">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div 
                        role="menu"
                        aria-label="ユーザーメニュー"
                        className="absolute right-0 mt-3 w-64 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl py-2 z-20 overflow-hidden"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                            @{session.user?.username}
                          </p>
                        </div>
                        
                        {/* Menu items */}
                        <div className="py-2">
                          <Link
                            href={`/profile/${session.user?.username}`}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span className="text-base">👤</span>
                            <span>プロフィール</span>
                          </Link>
                          <Link
                            href="/credits"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span className="text-base">💎</span>
                            <span>クレジット</span>
                          </Link>
                          <Link
                            href="/favorites"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span className="text-base">♥</span>
                            <span>お気に入り</span>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-[var(--border-subtle)] pt-2">
                          <button
                            onClick={() => {
                              setMenuOpen(false)
                              signOut()
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors"
                          >
                            <span className="text-base">↪</span>
                            <span>ログアウト</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/login" className="btn btn-ghost">
                    ログイン
                  </Link>
                  <Link href="/signup" className="btn btn-primary">
                    無料で始める
                  </Link>
                </div>
                {/* Mobile Menu Button for unauthenticated */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                  aria-label="メニュー"
                  aria-expanded={mobileMenuOpen}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </>
            )}
            
            {/* Mobile Menu Button for authenticated */}
            {status === 'authenticated' && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors ml-2"
                aria-label="メニュー"
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] pt-4 pb-4">
            <nav className="flex flex-col gap-2">
              <Link
                href="/prompts"
                className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                探索
              </Link>
              {status === 'authenticated' && (
                <>
                  <Link
                    href="/create"
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    投稿
                  </Link>
                  <Link
                    href="/favorites"
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    お気に入り
                  </Link>
                  <Link
                    href="/credits"
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-between"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>クレジット</span>
                    <span className="text-[var(--gold)] font-semibold tabular-nums">
                      {credits !== null ? credits.toLocaleString() : '---'}
                    </span>
                  </Link>
                  <Link
                    href={`/profile/${session.user?.username}`}
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    プロフィール
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                    className="px-4 py-2 text-sm text-[var(--danger)] rounded-lg hover:bg-[var(--danger-muted)] transition-all text-left"
                  >
                    ログアウト
                  </button>
                </>
              )}
              {status === 'unauthenticated' && (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm text-center rounded-lg btn btn-ghost"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm text-center rounded-lg btn btn-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    無料で始める
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
