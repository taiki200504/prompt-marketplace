# PromptMarket 本番環境セットアップガイド

このガイドでは、PromptMarketを本番環境で動作させるために必要な設定をステップバイステップで説明します。

---

## 📋 必要な設定一覧

| 設定項目 | 必須度 | 用途 |
|---------|-------|------|
| NEXTAUTH_SECRET | ⚠️ 必須 | 認証のセキュリティ |
| GEMINI_API_KEY | ⚠️ 必須 | AI改善提案機能 |
| OPENAI_API_KEY | ⚠️ 必須 | プロンプト実行機能 |
| STRIPE設定 | ⚠️ 必須 | 決済機能 |
| Google OAuth | 任意 | Googleログイン |
| GitHub OAuth | 任意 | GitHubログイン |
| PostgreSQL | 本番必須 | 本番データベース |

---

## 1️⃣ NEXTAUTH_SECRET の設定

### なぜ必要？
JWTトークンの署名に使用され、セッションのセキュリティを保護します。

### 設定手順

1. **シークレットを生成**
   
   ターミナルで以下を実行：
   ```bash
   openssl rand -base64 32
   ```
   
   出力例: `K8vQx3mN7pR2sT5wY9aB4cD6eF8gH0jL1nM3oP5qS7u=`

2. **`.env`ファイルに追加**
   ```env
   NEXTAUTH_SECRET="K8vQx3mN7pR2sT5wY9aB4cD6eF8gH0jL1nM3oP5qS7u="
   ```

3. **Vercelの場合**
   - Vercelダッシュボード → Settings → Environment Variables
   - `NEXTAUTH_SECRET` を追加

---

## 2️⃣ Google Gemini API キーの設定

### なぜ必要？
AI改善提案機能（`/api/prompts/[id]/improve`）で使用します。Gemini 2.0 Flash を使用しており、高品質なテキスト生成が可能です。

### 設定手順

1. **Google AI Studio にアクセス**
   
   https://aistudio.google.com/ にアクセス

2. **APIキーを取得**
   - 左側メニュー → "Get API key"
   - "Create API key" をクリック
   - 新しいプロジェクトを作成するか、既存のプロジェクトを選択
   - 生成されたAPIキーをコピー（`AIza...`で始まる文字列）
   
   ⚠️ **注意**: キーは安全な場所に保管してください！

3. **`.env`ファイルに追加**
   ```env
   GEMINI_API_KEY="AIzaSy-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

4. **無料枠と課金**
   - Gemini API は無料枠があります（1分あたり60リクエスト、1日あたり1500リクエスト）
   - 商用利用や大規模利用の場合は Google Cloud の請求設定が必要

### 料金の目安
- Gemini 2.0 Flash: 無料枠あり、超過後は従量課金
- 1回の改善提案: 約$0.0005-0.001（OpenAIより大幅に安価）

---

## 2️⃣-b OpenAI API キーの設定（プロンプト実行用）

### なぜ必要？
プロンプト実行機能（`/api/prompts/[id]/execute`）で使用します。購入したプロンプトを実際にAIで実行する際に必要です。

### 設定手順

1. **OpenAI アカウント作成**
   
   https://platform.openai.com/ にアクセス

2. **APIキーを発行**
   - 右上のアカウントアイコン → "View API keys"
   - "Create new secret key" をクリック
   - キーをコピー（`sk-...`で始まる文字列）
   
   ⚠️ **注意**: キーは一度しか表示されません！

3. **`.env`ファイルに追加**
   ```env
   OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

4. **課金設定**
   - Billing → Add payment method でクレジットカードを登録
   - Usage limits を設定（推奨: $10-50/月）

### 料金の目安
- GPT-4o: $2.50/1M入力トークン、$10.00/1M出力トークン
- プロンプト実行1回: 約$0.01-0.05（プロンプトの長さによる）

---

## 3️⃣ Stripe 設定

### なぜ必要？
クレジットカード決済とサブスクリプション機能に使用します。

### 設定手順

#### Step 1: Stripeアカウント作成

1. https://stripe.com/jp にアクセス
2. "今すぐ始める" をクリック
3. メールアドレスで登録
4. ビジネス情報を入力

#### Step 2: APIキーを取得

1. Stripeダッシュボード → 開発者 → APIキー
2. 以下のキーをコピー：
   - **公開可能キー** (`pk_test_...`)
   - **シークレットキー** (`sk_test_...`)

3. **`.env`ファイルに追加**
   ```env
   STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxx"
   STRIPE_SECRET_KEY="sk_test_xxxxxxxx"
   ```

#### Step 3: Webhookを設定

1. 開発者 → Webhooks → "エンドポイントを追加"
2. エンドポイントURL: `https://あなたのドメイン/api/webhooks/stripe`
3. イベントを選択：
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. "エンドポイントを追加" をクリック
5. 署名シークレット (`whsec_...`) をコピー

6. **`.env`ファイルに追加**
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxx"
   ```

#### Step 4: ローカルでのWebhookテスト

```bash
# Stripe CLIをインストール
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhookをフォワード
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 本番移行時の注意
テスト用キー (`pk_test_`, `sk_test_`) を本番用キー (`pk_live_`, `sk_live_`) に置き換えてください。

---

## 4️⃣ Google OAuth 設定（任意）

### なぜ必要？
「Googleでログイン」ボタンを有効にします。

### 設定手順

#### Step 1: Google Cloud Console

1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを作成（または選択）

#### Step 2: OAuth同意画面を設定

1. APIとサービス → OAuth同意画面
2. ユーザータイプ: 外部
3. アプリ情報を入力：
   - アプリ名: `PromptMarket`
   - サポートメール: あなたのメール
   - デベロッパー連絡先: あなたのメール
4. スコープを追加：
   - `email`
   - `profile`
   - `openid`
5. テストユーザーを追加（テスト中の場合）

#### Step 3: 認証情報を作成

1. APIとサービス → 認証情報
2. "認証情報を作成" → OAuth クライアント ID
3. アプリケーションの種類: ウェブアプリケーション
4. 名前: `PromptMarket Web`
5. 承認済みのリダイレクト URI:
   - 開発: `http://localhost:3000/api/auth/callback/google`
   - 本番: `https://あなたのドメイン/api/auth/callback/google`
6. "作成" をクリック

7. **`.env`ファイルに追加**
   ```env
   GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"
   ```

---

## 5️⃣ GitHub OAuth 設定（任意）

### なぜ必要？
「GitHubでログイン」ボタンを有効にします。

### 設定手順

1. https://github.com/settings/developers にアクセス
2. "New OAuth App" をクリック
3. 情報を入力：
   - Application name: `PromptMarket`
   - Homepage URL: `https://あなたのドメイン`
   - Authorization callback URL: 
     - 開発: `http://localhost:3000/api/auth/callback/github`
     - 本番: `https://あなたのドメイン/api/auth/callback/github`
4. "Register application" をクリック
5. Client secrets → "Generate a new client secret"

6. **`.env`ファイルに追加**
   ```env
   GITHUB_ID="Ov23xxxxxxxxxx"
   GITHUB_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

---

## 6️⃣ PostgreSQL 設定（本番環境）

### なぜ必要？
SQLiteは開発用です。本番環境ではPostgreSQLを使用します。

### 推奨サービス

| サービス | 無料枠 | 特徴 |
|---------|-------|------|
| Supabase | 500MB | Vercelと相性◎ |
| Neon | 3GB | サーバーレス |
| Railway | $5/月 | 簡単セットアップ |

### Supabaseでの設定手順

1. https://supabase.com/ でアカウント作成
2. "New project" をクリック
3. プロジェクト情報を入力
4. Settings → Database → Connection string をコピー

5. **`.env`ファイルを更新**
   ```env
   DATABASE_URL="postgresql://postgres:パスワード@db.xxxxx.supabase.co:5432/postgres"
   ```

6. **Prismaスキーマを更新** (`prisma/schema.prisma`)
   ```prisma
   datasource db {
     provider = "postgresql"  // sqlite → postgresql に変更
     url      = env("DATABASE_URL")
   }
   ```

7. **マイグレーション実行**
   ```bash
   npx prisma migrate deploy
   ```

---

## 7️⃣ Vercelへのデプロイ

### 環境変数の設定

Vercelダッシュボード → Settings → Environment Variables で以下を設定：

| 変数名 | 値 |
|--------|-----|
| DATABASE_URL | PostgreSQL接続文字列 |
| NEXTAUTH_SECRET | 生成したシークレット |
| NEXTAUTH_URL | `https://あなたのドメイン` |
| GEMINI_API_KEY | Gemini APIキー（AI改善提案用） |
| OPENAI_API_KEY | OpenAI APIキー（プロンプト実行用） |
| STRIPE_SECRET_KEY | Stripeシークレットキー |
| STRIPE_WEBHOOK_SECRET | Webhook署名シークレット |
| STRIPE_PUBLISHABLE_KEY | Stripe公開キー |
| GOOGLE_CLIENT_ID | (任意) |
| GOOGLE_CLIENT_SECRET | (任意) |
| GITHUB_ID | (任意) |
| GITHUB_SECRET | (任意) |

### デプロイコマンド

```bash
vercel --prod
```

---

## ✅ 設定確認チェックリスト

- [ ] NEXTAUTH_SECRET を本番用に変更
- [ ] Gemini APIキーを設定（AI改善提案用）
- [ ] OpenAI APIキーを設定（プロンプト実行用）
- [ ] Stripeテストモードで動作確認
- [ ] Stripe Webhookが正常に受信される
- [ ] PostgreSQLに接続できる
- [ ] Google/GitHubログインが動作する（設定した場合）
- [ ] 本番URLでNextAuth callbackが動作する

---

## 🆘 トラブルシューティング

### 「Invalid credentials」エラー
→ NEXTAUTH_SECRETが正しく設定されているか確認

### 「Webhook signature verification failed」
→ STRIPE_WEBHOOK_SECRETが正しいか確認

### 「Gemini API error」
→ Gemini APIキーが有効か確認。Google AI Studioでキーの状態を確認してください

### 「OpenAI API error」
→ OpenAI APIキーが有効か、課金設定が完了しているか確認

### ソーシャルログインが動作しない
→ リダイレクトURIが正しく設定されているか確認

---

ご不明点があれば、Issueでお知らせください！
