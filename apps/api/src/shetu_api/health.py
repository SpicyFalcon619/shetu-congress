"""Health checks: is the database reachable, and is an AI provider configured?"""

import time
from dataclasses import dataclass

from sqlalchemy import text

from shetu_api.config import Settings
from shetu_api.db import get_engine

STARTED_AT = time.monotonic()


@dataclass(frozen=True)
class Check:
    name: str
    ok: bool
    detail: str
    latency_ms: float | None = None


def _key_for(provider: str, settings: Settings) -> bool:
    return {
        "gemini": bool(settings.gemini_api_key),
        "groq": bool(settings.groq_api_key),
        "anthropic": bool(settings.anthropic_api_key),
        "local": True,
        "replay": True,
    }.get(provider, False)


def run_checks(settings: Settings) -> list[Check]:
    checks: list[Check] = []
    start = time.perf_counter()
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ms = (time.perf_counter() - start) * 1000
        engine = "PostgreSQL" if settings.database_url.startswith("postgresql") else "SQLite"
        checks.append(Check("Database", True, f"{engine} reachable", round(db_ms, 1)))
    except Exception as exc:
        checks.append(Check("Database", False, f"Unreachable: {type(exc).__name__}"))

    chain = [settings.ai_provider] + [
        p.strip()
        for p in settings.ai_fallback.split(",")
        if p.strip() and p.strip() != settings.ai_provider
    ]
    for i, provider in enumerate(chain):
        configured = _key_for(provider, settings)
        role = "Primary AI" if i == 0 else "Fallback AI"
        checks.append(
            Check(role, configured, provider if configured else f"{provider}: key missing")
        )
    return checks


def uptime_seconds() -> int:
    return int(time.monotonic() - STARTED_AT)
