# FreeDraw — Setup Guide

## 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and run:

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  elements JSONB NOT NULL DEFAULT '[]',
  app_state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workspaces"
  ON workspaces FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own files"
  ON files FOR ALL
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
```

## 2. Google OAuth

1. In Supabase Dashboard → **Authentication → Providers → Google**, enable Google.
2. Copy the **Callback URL** shown (e.g. `https://xxx.supabase.co/auth/v1/callback`).
3. In [Google Cloud Console](https://console.cloud.google.com):
   - Create an OAuth 2.0 Client ID (Web application).
   - Add the Supabase callback URL to **Authorized redirect URIs**.
   - Add your production domain (e.g. `https://freedraw.vercel.app`) to **Authorized JavaScript origins**.
4. Paste the Google Client ID and Secret back into Supabase → Google provider settings.

## 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values from Supabase Dashboard → **Settings → API**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Run Locally

```bash
npm install --legacy-peer-deps
npm run dev
```

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables.
4. Deploy — `vercel.json` handles SPA routing automatically.
5. In Supabase → **Authentication → URL Configuration**, add your Vercel domain to **Redirect URLs** (e.g. `https://freedraw.vercel.app/home`).
