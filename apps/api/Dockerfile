# syntax=docker/dockerfile:1.7
FROM ghcr.io/astral-sh/uv:0.9-python3.12-bookworm-slim AS build
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --no-install-project
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev

FROM python:3.12-slim-bookworm
WORKDIR /app
RUN useradd --create-home --uid 10001 shetu
COPY --from=build --chown=shetu:shetu /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1 SHETU_ENVIRONMENT=production PORT=8000
USER shetu
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/healthz')"
CMD ["sh", "-c", "alembic upgrade head && uvicorn shetu_api.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
