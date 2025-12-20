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


@router.post("/update-vectordb")
async def update_vectordb(
    request: Request,
    background_tasks: BackgroundTasks,
    version: str = "latest"
):
    """
    Download and update the vectordb from GitHub releases.

    Args:
        version: Release version (e.g., "v1.1.0") or "latest"
    """
    import os
    import shutil
    import tarfile
    import httpx

    GITHUB_REPO = "DavidS-bot/bris-webapp"
    VECTORDB_DIR = os.getenv("CHROMA_PERSIST_DIR", "./vectordb")

    async def download_and_extract():
        try:
            # Get release info
            if version == "latest":
                release_url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
            else:
                release_url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/tags/{version}"

            async with httpx.AsyncClient(timeout=30.0) as client:
                # Get release metadata
                response = await client.get(release_url)
                response.raise_for_status()
                release_data = response.json()

                # Find vectordb.tar.gz asset
                asset_url = None
                for asset in release_data.get("assets", []):
                    if asset["name"] == "vectordb.tar.gz":
                        asset_url = asset["browser_download_url"]
                        break

                if not asset_url:
                    print(f"No vectordb.tar.gz found in release {version}")
                    return

                print(f"Downloading vectordb from {asset_url}...")

                # Download the file
                async with client.stream("GET", asset_url, follow_redirects=True, timeout=600.0) as stream:
                    stream.raise_for_status()
                    tar_path = "/tmp/vectordb.tar.gz"
                    with open(tar_path, "wb") as f:
                        async for chunk in stream.aiter_bytes(chunk_size=8192):
                            f.write(chunk)

                print("Download complete. Extracting...")

                # Backup existing vectordb
                backup_dir = f"{VECTORDB_DIR}_backup"
                if os.path.exists(VECTORDB_DIR):
                    if os.path.exists(backup_dir):
                        shutil.rmtree(backup_dir)
                    shutil.move(VECTORDB_DIR, backup_dir)

                # Extract new vectordb
                with tarfile.open(tar_path, "r:gz") as tar:
                    tar.extractall(path=os.path.dirname(VECTORDB_DIR))

                # Clean up
                os.remove(tar_path)
                if os.path.exists(backup_dir):
                    shutil.rmtree(backup_dir)

                print(f"VectorDB updated successfully from release {release_data['tag_name']}")

                # Reinitialize RAG service
                await request.app.state.rag_service.initialize()

        except Exception as e:
            print(f"Error updating vectordb: {e}")
            # Restore backup if exists
            backup_dir = f"{VECTORDB_DIR}_backup"
            if os.path.exists(backup_dir) and not os.path.exists(VECTORDB_DIR):
                shutil.move(backup_dir, VECTORDB_DIR)

    background_tasks.add_task(download_and_extract)

    return {
        "message": f"VectorDB update started (version: {version})",
        "status": "running",
        "note": "This may take several minutes for large databases"
    }


@router.get("/vectordb-info")
async def get_vectordb_info(request: Request):
    """Get information about the current vectordb."""
    import os

    rag_service = request.app.state.rag_service
    vectordb_dir = os.getenv("CHROMA_PERSIST_DIR", "./vectordb")

    # Get size
    total_size = 0
    if os.path.exists(vectordb_dir):
        for dirpath, dirnames, filenames in os.walk(vectordb_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)

    stats = await rag_service.get_stats()

    return {
        "path": vectordb_dir,
        "size_mb": round(total_size / (1024 * 1024), 2),
        "total_chunks": stats.get("total_chunks", 0),
        "total_documents": stats.get("total_documents", 0),
        "by_authority": stats.get("authorities", {}),
        "by_topic": stats.get("topics", {})
    }
