"""FastAPI application factory."""

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response
from pydantic import BaseModel
from scalar_fastapi import AgentScalarConfig, get_scalar_api_reference

from shetu_api import __version__
from shetu_api.config import get_settings
from shetu_api.db import Base, get_engine, get_sessionmaker
from shetu_api.health import Check, run_checks, uptime_seconds
from shetu_api.routes import router
from shetu_api.seed import seed
from shetu_api.status_page import DOCS_CSS, FAVICON, render_health, render_status

log = structlog.get_logger()


class HealthCheck(BaseModel):
    name: str
    ok: bool
    detail: str
    latency_ms: float | None = None


class Health(BaseModel):
    status: str
    version: str
    ai_provider: str
    uptime_seconds: int
    checks: list[HealthCheck]


def _wants_html(request: Request) -> bool:
    return "text/html" in request.headers.get("accept", "")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    if settings.environment != "production":
        # Local and test databases are created directly; production uses Alembic migrations.
        Base.metadata.create_all(get_engine())
    if settings.seed_on_startup:
        with get_sessionmaker()() as session:
            if seed(session):
                log.info("seed.inserted")
    log.info("startup", provider=settings.ai_provider, environment=settings.environment)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Shetu API",
        version=__version__,
        summary="Hidden-work discovery, checked cover plans and return checks for planned leave.",
        description=(
            "Shetu keeps a job safe while its owner is on leave. Every route under `/api/v1` "
            "needs the `X-Shetu-Persona` header (a demo account id such as `rafiq` or `nusrat`); "
            "permissions are checked on the server for every request. All data is synthetic."
        ),
        lifespan=lifespan,
        openapi_tags=[
            {
                "name": "Leaves",
                "description": "Planned leaves and their full state, including rule findings.",
            },
            {
                "name": "Interview",
                "description": "The AI interview that builds the Role Map (employee).",
            },
            {
                "name": "Cover plan",
                "description": "AI cover proposals, availability, assignments and approval (manager).",
            },
            {
                "name": "Changes",
                "description": "Changes reported during leave and the manager's decisions.",
            },
            {
                "name": "Return",
                "description": "The return check, the return guard (R8) and closing a leave.",
            },
            {"name": "People", "description": "Demo accounts."},
            {"name": "Operations", "description": "Health and dependency checks."},
        ],
        docs_url=None,
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def health(checks: list[Check]) -> Health:
        return Health(
            status="ok" if all(c.ok for c in checks) else "degraded",
            version=__version__,
            ai_provider=settings.ai_provider,
            uptime_seconds=uptime_seconds(),
            checks=[HealthCheck(**c.__dict__) for c in checks],
        )

    @app.get("/", include_in_schema=False, response_class=HTMLResponse)
    def status_page() -> str:
        return render_status(
            version=__version__,
            checks=run_checks(settings),
            uptime=uptime_seconds(),
            app_url=settings.app_url,
        )

    @app.get("/healthz", tags=["Operations"], response_model=Health)
    def healthz(request: Request) -> Response:
        """Liveness and dependency checks. Browsers get a page; everything else gets JSON."""
        checks = run_checks(settings)
        result = health(checks)
        if _wants_html(request):
            return HTMLResponse(
                render_health(
                    payload_json=json.dumps(result.model_dump(), indent=2),
                    checks=checks,
                    uptime=result.uptime_seconds,
                )
            )
        return JSONResponse(result.model_dump(), status_code=200 if result.status == "ok" else 503)

    @app.get("/docs", include_in_schema=False)
    def docs() -> HTMLResponse:
        return get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title="Shetu API reference",
            scalar_favicon_url=FAVICON,
            force_dark_mode_state="light",
            hide_dark_mode_toggle=True,
            custom_css=DOCS_CSS,
            telemetry=False,
            show_developer_tools="never",
            agent=AgentScalarConfig(disabled=True),
        )

    app.include_router(router)
    return app


app = create_app()
