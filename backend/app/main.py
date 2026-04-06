from __future__ import annotations

import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging, get_logger
from app.db.bootstrap import create_all_tables, seed_defaults
from app.db.session import SessionLocal


settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    if settings.is_sqlite or settings.environment == "development":
        create_all_tables()
        with SessionLocal() as db:
            seed_defaults(db)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description=(
            "Backend productivo de Tempo para control de tiempos, horas extra, "
            "auditoria, importaciones y reportes en Colombia."
        ),
        lifespan=lifespan,
    )

    app.state.rate_limits = defaultdict(deque)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_request_context(request: Request, call_next):
        request_id = str(uuid4())
        request.state.request_id = request_id

        client_host = request.client.host if request.client else "unknown"
        rate_key = f"{client_host}:{request.url.path}"
        now = time.monotonic()
        bucket = app.state.rate_limits[rate_key]
        while bucket and now - bucket[0] > settings.rate_limit_window_seconds:
            bucket.popleft()
        if (
            request.url.path not in {"/health", "/api/health"}
            and len(bucket) >= settings.rate_limit_requests
        ):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "rate_limit_exceeded",
                        "message": "Se excedio el limite de solicitudes.",
                        "request_id": request_id,
                    }
                },
            )
        bucket.append(now)

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "extra_payload": {
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            },
        )
        return response

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "request_id": getattr(request.state, "request_id", "unknown"),
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "La solicitud no es valida.",
                    "request_id": getattr(request.state, "request_id", "unknown"),
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "http_error",
                    "message": str(exc.detail),
                    "request_id": getattr(request.state, "request_id", "unknown"),
                }
            },
        )

    @app.get("/")
    def root() -> dict[str, str]:
        return {"product": "Tempo", "status": "ok", "docs": "/docs"}

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "healthy"}

    @app.get("/api/health", include_in_schema=False)
    def health_vercel_alias() -> dict[str, str]:
        return {"status": "healthy"}

    app.include_router(api_router, prefix=settings.api_prefix)
    app.include_router(api_router, prefix=f"/api{settings.api_prefix}", include_in_schema=False)
    return app


app = create_app()
