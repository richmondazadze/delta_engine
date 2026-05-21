"""
Delta Engine — FastAPI application entry point.
Run: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.accounts import router as accounts_router
from app.api.copiers import router as copiers_router
from app.api.risk import router as risk_router
from app.api.execution import router as execution_router
from app.api.internal_workers import router as internal_router
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ]
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if settings.api_debug else None,
    redoc_url="/redoc" if settings.api_debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(accounts_router)
app.include_router(copiers_router)
app.include_router(risk_router)
app.include_router(execution_router)
app.include_router(internal_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "env": settings.api_env,
    }


@app.get("/")
async def root():
    return {
        "message": "Delta Engine API",
        "docs": "/docs",
        "health": "/health",
    }
