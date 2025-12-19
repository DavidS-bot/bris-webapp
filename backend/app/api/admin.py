"""
Admin API endpoints for document management and scraping.

Provides endpoints to:
- List available regulatory sources
- Discover new documents
- Trigger scraping and indexing
- Check for updates
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.scraper_service import scraper_service


router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================

class ScrapeRequest(BaseModel):
    """Request to start scraping."""
    source_id: str = Field(..., description="Source ID (eba, ecb, bis, etc.)")
    limit: Optional[int] = Field(None, description="Max documents to process")
    index_immediately: bool = Field(True, description="Index after downloading")


class ScrapeStatus(BaseModel):
    """Status of a scraping operation."""
    source: str
    status: str
    documents_found: int = 0
    documents_downloaded: int = 0
    documents_indexed: int = 0
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    errors: list = []


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/sources")
async def list_sources():
    """
    List available regulatory document sources.

    Returns all sources that can be scraped with their status.
    """
    try:
        sources = await scraper_service.get_available_sources()
        return {
            "sources": sources,
            "total": len(sources)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources/{source_id}/discover")
async def discover_documents(source_id: str):
    """
    Discover new documents from a source without downloading.

    This is a preview of what's available for scraping.
    """
    try:
        result = await scraper_service.discover_new_documents(source_id)

        if "error" in result and result["error"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sources/{source_id}/scrape", response_model=ScrapeStatus)
async def scrape_source(
    source_id: str,
    request: Request,
    scrape_request: ScrapeRequest = None
):
    """
    Trigger scraping and indexing for a source.

    Downloads new documents and indexes them into the RAG.
    This is a long-running operation.
    """
    try:
        rag_service = request.app.state.rag_service if scrape_request and scrape_request.index_immediately else None

        result = await scraper_service.scrape_and_index(
            source_id=source_id,
            limit=scrape_request.limit if scrape_request else None,
            rag_service=rag_service
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Scraping failed"))

        return ScrapeStatus(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape/background/{source_id}")
async def scrape_background(
    source_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    limit: Optional[int] = None
):
    """
    Start scraping in background.

    Returns immediately while scraping continues.
    """
    async def run_scrape():
        await scraper_service.scrape_and_index(
            source_id=source_id,
            limit=limit,
            rag_service=request.app.state.rag_service
        )

    background_tasks.add_task(run_scrape)

    return {
        "message": f"Scraping started for {source_id}",
        "status": "running",
        "check_status_at": f"/api/v1/admin/sources/{source_id}/status"
    }


@router.get("/sources/{source_id}/status")
async def get_scrape_status(source_id: str):
    """Get the status of the last scrape for a source."""
    if source_id in scraper_service.scrape_stats:
        return scraper_service.scrape_stats[source_id]

    return {
        "source": source_id,
        "status": "never_scraped",
        "message": "No scraping has been performed for this source"
    }


@router.get("/check-updates")
async def check_for_updates(request: Request):
    """
    Check all sources for new documents.

    Quick scan without downloading - shows what's available.
    """
    try:
        rag_service = request.app.state.rag_service
        updates = await scraper_service.check_for_updates(rag_service)
        return updates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indexed-stats")
async def get_indexed_stats(request: Request):
    """
    Get statistics about currently indexed documents.
    """
    try:
        rag_service = request.app.state.rag_service
        stats = await rag_service.get_stats()

        by_source = await scraper_service.get_indexed_documents_by_source(rag_service)

        return {
            "total_chunks": stats.get("total_chunks", 0),
            "total_documents": stats.get("total_documents", 0),
            "by_authority": by_source,
            "by_topic": stats.get("topics", {}),
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reindex")
async def trigger_reindex(
    request: Request,
    background_tasks: BackgroundTasks,
    limit: Optional[int] = None
):
    """
    Reindex all local documents.

    Use this after manually adding documents to the documents folder.
    """
    async def run_reindex():
        try:
            from src.indexer.index_documents import index_all_documents
            await index_all_documents(limit=limit)
        except Exception as e:
            print(f"Reindex error: {e}")

    background_tasks.add_task(run_reindex)

    return {
        "message": "Reindexing started",
        "status": "running"
    }
