# Claude Code - Prompt Marketplace

## Project Overview
Next.js 16 (App Router) + Prisma + Supabase PostgreSQL marketplace for AI prompts.

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build (runs `prisma generate && next build`)
- `npx next lint` - Run ESLint
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio (DB GUI)

## Architecture
- `src/app/` - App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities (auth.ts, prisma.ts, validations.ts, errors.ts)
- `prisma/schema.prisma` - Database schema (22 models)

## Deployment
- **Vercel** deploys automatically from `main` branch
- Push to `claude/*` branches → GitHub Actions auto-merge workflow runs → merges to `main` → Vercel deploys
- Direct push to `main` is blocked (branch protection)

## Environment Setup for Automation
For Claude Code to fully automate (deploy, DB, PRs), these tokens must be set:

### Required
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth encryption key

### For CLI Automation
- `GH_TOKEN` - GitHub PAT (repo scope) → enables `gh pr create/merge`
- `VERCEL_TOKEN` - Vercel token → enables `vercel deploy --prod`
- `SUPABASE_ACCESS_TOKEN` - Supabase token → enables `supabase db push`

## Database
- Provider: Supabase (PostgreSQL)
- If DB is paused (free tier inactivity), restore at https://supabase.com/dashboard
- Connection pooling: use port 6543 for serverless, 5432 for direct

## Key Patterns
- `Date.now()` is forbidden in server components (use `new Date().getTime()`)
- ESLint `react-hooks/set-state-in-effect` needs inline disable comments
- All DB operations should have try-catch for connection resilience
- Google Fonts blocked in CI - use system font stack
