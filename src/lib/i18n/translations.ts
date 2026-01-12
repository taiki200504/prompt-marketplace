export type Locale = 'ja' | 'en'

export const translations = {
  ja: {
    // Common
    common: {
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      create: '作成',
      search: '検索',
      filter: 'フィルター',
      sort: '並び替え',
      close: '閉じる',
      confirm: '確認',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      submit: '送信',
      required: '必須',
      optional: '任意',
    },

    // Navigation
    nav: {
      home: 'ホーム',
      explore: '探索',
      create: '投稿',
      dashboard: 'ダッシュボード',
      favorites: 'お気に入り',
      credits: 'クレジット',
      profile: 'プロフィール',
      login: 'ログイン',
      signup: '新規登録',
      logout: 'ログアウト',
    },

    // Home
    home: {
      title: 'プレミアムAIプロンプトマーケットプレイス',
      subtitle: '高品質なプロンプトを発見し、共有し、収益化',
      trending: 'トレンド',
      new: '新着',
      free: '無料',
      viewAll: 'すべて見る',
    },

    // Prompts
    prompts: {
      title: 'プロンプトを探す',
      searchPlaceholder: 'キーワードで検索...',
      noResults: '該当するプロンプトが見つかりません',
      categories: {
        all: 'すべて',
        marketing: 'マーケティング',
        dev: '開発',
        design: 'デザイン',
        career: 'キャリア',
        study: '学習',
        fun: '趣味',
        other: 'その他',
      },
      sortOptions: {
        trending: '人気順',
        newest: '新着順',
        rating: '評価順',
        price_asc: '価格が安い順',
        price_desc: '価格が高い順',
      },
      detail: {
        prompt: 'プロンプト',
        usage: '使い方',
        examples: '入出力例',
        input: '入力',
        output: '出力',
        reviews: 'レビュー',
        results: '成果レポート',
        purchase: '購入する',
        purchased: '購入済み',
        free: '無料',
        writeReview: 'レビューを書く',
        logResult: '成果を記録',
        views: '閲覧',
        sales: '販売',
        version: 'バージョン',
        versionHistory: 'バージョン履歴',
        aiImprove: 'AI改善提案',
      },
    },

    // Create/Edit
    editor: {
      createTitle: '新しいプロンプトを作成',
      editTitle: 'プロンプトを編集',
      titleLabel: 'タイトル',
      titlePlaceholder: 'キャッチーなタイトル',
      descriptionLabel: '説明',
      descriptionPlaceholder: 'プロンプトの概要を短く',
      categoryLabel: 'カテゴリ',
      promptLabel: 'プロンプト本文',
      promptPlaceholder: 'AIに与えるプロンプトを入力...',
      usageLabel: '使い方',
      usagePlaceholder: '使用手順や注意点...',
      exampleInputLabel: '入力例',
      exampleOutputLabel: '出力例',
      priceLabel: '価格',
      tagsLabel: 'タグ',
      tagsPlaceholder: 'カンマ区切り',
      publish: '公開する',
      saveDraft: '下書き保存',
      changeLog: '変更内容',
      changeLogPlaceholder: '今回の変更内容...',
    },

    // Dashboard
    dashboard: {
      title: 'クリエイターダッシュボード',
      totalViews: '総閲覧数',
      totalSales: '総販売数',
      totalRevenue: '総収益',
      avgRating: '平均評価',
      publishedPrompts: '公開プロンプト',
      totalReviews: 'レビュー数',
      resultLogs: '成果報告数',
      cvr: 'CVR',
      period: {
        '7d': '過去7日間',
        '30d': '過去30日間',
        '90d': '過去90日間',
      },
      performance: 'パフォーマンス推移',
      promptPerformance: 'プロンプト別パフォーマンス',
      noPrompts: 'まだプロンプトがありません',
      createFirst: '最初のプロンプトを作成',
      status: {
        published: '公開中',
        draft: '下書き',
      },
    },

    // Auth
    auth: {
      loginTitle: 'ログイン',
      signupTitle: '新規登録',
      email: 'メールアドレス',
      password: 'パスワード',
      username: 'ユーザー名',
      rememberMe: 'ログイン状態を保持',
      forgotPassword: 'パスワードを忘れた方',
      noAccount: 'アカウントをお持ちでない方',
      hasAccount: 'すでにアカウントをお持ちの方',
      loginButton: 'ログイン',
      signupButton: '登録する',
      loginWithGoogle: 'Googleでログイン',
      loginWithGithub: 'GitHubでログイン',
    },

    // Profile
    profile: {
      prompts: 'プロンプト',
      reviews: 'レビュー',
      estimatedRevenue: '推定収益',
      noPrompts: 'まだプロンプトを公開していません',
    },

    // Review
    review: {
      rating: '評価',
      comment: 'コメント',
      commentPlaceholder: 'このプロンプトの感想...',
      submit: '投稿',
      noReviews: 'まだレビューはありません',
    },

    // Result Log
    resultLog: {
      title: '成果を記録',
      metricType: '指標',
      metricTypes: {
        time_saved: '時間短縮',
        revenue: '収益',
        quality: '品質向上',
        other: 'その他',
      },
      value: '数値',
      unit: '単位',
      units: {
        min: '分',
        JPY: '円',
        percent: '%',
        score: 'スコア',
        other: 'その他',
      },
      note: 'メモ',
      reported: '件の成果が報告されています',
      average: '平均',
    },

    // Footer
    footer: {
      explore: '探索',
      allPrompts: 'すべてのプロンプト',
      trending: 'トレンド',
      freePrompts: '無料プロンプト',
      support: 'サポート',
      postPrompt: 'プロンプトを投稿',
      helpCenter: 'ヘルプセンター',
      terms: '利用規約',
      tagline: 'プロフェッショナルのためのAIプロンプトマーケットプレイス。高品質なプロンプトを発見し、共有し、収益化。',
      copyright: '© 2026 PromptMarket. All rights reserved.',
      madeIn: 'Made with precision in Japan 🇯🇵',
    },

    // Messages
    messages: {
      purchaseSuccess: '購入が完了しました！',
      purchaseFailed: '購入に失敗しました',
      reviewSuccess: 'レビューを投稿しました',
      reviewFailed: 'レビューの投稿に失敗しました',
      resultSuccess: '成果を記録しました',
      resultFailed: '成果の記録に失敗しました',
      saveSuccess: '保存しました',
      saveFailed: '保存に失敗しました',
      deleteSuccess: '削除しました',
      deleteFailed: '削除に失敗しました',
      favoriteAdded: 'お気に入りに追加しました',
      favoriteRemoved: 'お気に入りから削除しました',
      loginRequired: 'ログインが必要です',
      unauthorized: '権限がありません',
    },
  },

  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      required: 'Required',
      optional: 'Optional',
    },

    // Navigation
    nav: {
      home: 'Home',
      explore: 'Explore',
      create: 'Create',
      dashboard: 'Dashboard',
      favorites: 'Favorites',
      credits: 'Credits',
      profile: 'Profile',
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
    },

    // Home
    home: {
      title: 'Premium AI Prompt Marketplace',
      subtitle: 'Discover, share, and monetize quality prompts',
      trending: 'Trending',
      new: 'New',
      free: 'Free',
      viewAll: 'View All',
    },

    // Prompts
    prompts: {
      title: 'Explore Prompts',
      searchPlaceholder: 'Search by keyword...',
      noResults: 'No prompts found',
      categories: {
        all: 'All',
        marketing: 'Marketing',
        dev: 'Development',
        design: 'Design',
        career: 'Career',
        study: 'Study',
        fun: 'Fun',
        other: 'Other',
      },
      sortOptions: {
        trending: 'Trending',
        newest: 'Newest',
        rating: 'Top Rated',
        price_asc: 'Price: Low to High',
        price_desc: 'Price: High to Low',
      },
      detail: {
        prompt: 'Prompt',
        usage: 'How to Use',
        examples: 'Examples',
        input: 'Input',
        output: 'Output',
        reviews: 'Reviews',
        results: 'Results Report',
        purchase: 'Purchase',
        purchased: 'Purchased',
        free: 'Free',
        writeReview: 'Write Review',
        logResult: 'Log Result',
        views: 'views',
        sales: 'sales',
        version: 'Version',
        versionHistory: 'Version History',
        aiImprove: 'AI Suggestions',
      },
    },

    // Create/Edit
    editor: {
      createTitle: 'Create New Prompt',
      editTitle: 'Edit Prompt',
      titleLabel: 'Title',
      titlePlaceholder: 'Catchy title',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Brief description of your prompt',
      categoryLabel: 'Category',
      promptLabel: 'Prompt Body',
      promptPlaceholder: 'Enter your prompt for AI...',
      usageLabel: 'Usage Guide',
      usagePlaceholder: 'Instructions and tips...',
      exampleInputLabel: 'Example Input',
      exampleOutputLabel: 'Example Output',
      priceLabel: 'Price',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Comma-separated',
      publish: 'Publish',
      saveDraft: 'Save Draft',
      changeLog: 'Change Log',
      changeLogPlaceholder: 'What changed in this version...',
    },

    // Dashboard
    dashboard: {
      title: 'Creator Dashboard',
      totalViews: 'Total Views',
      totalSales: 'Total Sales',
      totalRevenue: 'Total Revenue',
      avgRating: 'Avg. Rating',
      publishedPrompts: 'Published Prompts',
      totalReviews: 'Reviews',
      resultLogs: 'Result Logs',
      cvr: 'CVR',
      period: {
        '7d': 'Last 7 days',
        '30d': 'Last 30 days',
        '90d': 'Last 90 days',
      },
      performance: 'Performance Trend',
      promptPerformance: 'Prompt Performance',
      noPrompts: 'No prompts yet',
      createFirst: 'Create your first prompt',
      status: {
        published: 'Published',
        draft: 'Draft',
      },
    },

    // Auth
    auth: {
      loginTitle: 'Login',
      signupTitle: 'Sign Up',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginButton: 'Login',
      signupButton: 'Sign Up',
      loginWithGoogle: 'Login with Google',
      loginWithGithub: 'Login with GitHub',
    },

    // Profile
    profile: {
      prompts: 'Prompts',
      reviews: 'Reviews',
      estimatedRevenue: 'Est. Revenue',
      noPrompts: 'No prompts published yet',
    },

    // Review
    review: {
      rating: 'Rating',
      comment: 'Comment',
      commentPlaceholder: 'Share your thoughts...',
      submit: 'Submit',
      noReviews: 'No reviews yet',
    },

    // Result Log
    resultLog: {
      title: 'Log Result',
      metricType: 'Metric',
      metricTypes: {
        time_saved: 'Time Saved',
        revenue: 'Revenue',
        quality: 'Quality Improvement',
        other: 'Other',
      },
      value: 'Value',
      unit: 'Unit',
      units: {
        min: 'minutes',
        JPY: 'JPY',
        percent: '%',
        score: 'score',
        other: 'other',
      },
      note: 'Note',
      reported: 'results reported',
      average: 'avg.',
    },

    // Footer
    footer: {
      explore: 'Explore',
      allPrompts: 'All Prompts',
      trending: 'Trending',
      freePrompts: 'Free Prompts',
      support: 'Support',
      postPrompt: 'Post a Prompt',
      helpCenter: 'Help Center',
      terms: 'Terms of Service',
      tagline: 'Premium AI prompt marketplace for professionals. Discover, share, and monetize quality prompts.',
      copyright: '© 2026 PromptMarket. All rights reserved.',
      madeIn: 'Made with precision in Japan 🇯🇵',
    },

    // Messages
    messages: {
      purchaseSuccess: 'Purchase completed!',
      purchaseFailed: 'Purchase failed',
      reviewSuccess: 'Review submitted',
      reviewFailed: 'Failed to submit review',
      resultSuccess: 'Result logged',
      resultFailed: 'Failed to log result',
      saveSuccess: 'Saved successfully',
      saveFailed: 'Failed to save',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Failed to delete',
      favoriteAdded: 'Added to favorites',
      favoriteRemoved: 'Removed from favorites',
      loginRequired: 'Login required',
      unauthorized: 'Unauthorized',
    },
  },
} as const

export type TranslationKey = keyof typeof translations.ja
