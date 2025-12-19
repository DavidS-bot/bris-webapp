"""
BRIS - Banking Regulation Intelligence System
FastAPI Backend for RAG-powered regulatory assistant
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.api import chat, calculator, documents, health, admin
from app.core.config import settings
from app.services.rag_service import RAGService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    # Initialize RAG service
    app.state.rag_service = RAGService()
    await app.state.rag_service.initialize()
    print("BRIS API initialized successfully")
    yield
    # Cleanup
    print("BRIS API shutting down")


app = FastAPI(
    title="BRIS API",
    description="Banking Regulation Intelligence System - AI-powered regulatory assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(calculator.router, prefix="/api/v1/calculator", tags=["Calculator"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "BRIS API",
        "version": "1.0.0",
        "description": "Banking Regulation Intelligence System",
        "docs": "/docs",
        "endpoints": {
            "chat": "/api/v1/chat",
            "calculator": "/api/v1/calculator",
            "documents": "/api/v1/documents",
            "admin": "/api/v1/admin",
            "health": "/health"
        }
    }
