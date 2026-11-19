"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shetu_api import __version__
from shetu_api.config import get_settings
from shetu_api.db import Base, get_engine, get_sessionmaker
from shetu_api.routes import router
from shetu_api.seed import seed

log = structlog.get_logger()


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
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz", tags=["ops"])
    def healthz() -> dict[str, str]:
        return {"status": "ok", "version": __version__, "ai_provider": settings.ai_provider}

    app.include_router(router)
    return app


app = create_app()
