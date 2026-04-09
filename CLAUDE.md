# Midburn Budget (UniCamp Budgets)

Budget management app for UniCamp/Midburn camps. Admins manage camps, review expenses, and handle reimbursements. Camp members submit expenses and track their budget.

## Tech Stack

- **Framework:** Next.js 16.2.2 (App Router, Turbopack, Server Actions)
- **Runtime:** React 19, TypeScript 5
- **Database & Auth:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Styling:** Tailwind CSS 4, Shadcn/ui components
- **Package Manager:** pnpm

## Project Structure

```
app/
  (admin)/     — Admin panel (dashboard, expenses, camps, users, reimbursements, settings, analytics)
  (auth)/      — Login, set-password, auth callback
  (camp)/      — Camp member views (dashboard, expenses, new-expense, reimbursement)
lib/
  actions/     — Server actions (users, expenses, camps, reimbursements, settings)
  supabase/    — Supabase clients (server.ts, client.ts, admin.ts)
  types.ts     — All TypeScript interfaces
  utils.ts     — Formatting helpers (currency, dates, status)
  audit.ts     — Audit logging
  email.ts     — Email notifications via Supabase Edge Function + Resend
  export.ts    — Excel export (xlsx)
components/
  ui/          — Shadcn/ui base components
  *.tsx        — Business components (ReceiptUpload, ExpenseDetailDialog, etc.)
supabase/
  migrations/  — SQL schema (001_initial_schema.sql)
  functions/   — Deno Edge Functions (send-notification)
  seed.sql     — Default app settings and categories
proxy.ts       — Middleware for session refresh and auth redirects
```

## Key Concepts

- **Roles:** `admin` (full access) and `camp` (scoped to own camp). Enforced via Supabase RLS.
- **Expense lifecycle:** pending -> approved/rejected. Admins review, comment, approve/reject.
- **Season:** Can be `active` or `closed`. Closing creates reimbursement records per camp.
- **Receipts:** Uploaded to Supabase Storage bucket `receipts`.
- **All data mutations** go through server actions in `lib/actions/`.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
```

## Environment Variables

Required in `.env.local` (and Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Git

- **All commits and pushes must use the email `mrfalach@gmail.com`.** Do not commit or push with any other user/email.

## Conventions

- Language: Hebrew (RTL). UI text is in Hebrew throughout.
- Server actions use `'use server'` directive.
- Supabase clients: use `server.ts` in server actions/components, `client.ts` in client components, `admin.ts` only for user management (service role).
- Components follow Shadcn/ui patterns with `class-variance-authority` and `tailwind-merge`.
- Database changes go through migrations in `supabase/migrations/`.

@AGENTS.md
