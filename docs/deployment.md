# Deployment

Three managed services, all with free tiers. One person sets each up once; afterwards every push to `main` deploys automatically.

## 1. Database: Neon

1. Create a project at neon.tech (region: Singapore).
2. Copy the connection string (`postgresql://...`). This is `SHETU_DATABASE_URL`.

## 2. API: Render

1. At render.com, choose **New → Blueprint** and select this repository. Render reads `render.yaml`.
2. Fill the secret values:
   - `SHETU_DATABASE_URL`: the Neon string
   - `SHETU_CORS_ORIGINS`: `["https://<your-vercel-domain>"]`
   - `SHETU_GEMINI_API_KEY`: from Google AI Studio (or set `SHETU_AI_PROVIDER=anthropic` and `SHETU_ANTHROPIC_API_KEY`)
3. Deploy. On start the container runs `alembic upgrade head`, seeds the synthetic data if the database is empty, and serves on `/`. Check `https://<api>/healthz`.

The free instance sleeps after inactivity and takes about a minute to wake. Open `/healthz` a few minutes before any live demo or recording.

## 3. Web: Vercel

1. At vercel.com, import this repository and set **Root Directory** to `apps/web`.
2. Add the environment variable `NEXT_PUBLIC_API_URL=https://<api>.onrender.com`.
3. Deploy, then put the Vercel domain into the API's `SHETU_CORS_ORIGINS`.

## Choosing the model

`SHETU_GEMINI_MODEL` defaults to `gemini-2.5-flash`. Confirm the model is still offered in Google AI Studio before the demo, and change the variable if not; no code change is needed.

## Resetting the demo

Delete all rows (or drop and recreate the Neon branch) and restart the API. It reseeds on startup.
