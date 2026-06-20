# CrushCode Setup Guide

Everything can run on free tiers. Follow these steps in order.

---

## Step 1 - Supabase

1. Go to https://supabase.com and create a free account.
2. Create a new project.
3. Go to **SQL Editor**, paste the contents of `supabase_schema.sql`, and click Run.
4. Go to **Settings > API** and copy:
   - Project URL to `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key to `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 - AI Providers

The app tries providers in this order:

1. Gemini 2.5 Flash-Lite
2. Groq
3. OpenRouter free models

Create API keys for the providers you want enabled and add them to `.env.local`:

```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite

GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant

OPENROUTER_API_KEY=...
OPENROUTER_MODEL=qwen/qwen3-8b:free
```

Gemini is the primary provider. Groq and OpenRouter are fallbacks, so the site keeps working if Gemini hits quota or has a temporary outage.

---

## Step 3 - Brevo

1. Go to https://brevo.com and create a free account.
2. Go to **SMTP & API > API Keys** and create a key.
3. Copy it to `BREVO_API_KEY`.
4. Set `BREVO_SENDER_EMAIL` to your sender email.

---

## Step 4 - Run Locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

---

## Step 5 - Deploy On Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com and import the repo.
3. Add all environment variables from `.env.local` in the Vercel dashboard.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL, for example `https://crushcode.vercel.app`.
5. Deploy.

---

## How It Works

| Page | What it does |
|------|-------------|
| `/` | Create a link or enter a code |
| `/host` | The host fills in their info and gets a link |
| `/session/[code]` | The guest opens the link and chats with the AI |

The AI runs a short conversation, scores the replies, and emails the host when done.
