# Deployment

Shetu runs on three managed services, all on free plans. Set each up once; after that, pushes to `main` redeploy the web app automatically, and the API redeploys from the Render dashboard (or automatically, if Render is connected to the GitHub repository).

| Component | Service | Live address |
|---|---|---|
| Database | Neon (PostgreSQL) | private connection string |
| API | Render (Docker) | https://shetu-api.onrender.com |
| Web | Vercel (Next.js) | https://shetu-delta.vercel.app |

Keys and connection strings go only into each service's settings. Never commit them and never paste them into chats or issues.

## 1. Database: Neon

1. Sign in at [neon.tech](https://neon.tech) with GitHub and create a project named `shetu` in **AWS Asia Pacific 1 (Singapore)**. Only the Postgres database service is needed.
2. Open **Connect**. Keep branch `production`, database `neondb`, role `neondb_owner` and connection pooling on.
3. Choose **Show password** and copy the full connection string (`postgresql://…?sslmode=require&channel_binding=require`). This becomes `SHETU_DATABASE_URL`.

The schema is created by Alembic when the API starts; nothing needs to be run in Neon.

## 2. API: Render

1. At [render.com](https://render.com) choose **New → Web Service** and select `SpicyFalcon619/shetu-congress` (or paste the public repository URL).
2. Settings:

   | Field | Value |
   |---|---|
   | Name | `shetu-api` |
   | Language | Docker |
   | Branch | `main` |
   | Region | Singapore |
   | Root Directory | `apps/api` |
   | Dockerfile Path | `./Dockerfile` |
   | Instance type | Free |
   | Health Check Path (Advanced) | `/healthz` |

3. Environment variables (exactly these eight; do not paste a local `.env`, which sets `SHETU_ENVIRONMENT=local`):

   ```
   SHETU_DATABASE_URL=<Neon connection string>
   SHETU_CORS_ORIGINS=["https://shetu-delta.vercel.app","http://localhost:3000"]
   SHETU_AI_PROVIDER=groq
   SHETU_AI_FALLBACK=gemini
   SHETU_GROQ_API_KEY=<Groq key>
   SHETU_GROQ_MODEL=qwen/qwen3.8-27b
   SHETU_GEMINI_API_KEY=<Gemini key>
   SHETU_GEMINI_MODEL=gemini-3.5-flash
   ```

4. Deploy. A healthy first start logs `Running upgrade -> …, initial schema`, `seed.inserted` and `startup environment=production provider=groq`.
5. Check https://shetu-api.onrender.com (status page) and `/healthz`.

The free instance sleeps after about 15 minutes without traffic and takes up to a minute to wake. Open the status page a few minutes before testing, presenting or recording.

## 3. Web: Vercel

From the web app folder, with the Vercel CLI:

```powershell
cd apps/web
npx vercel login
npx vercel link            # Create a new project → name "shetu" → connect the Git repository → code directory ./ → do not customize settings
npx vercel env add NEXT_PUBLIC_API_URL production   # value: https://shetu-api.onrender.com
npx vercel --prod
```

The project is linked to the Git repository, so every push to `main` deploys again. The link step writes a local `.env.local` (git-ignored).

## 4. Connect the two

The API only accepts browser requests from origins listed in `SHETU_CORS_ORIGINS`. Whenever the web address changes, update that variable in Render and redeploy.

## Choosing the model

Models are configuration, not code. If a provider retires a model, list what your key can use and update the `*_MODEL` variable:

```bash
cd apps/api
uv run python -c "from shetu_api.config import Settings; from google import genai; s=Settings(); print([m.name for m in genai.Client(api_key=s.gemini_api_key).models.list()])"
```

`SHETU_AI_FALLBACK` lets the API retry on the next provider if the main one is overloaded or down.

## Resetting the demo data

1. In the Neon **SQL Editor**:

   ```sql
   TRUNCATE people, leaves, duties, assignments, availability, transcript_turns,
            change_requests, return_items, audit_events CASCADE;
   ```

2. In Render: **Manual Deploy → Restart service**. The API finds an empty database and reseeds it.

Do this right before recording a demo so every walkthrough starts clean.
