#!/bin/bash

# Supabaseデータベース設定スクリプト
# 使用方法: ./setup-supabase.sh "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

if [ -z "$1" ]; then
  echo "❌ エラー: SupabaseのDATABASE_URLを引数として指定してください"
  echo ""
  echo "使用方法:"
  echo "  ./setup-supabase.sh \"postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres\""
  echo ""
  echo "Supabaseの接続文字列の取得方法:"
  echo "  1. Supabaseダッシュボードにログイン"
  echo "  2. プロジェクトを選択"
  echo "  3. Settings → Database → Connection string → URI をコピー"
  exit 1
fi

export DATABASE_URL="$1"

# .env.localファイルを作成（永続的な設定のため）
echo "📝 .env.localファイルを作成中..."
echo "DATABASE_URL=\"$1\"" > .env.local
echo "✅ .env.localファイルを作成しました"

echo ""
echo "🔧 Prisma Clientを生成中..."
npx prisma generate

echo ""
echo "📦 データベーススキーマを適用中..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ 完了！Supabaseデータベースの設定が完了しました。"
echo ""
echo "📋 次のステップ:"
echo "   1. シードデータを投入する場合: npm run db:seed"
echo "   2. データベースの状態を確認: npx prisma studio"
echo ""
echo "⚠️  注意: .env.localファイルが作成されました。"
echo "   次回からは環境変数を設定する必要はありません。"
echo "   本番環境（Vercel）では、環境変数としてDATABASE_URLが自動的に設定されます。"
