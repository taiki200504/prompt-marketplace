'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, translations } from './translations'

// 翻訳オブジェクトの構造型（string値を持つ）
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepStringify<T[K]> : string
}

type TranslationsType = DeepStringify<typeof translations.ja>

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationsType
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LOCALE_KEY = 'promptmarket_locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ja')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null
    if (savedLocale && (savedLocale === 'ja' || savedLocale === 'en')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(savedLocale)
    } else {
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'en') {
        setLocaleState('en')
      }
    }
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_KEY, newLocale)
    // html要素のlang属性を更新
    document.documentElement.lang = newLocale
  }

  const t = translations[locale] as TranslationsType

  // SSRとの不整合を防ぐため、マウント前はデフォルトロケールを使用
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: 'ja', setLocale, t: translations.ja as TranslationsType }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// 便利なフック: 翻訳のみ取得
export function useTranslations() {
  const { t } = useI18n()
  return t
}

// 便利なフック: ロケール切り替え
export function useLocale() {
  const { locale, setLocale } = useI18n()
  return { locale, setLocale }
}
