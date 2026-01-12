# 📚 API リファレンス

このドキュメントでは、AI Prompt Marketplaceで新しく追加されたAPIエンドポイントの仕様を説明します。

---

## 目次

1. [プロンプト実行](#プロンプト実行)
2. [決済・購入](#決済購入)
3. [返金](#返金)
4. [ウォレット](#ウォレット)
5. [出金](#出金)
6. [リファラル](#リファラル)
7. [オンボーディング](#オンボーディング)
8. [成果記録](#成果記録)

---

## プロンプト実行

### POST `/api/prompts/[id]/execute`

プロンプトを実行してAIからの応答を取得します。

**認証**: 必須

**リクエストボディ**:
```json
{
  "variables": {
    "topic": "AIについて",
    "tone": "フォーマル"
  },
  "model": "gpt-4o-mini",
  "stream": false
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `variables` | `object` | ✓ | プロンプトの変数と値 |
| `model` | `string` | | 使用モデル（デフォルト: `gpt-4o-mini`） |
| `stream` | `boolean` | | ストリーミング応答（デフォルト: `false`） |

**使用可能モデル**:
- `gpt-4o` - 最高性能（50クレジット/回）
- `gpt-4o-mini` - バランス（10クレジット/回）
- `gpt-3.5-turbo` - 高速（5クレジット/回）

**レスポンス（通常）**:
```json
{
  "output": "AIからの応答テキスト...",
  "tokensUsed": 245,
  "latencyMs": 1523,
  "creditsUsed": 10,
  "remainingCredits": 990,
  "remainingExecutions": 49
}
```

**レスポンス（ストリーミング）**:
```
Content-Type: text/event-stream

data: {"text": "AI"}
data: {"text": "から"}
data: {"text": "の応答..."}
data: [DONE]
```

**エラーレスポンス**:
```json
{
  "error": "本日の実行上限（50回）に達しました",
  "remainingExecutions": 0
}
```

### GET `/api/prompts/[id]/execute`

プロンプトの実行履歴を取得します。

**クエリパラメータ**:
- `limit`: 取得件数（デフォルト: 10）

**レスポンス**:
```json
[
  {
    "id": "clxxx...",
    "createdAt": "2026-01-11T12:00:00.000Z",
    "model": "gpt-4o-mini",
    "tokensUsed": 245,
    "latencyMs": 1523,
    "costCredits": 10
  }
]
```

---

## 決済・購入

### POST `/api/checkout`

プロンプトの購入処理を開始します。

**認証**: 必須

**リクエストボディ**:
```json
{
  "promptId": "clxxx...",
  "provider": "credits"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `promptId` | `string` | ✓ | 購入するプロンプトのID |
| `provider` | `string` | | 決済方法（`credits`, `stripe`, `orynth`） |

**レスポンス（クレジット決済）**:
```json
{
  "message": "購入が完了しました",
  "purchaseId": "clxxx..."
}
```

**レスポンス（Stripe決済）**:
```json
{
  "redirectUrl": "https://checkout.stripe.com/..."
}
```

---

## 返金

### GET `/api/purchases/[id]/refund`

返金可否を確認します。

**認証**: 必須

**レスポンス**:
```json
{
  "refundable": true,
  "daysRemaining": 5,
  "amount": 500,
  "status": "completed",
  "message": "あと5日以内に返金可能です"
}
```

### POST `/api/purchases/[id]/refund`

返金をリクエストします。

**認証**: 必須

**リクエストボディ**:
```json
{
  "reason": "期待した内容と異なったため"
}
```

**レスポンス**:
```json
{
  "message": "返金が完了しました",
  "refundedAmount": 500
}
```

---

## ウォレット

### GET `/api/wallet`

ウォレット情報を取得します。

**認証**: 必須

**レスポンス**:
```json
{
  "balance": 5000,
  "pendingBalance": 1000,
  "totalEarned": 15000,
  "totalWithdrawn": 10000,
  "credits": 850,
  "withdrawableAmount": 4750,
  "canWithdraw": true,
  "minimumWithdrawal": 1000,
  "transferFee": 250,
  "orynthConnected": false,
  "recentTransactions": [
    {
      "id": "clxxx...",
      "createdAt": "2026-01-11T12:00:00.000Z",
      "type": "purchase_revenue",
      "amount": 400,
      "description": "プロンプト「SEO記事生成」の売上"
    }
  ],
  "recentPayouts": []
}
```

### POST `/api/wallet`

取引履歴を取得します（ページネーション対応）。

**認証**: 必須

**リクエストボディ**:
```json
{
  "cursor": "clxxx...",
  "limit": 20,
  "type": "purchase_revenue"
}
```

**レスポンス**:
```json
{
  "transactions": [...],
  "hasMore": true,
  "nextCursor": "clyyy..."
}
```

---

## 出金

### GET `/api/wallet/payout`

出金履歴を取得します。

**認証**: 必須

**クエリパラメータ**:
- `limit`: 取得件数
- `status`: ステータスでフィルタ（`pending`, `processing`, `completed`, `failed`）

**レスポンス**:
```json
{
  "payouts": [
    {
      "id": "clxxx...",
      "createdAt": "2026-01-11T12:00:00.000Z",
      "status": "completed",
      "amount": 5000,
      "fee": 250,
      "netAmount": 4750,
      "bankName": "三菱UFJ銀行"
    }
  ]
}
```

### POST `/api/wallet/payout`

出金リクエストを作成します。

**認証**: 必須

**リクエストボディ**:
```json
{
  "amount": 5000,
  "bankName": "三菱UFJ銀行",
  "branchName": "渋谷支店",
  "accountType": "普通",
  "accountNumber": "1234567",
  "accountHolder": "ヤマダ タロウ"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `amount` | `number` | ✓ | 出金額（最低1,000円） |
| `bankName` | `string` | ✓ | 銀行名 |
| `branchName` | `string` | ✓ | 支店名 |
| `accountType` | `string` | ✓ | 口座種別（`普通` または `当座`） |
| `accountNumber` | `string` | ✓ | 口座番号（7桁） |
| `accountHolder` | `string` | ✓ | 口座名義（カタカナ） |

**レスポンス**:
```json
{
  "message": "出金リクエストを受け付けました",
  "payoutId": "clxxx...",
  "amount": 5000,
  "fee": 250,
  "netAmount": 4750,
  "estimatedProcessingDays": 5
}
```

### DELETE `/api/wallet/payout`

保留中の出金リクエストをキャンセルします。

**認証**: 必須

**リクエストボディ**:
```json
{
  "payoutId": "clxxx..."
}
```

---

## リファラル

### GET `/api/referral`

自分の紹介コードと統計を取得します。

**認証**: 必須

**レスポンス**:
```json
{
  "code": "ABC12345",
  "totalSignups": 12,
  "totalRewards": 6000,
  "currentTier": {
    "title": "アンバサダー",
    "rewardPerReferral": 600
  },
  "nextTier": {
    "title": "インフルエンサー",
    "minReferrals": 20,
    "rewardPerReferral": 800
  },
  "remainingForNextTier": 8,
  "ongoingRevenueShare": "5%",
  "referredUsers": [
    {
      "id": "clxxx...",
      "username": "user123",
      "displayName": "ユーザー123",
      "createdAt": "2026-01-10T12:00:00.000Z",
      "rewardStatus": "paid",
      "rewardAmount": 600
    }
  ],
  "shareUrl": "https://example.com/signup?ref=ABC12345"
}
```

### POST `/api/referral`

紹介コードの有効性を確認します。

**リクエストボディ**:
```json
{
  "code": "ABC12345"
}
```

**レスポンス**:
```json
{
  "valid": true,
  "referrer": {
    "username": "creator1",
    "displayName": "クリエイター1"
  }
}
```

---

## オンボーディング

### GET `/api/user/onboarding`

オンボーディング進捗を取得します。

**認証**: 必須

**レスポンス**:
```json
{
  "userType": "buyer",
  "steps": [
    { "id": "profile", "label": "プロフィールを設定", "icon": "👤", "completed": true },
    { "id": "view", "label": "プロンプトを見てみる", "icon": "👀", "completed": true },
    { "id": "try", "label": "プロンプトを試す", "icon": "🧪", "completed": false },
    { "id": "purchase", "label": "プロンプトを購入/取得", "icon": "🛒", "completed": false },
    { "id": "review", "label": "レビューを書く", "icon": "⭐", "completed": false },
    { "id": "result", "label": "成果を記録", "icon": "📊", "completed": false }
  ],
  "progress": 33,
  "completedCount": 2,
  "totalSteps": 6,
  "showTour": false,
  "isComplete": false,
  "nextStep": { "id": "try", "label": "プロンプトを試す", "icon": "🧪" }
}
```

### PATCH `/api/user/onboarding`

オンボーディング進捗を更新します。

**認証**: 必須

**リクエストボディ**:
```json
{
  "step": "profile",
  "userType": "creator",
  "tourShown": true
}
```

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `step` | `string` | 完了したステップID |
| `userType` | `string` | ユーザータイプ（`creator`, `buyer`, `both`） |
| `tourShown` | `boolean` | ツアー表示済みフラグ |

---

## 成果記録

### POST `/api/prompts/[id]/result-log`

成果を記録します。

**認証**: 必須（購入者または無料プロンプトの利用者）

**リクエストボディ**:
```json
{
  "metricType": "time_saved",
  "metricValue": 30,
  "metricUnit": "min",
  "note": "記事作成時間が大幅に短縮された"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `metricType` | `string` | ✓ | 成果タイプ（`time_saved`, `revenue`, `quality`, `other`） |
| `metricValue` | `number` | ✓ | 成果の数値 |
| `metricUnit` | `string` | ✓ | 単位（`min`, `JPY`, `%`, `score`, `other`） |
| `note` | `string` | | メモ（500文字まで） |

**レスポンス**:
```json
{
  "id": "clxxx...",
  "metricType": "time_saved",
  "metricValue": 30,
  "metricUnit": "min",
  "note": "記事作成時間が大幅に短縮された",
  "isFlagged": false,
  "createdAt": "2026-01-11T12:00:00.000Z",
  "warning": null,
  "anomalyWarning": null
}
```

### GET `/api/prompts/[id]/result-log`

プロンプトの成果記録一覧を取得します。

**クエリパラメータ**:
- `limit`: 取得件数（デフォルト: 50）
- `includeFlags`: フラグ付きも含める（デフォルト: `false`）

**レスポンス**:
```json
{
  "logs": [
    {
      "id": "clxxx...",
      "metricType": "time_saved",
      "metricValue": 30,
      "metricUnit": "min",
      "note": "...",
      "createdAt": "2026-01-11T12:00:00.000Z",
      "user": {
        "username": "user123",
        "displayName": "ユーザー123"
      }
    }
  ],
  "summary": [
    {
      "metricType": "time_saved",
      "count": 15,
      "total": 450,
      "average": 30
    }
  ],
  "totalCount": 15
}
```

---

## エラーコード

| HTTPステータス | 説明 |
|--------------|------|
| `400` | リクエストが不正 |
| `401` | 認証が必要 |
| `402` | クレジット不足 |
| `403` | アクセス権限がない |
| `404` | リソースが見つからない |
| `429` | レート制限超過 |
| `500` | サーバーエラー |
| `503` | サービス一時停止（コスト上限など） |

---

最終更新: 2026年1月11日

