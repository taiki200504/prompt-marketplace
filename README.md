# PromptMarket - AIプロンプト売買マーケットプレイス

高品質なAIプロンプトを売買・共有できるプレミアムマーケットプレイスです。

## 🚀 特徴

- **UGCループ**: 投稿→評価→ランキング→露出→投稿増
- **成果可視化**: 購入者が成果（時間短縮・収益など）を記録
- **Trendingスコア**: 閲覧数・購入数・評価・成果ログをもとにランキング
- **クリエイター還元**: 売上の80%がクリエイターの収益
- **AI改善提案**: Google Gemini 2.0 Flashを使ったプロンプト改善提案
- **PWA対応**: オフライン対応、インストール可能

## 📦 技術スタック

- **フレームワーク**: Next.js 16 (App Router) + TypeScript
- **スタイリング**: TailwindCSS 4
- **データベース**: Prisma + SQLite (開発) / PostgreSQL (本番)
- **認証**: NextAuth.js (Credentials + Google + GitHub)
- **決済**: Stripe
- **AI**: Google Gemini 2.0 Flash (改善提案) / OpenAI (プロンプト実行)
- **バリデーション**: Zod

## ✅ 実装済み機能

### コア機能
- ✅ ユーザー登録・ログイン（メール/パスワード）
- ✅ ソーシャルログイン（Google/GitHub）
- ✅ プロンプトCRUD（作成・閲覧・編集・削除）
- ✅ カテゴリ分類・検索・フィルタ
- ✅ Trendingスコア計算
- ✅ レビュー・星評価システム
- ✅ 成果記録（ResultLog）

### 決済・収益
- ✅ クレジットシステム
- ✅ Stripe連携
- ✅ ウォレット・出金機能
- ✅ 返金機能

### 追加機能
- ✅ 画像アップロード（サムネイル）
- ✅ お気に入り機能
- ✅ 通知システム
- ✅ プロンプトバージョン管理
- ✅ AI改善提案
- ✅ リファラル（友達招待）プログラム
- ✅ クリエイターダッシュボード
- ✅ i18n（日本語/英語）
- ✅ PWA対応

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
cd prompt-market
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下を設定：

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini (AI改善提案機能に必要)
GEMINI_API_KEY="AIzaSy..."

# OpenAI (プロンプト実行機能に必要)
OPENAI_API_KEY="sk-..."

# Stripe (決済機能に必要)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Google OAuth (オプション)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# GitHub OAuth (オプション)
GITHUB_ID="..."
GITHUB_SECRET="..."
```

### 3. データベースの初期化

```bash
npx prisma migrate dev --name init
```

### 4. シードデータの投入

```bash
npm run db:seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 📝 デモアカウント

| Email | Password | 説明 |
|-------|----------|------|
| demo@example.com | password123 | クリエイター |
| dev@example.com | password123 | 開発者 |
| buyer@example.com | password123 | 購入者 |

## 📂 ディレクトリ構成

```
prompt-market/
├── prisma/
│   ├── schema.prisma      # Prismaスキーマ (22モデル)
│   └── seed.ts            # シードデータ
├── public/
│   ├── icons/             # PWAアイコン
│   ├── manifest.json      # PWAマニフェスト
│   └── sw.js              # Service Worker
├── src/
│   ├── app/
│   │   ├── api/           # 30+ APIエンドポイント
│   │   ├── (auth)/        # 認証ページ
│   │   ├── dashboard/     # クリエイターダッシュボード
│   │   ├── prompts/       # プロンプト一覧・詳細
│   │   ├── referral/      # リファラルプログラム
│   │   └── ...
│   ├── components/        # 共通コンポーネント
│   ├── lib/               # ユーティリティ
│   │   └── i18n/          # 多言語対応
│   └── types/             # 型定義
└── package.json
```

## 🔗 API エンドポイント

### 認証
- `POST /api/auth/signup` - ユーザー登録
- `POST /api/auth/[...nextauth]` - NextAuth (Google/GitHub対応)

### プロンプト
- `GET /api/prompts` - 一覧取得
- `POST /api/prompts` - 新規作成
- `GET /api/prompts/[id]` - 詳細取得
- `PUT /api/prompts/[id]` - 更新
- `DELETE /api/prompts/[id]` - 削除
- `POST /api/prompts/[id]/view` - 閲覧数+1
- `POST /api/prompts/[id]/purchase` - 購入
- `POST /api/prompts/[id]/review` - レビュー投稿
- `POST /api/prompts/[id]/result-log` - 成果記録
- `POST /api/prompts/[id]/favorite` - お気に入り
- `GET /api/prompts/[id]/versions` - バージョン履歴
- `POST /api/prompts/[id]/improve` - AI改善提案

### その他
- `GET /api/dashboard` - ダッシュボードデータ
- `GET /api/notifications` - 通知一覧
- `POST /api/referral` - リファラルコード生成
- `POST /api/wallet/payout` - 出金リクエスト

## 📊 Trendingスコア計算

```
score = (views * 0.05) + (purchases * 1.5) + (avgRating * 2) + (resultLogs * 1.2) + (newnessBoost)
newnessBoost = max(0, 7 - daysSincePublished) * 0.5
```

## 🎨 画面一覧

| パス | 説明 |
|------|------|
| `/` | ホーム（Trending/New/Free） |
| `/prompts` | 探索一覧 |
| `/prompts/[id]` | 詳細（購入・レビュー・AI改善） |
| `/create` | 投稿作成 |
| `/edit/[id]` | 投稿編集 |
| `/profile/[username]` | プロフィール |
| `/dashboard` | クリエイターダッシュボード |
| `/referral` | 友達招待 |
| `/favorites` | お気に入り |
| `/credits` | クレジット管理 |
| `/login` | ログイン |
| `/signup` | 新規登録 |
| `/offline` | オフラインページ |

## 📜 ライセンス

MIT

---

Built with ❤️ for Orynth
