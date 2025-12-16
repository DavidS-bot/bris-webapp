"""
Documents API endpoint for searching and exploring indexed documents.
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Optional, List

from app.models.schemas import (
    DocumentInfo, DocumentStats, SearchRequest, SearchResult, Source
)

router = APIRouter()


@router.get("/stats", response_model=DocumentStats)
async def get_document_stats(request: Request):
    """Get statistics about indexed documents."""
    try:
        rag_service = request.app.state.rag_service
        stats = await rag_service.get_stats()
        return DocumentStats(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topics")
async def get_topics(request: Request):
    """Get list of regulatory topics."""
    try:
        rag_service = request.app.state.rag_service
        stats = await rag_service.get_stats()
        return {
            "topics": list(stats.get("topics", {}).keys()),
            "counts": stats.get("topics", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SearchResult)
async def search_documents(request: Request, search_request: SearchRequest):
    """Search documents by query."""
    try:
        rag_service = request.app.state.rag_service

        # Build filters
        filters = {}
        if search_request.topic_filter:
            filters["regulatory_topic"] = search_request.topic_filter

        # Search
        results = await rag_service.query(
            query=search_request.query,
            top_k=search_request.top_k,
            filters=filters
        )

        # Format results
        sources = []
        for doc in results["documents"]:
            sources.append(Source(
                title=doc.get("title", "Unknown"),
                file_name=doc.get("file_name"),
                regulatory_topic=doc.get("regulatory_topic"),
                excerpt=doc.get("content", "")[:500],
                relevance_score=doc.get("score")
            ))

        return SearchResult(
            query=search_request.query,
            results=sources,
            total_found=len(sources)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_documents(
    request: Request,
    topic: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """List indexed documents with optional filtering."""
    try:
        rag_service = request.app.state.rag_service
        documents = await rag_service.list_documents(
            topic=topic,
            limit=limit,
            offset=offset
        )
        return {
            "documents": documents,
            "total": len(documents),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
