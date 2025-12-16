"""
Health check endpoint.
"""

from fastapi import APIRouter, Request
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Check API health status."""
    rag_status = "healthy"
    try:
        if hasattr(request.app.state, 'rag_service'):
            # Quick check that RAG is responsive
            stats = await request.app.state.rag_service.get_stats()
            if stats.get("total_chunks", 0) == 0:
                rag_status = "empty"
    except Exception as e:
        rag_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "healthy",
            "rag": rag_status
        },
        "version": "1.0.0"
    }


@router.get("/health/ready")
async def readiness_check(request: Request):
    """Check if API is ready to serve requests."""
    is_ready = hasattr(request.app.state, 'rag_service')
    return {
        "ready": is_ready,
        "timestamp": datetime.utcnow().isoformat()
    }
