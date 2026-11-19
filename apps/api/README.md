# Shetu API

FastAPI service for Shetu. It runs the AI tasks behind one gateway, enforces the nine rules in plain Python, and stores everything in PostgreSQL (SQLite locally).

## Run locally

```bash
uv sync
cp .env.example .env          # set SHETU_AI_PROVIDER and a key, or keep "replay"
uv run uvicorn shetu_api.main:app --reload --port 8000
```

- OpenAPI docs: http://localhost:8000/docs
- Health: http://localhost:8000/healthz

## Checks

```bash
uv run ruff check . && uv run ruff format --check .
uv run mypy
uv run pytest --cov=shetu_api
```

## Layout

| Path | What it holds |
|---|---|
| `src/shetu_api/domain/rules.py` | R1 to R8 as pure functions. No database, network or model calls |
| `src/shetu_api/ai/gateway.py` | The only module that calls a model: Gemini, Claude, replay and recording providers |
| `src/shetu_api/ai/prompts/` | The prompt library, one file per AI role |
| `src/shetu_api/ai/schemas.py` | Typed outputs; replies that do not validate are rejected and retried once |
| `src/shetu_api/services.py` | Use cases: load, call the AI, run the rules, save |
| `src/shetu_api/routes.py` | HTTP routes and permission checks (R9) |
| `src/shetu_api/seed.py` | Synthetic demo data |
| `migrations/` | Alembic migrations for production |
| `fixtures/replay/` | Recorded AI replies used by tests and offline work |

## Recording real replies

Set `SHETU_AI_PROVIDER=gemini` (or `anthropic`), `SHETU_AI_RECORD=true`, then use the app. Each reply is saved under `fixtures/replay/<task>/<hash>.json`, and replay mode will serve it for the same prompt.
