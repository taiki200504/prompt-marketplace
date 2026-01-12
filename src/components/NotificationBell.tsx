'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return

    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    fetchNotifications()
    // 30秒ごとにポーリング
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return '💰'
      case 'purchase':
        return '🛒'
      case 'review':
        return '⭐'
      case 'result_log':
        return '📊'
      case 'achievement':
        return '🏆'
      default:
        return '🔔'
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'たった今'
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  if (!session?.user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="通知"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-medium text-[var(--text-primary)]">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                すべて既読にする
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-[var(--text-secondary)]">
                読み込み中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-[var(--text-secondary)]">
                  通知はありません
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id)
                          }
                          setIsOpen(false)
                        }}
                        className={`block px-4 py-3 hover:bg-[var(--card-hover)] transition-colors ${
                          !notification.isRead ? 'bg-[var(--accent)]/5' : ''
                        }`}
                      >
                        <NotificationContent
                          notification={notification}
                          getTypeIcon={getTypeIcon}
                          formatTime={formatTime}
                        />
                      </Link>
                    ) : (
                      <div
                        className={`px-4 py-3 ${
                          !notification.isRead ? 'bg-[var(--accent)]/5' : ''
                        }`}
                      >
                        <NotificationContent
                          notification={notification}
                          getTypeIcon={getTypeIcon}
                          formatTime={formatTime}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-[var(--border)]">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                すべての通知を見る →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationContent({
  notification,
  getTypeIcon,
  formatTime,
}: {
  notification: Notification
  getTypeIcon: (type: string) => string
  formatTime: (dateStr: string) => string
}) {
  return (
    <div className="flex gap-3">
      <span className="text-xl flex-shrink-0">
        {getTypeIcon(notification.type)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium ${
              notification.isRead
                ? 'text-[var(--text-secondary)]'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-[var(--accent)] rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {formatTime(notification.createdAt)}
        </p>
      </div>
    </div>
  )
}
