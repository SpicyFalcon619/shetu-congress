.PHONY: setup api web dev check api-check web-check api-types db-up db-down

setup:            ## Install API and web dependencies
	cd apps/api && uv sync
	cd apps/web && pnpm install

api:              ## Run the API on :8000 with reload
	cd apps/api && uv run uvicorn shetu_api.main:app --reload --port 8000

web:              ## Run the web app on :3000
	cd apps/web && pnpm dev

check: api-check web-check  ## Everything CI runs

api-check:
	cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run mypy && uv run pytest

web-check:
	cd apps/web && pnpm exec prettier --check src && pnpm lint && pnpm exec tsc --noEmit && pnpm build

api-types:        ## Regenerate the web client types from the API's OpenAPI spec
	cd apps/api && uv run python -c "import json; from shetu_api.main import app; print(json.dumps(app.openapi(), indent=1))" > ../web/openapi.json
	cd apps/web && pnpm exec openapi-typescript openapi.json -o src/lib/api/schema.d.ts

db-up:            ## Start a local Postgres (optional; SQLite is the default)
	docker compose up -d db

db-down:
	docker compose down
