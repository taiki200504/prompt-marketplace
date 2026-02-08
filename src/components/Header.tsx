'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { NotificationBell } from './NotificationBell'

export default function Header() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    handleScroll()
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
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

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const navLinkClass = "px-3.5 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all duration-150"
  const mobileNavLinkClass = "flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"

  return (
    <header
      role="banner"
      suppressHydrationWarning
      className={`sticky top-0 z-50 transition-all duration-200 ${
        mounted && scrolled
          ? 'bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)]'
          : 'bg-transparent'
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8 flex-1">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-[var(--bg-primary)] font-bold text-sm">P</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight hidden sm:block">
                <span className="text-gradient">Prompt</span>
                <span className="text-[var(--text-primary)]">Market</span>
              </span>
            </Link>

            <nav role="navigation" aria-label="メインナビゲーション" className="hidden md:flex items-center gap-1">
              <Link href="/prompts" className={navLinkClass}>探索</Link>
              {status === 'authenticated' && (
                <>
                  <Link href="/create" className={navLinkClass}>投稿</Link>
                  <Link href="/dashboard" className={navLinkClass}>ダッシュボード</Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {!mounted || status === 'loading' ? (
              <div className="h-8 w-24 skeleton rounded-lg" />
            ) : status === 'authenticated' ? (
              <>
                <Link
                  href="/credits"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gold-muted)] border border-[var(--border-accent)] rounded-lg text-[13px] hover:bg-[var(--gold)]/15 transition-all"
                >
                  <span className="text-[var(--gold)] text-xs">◆</span>
                  <span className="text-[var(--gold)] font-semibold tabular-nums">
                    {credits !== null ? credits.toLocaleString() : '---'}
                  </span>
                </Link>

                <NotificationBell />

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="ユーザーメニュー"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    className="flex items-center p-0.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-[var(--bg-primary)] text-xs font-semibold">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={closeMenu} />
                      <div role="menu" className="absolute right-0 mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl shadow-2xl py-1.5 z-20">
                        <div className="px-3.5 py-2.5 border-b border-[var(--border-subtle)]">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{session.user?.name}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">@{session.user?.username}</p>
                        </div>
                        <div className="py-1">
                          {[
                            { href: `/profile/${session.user?.username}`, label: 'プロフィール' },
                            { href: '/credits', label: 'クレジット' },
                            { href: '/favorites', label: 'お気に入り' },
                            { href: '/payments', label: '取引履歴' },
                          ].map((item) => (
                            <Link key={item.href} href={item.href}
                              className="block px-3.5 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                              onClick={closeMenu}
                            >{item.label}</Link>
                          ))}
                        </div>
                        <div className="border-t border-[var(--border-subtle)] pt-1">
                          <button
                            onClick={() => { closeMenu(); signOut() }}
                            className="w-full text-left px-3.5 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors"
                          >ログアウト</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="btn btn-ghost btn-sm">ログイン</Link>
                <Link href="/signup" className="btn btn-primary btn-sm">無料で始める</Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="メニュー"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] py-3">
            <nav className="flex flex-col gap-0.5">
              <Link href="/prompts" className={mobileNavLinkClass} onClick={closeMobileMenu}>探索</Link>
              {status === 'authenticated' ? (
                <>
                  <Link href="/create" className={mobileNavLinkClass} onClick={closeMobileMenu}>投稿</Link>
                  <Link href="/dashboard" className={mobileNavLinkClass} onClick={closeMobileMenu}>ダッシュボード</Link>
                  <Link href="/favorites" className={mobileNavLinkClass} onClick={closeMobileMenu}>お気に入り</Link>
                  <Link href="/credits" className={mobileNavLinkClass} onClick={closeMobileMenu}>
                    <span className="flex-1">クレジット</span>
                    <span className="text-[var(--gold)] font-semibold tabular-nums text-sm">◆ {credits !== null ? credits.toLocaleString() : '---'}</span>
                  </Link>
                  <div className="my-1 border-t border-[var(--border-subtle)]" />
                  <button
                    onClick={() => { closeMobileMenu(); signOut() }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--danger)] rounded-lg hover:bg-[var(--danger-muted)] transition-all text-left"
                  >ログアウト</button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link href="/login" className="btn btn-ghost w-full" onClick={closeMobileMenu}>ログイン</Link>
                  <Link href="/signup" className="btn btn-primary w-full" onClick={closeMobileMenu}>無料で始める</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
