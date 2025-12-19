"""
Scraper Service for automatic document updates.

Provides integration with the scraping system for the web interface.
"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))


class ScraperService:
    """Service for managing document scraping and indexing."""

    def __init__(self):
        self.last_scrape: Dict[str, datetime] = {}
        self.scrape_stats: Dict[str, Any] = {}
        self._lock = asyncio.Lock()

    async def get_available_sources(self) -> List[Dict[str, Any]]:
        """Get list of available regulatory sources."""
        sources = [
            {
                "id": "eba",
                "name": "European Banking Authority (EBA)",
                "url": "https://www.eba.europa.eu",
                "document_types": ["RTS", "ITS", "Guidelines", "Recommendations", "Q&A"],
                "status": "available"
            },
            {
                "id": "ecb",
                "name": "European Central Bank (ECB)",
                "url": "https://www.ecb.europa.eu",
                "document_types": ["Regulations", "Decisions", "Guidelines", "Opinions"],
                "status": "available"
            },
            {
                "id": "bis",
                "name": "Bank for International Settlements (BIS)",
                "url": "https://www.bis.org",
                "document_types": ["Basel Framework", "Standards", "Guidelines"],
                "status": "available"
            },
            {
                "id": "esma",
                "name": "European Securities and Markets Authority (ESMA)",
                "url": "https://www.esma.europa.eu",
                "document_types": ["Guidelines", "Technical Standards"],
                "status": "available"
            },
            {
                "id": "srb",
                "name": "Single Resolution Board (SRB)",
                "url": "https://www.srb.europa.eu",
                "document_types": ["MREL Policies", "Resolution Guidelines"],
                "status": "available"
            },
            {
                "id": "fsb",
                "name": "Financial Stability Board (FSB)",
                "url": "https://www.fsb.org",
                "document_types": ["Standards", "Policy Documents"],
                "status": "available"
            },
        ]

        # Add last scrape info
        for source in sources:
            if source["id"] in self.last_scrape:
                source["last_scraped"] = self.last_scrape[source["id"]].isoformat()

        return sources

    async def discover_new_documents(self, source_id: str) -> Dict[str, Any]:
        """
        Discover new documents from a source without downloading.

        Returns list of documents found that are not yet indexed.
        """
        try:
            scraper = await self._get_scraper(source_id)
            if not scraper:
                return {"error": f"Unknown source: {source_id}", "documents": []}

            async with scraper:
                # Discover without downloading
                result = await scraper.scrape(download=False)

                return {
                    "source": source_id,
                    "documents_found": result.documents_found,
                    "documents": [
                        {
                            "title": doc.title,
                            "url": doc.url,
                            "type": doc.document_type.value,
                            "date": doc.publication_date.isoformat() if doc.publication_date else None,
                            "reference": doc.reference_number
                        }
                        for doc in result.metadata[:50]  # Limit to 50 for preview
                    ],
                    "duration_seconds": result.duration_seconds
                }

        except Exception as e:
            return {"error": str(e), "documents": []}

    async def scrape_and_index(
        self,
        source_id: str,
        limit: Optional[int] = None,
        rag_service = None
    ) -> Dict[str, Any]:
        """
        Scrape documents from source and index them into the RAG.
        """
        async with self._lock:
            try:
                from src.scrapers.base_scraper import ScrapingResult

                scraper = await self._get_scraper(source_id)
                if not scraper:
                    return {"success": False, "error": f"Unknown source: {source_id}"}

                result = {
                    "source": source_id,
                    "started_at": datetime.utcnow().isoformat(),
                    "status": "running",
                    "documents_found": 0,
                    "documents_downloaded": 0,
                    "documents_indexed": 0,
                    "errors": []
                }

                async with scraper:
                    # Scrape and download
                    scrape_result = await scraper.scrape(download=True)

                    result["documents_found"] = scrape_result.documents_found
                    result["documents_downloaded"] = scrape_result.documents_downloaded
                    result["errors"] = scrape_result.errors[:10]  # Limit errors

                    # Index downloaded documents
                    if scrape_result.documents_downloaded > 0 and rag_service:
                        indexed = await self._index_documents(scrape_result.metadata, rag_service)
                        result["documents_indexed"] = indexed

                result["status"] = "completed"
                result["completed_at"] = datetime.utcnow().isoformat()
                result["success"] = True

                # Update tracking
                self.last_scrape[source_id] = datetime.utcnow()
                self.scrape_stats[source_id] = result

                return result

            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "source": source_id
                }

    async def _get_scraper(self, source_id: str):
        """Get the appropriate scraper for a source."""
        try:
            if source_id == "eba":
                from src.scrapers.eba_scraper import EBAScraper
                return EBAScraper()
            elif source_id == "ecb":
                from src.scrapers.ecb_scraper import ECBScraper
                return ECBScraper()
            elif source_id == "bis":
                from src.scrapers.bis_scraper import BISScraper
                return BISScraper()
            elif source_id == "esma":
                from src.scrapers.esma_scraper import ESMAScraper
                return ESMAScraper()
            elif source_id == "srb":
                from src.scrapers.srb_scraper import SRBScraper
                return SRBScraper()
            elif source_id == "fsb":
                from src.scrapers.fsb_scraper import FSBScraper
                return FSBScraper()
            else:
                return None
        except ImportError as e:
            print(f"Could not import scraper for {source_id}: {e}")
            return None

    async def _index_documents(self, documents, rag_service) -> int:
        """Index downloaded documents into the RAG."""
        try:
            from src.indexer.index_documents import DocumentIndexer
            from src.utils.config import settings

            indexer = DocumentIndexer(documents_dir=settings.documents_dir)

            indexed_count = 0
            for doc_meta in documents:
                if doc_meta.local_path and doc_meta.local_path.exists():
                    try:
                        docs = await indexer.process_document(doc_meta.local_path)
                        if docs:
                            await indexer._index_batch(docs)
                            indexed_count += 1
                    except Exception as e:
                        print(f"Error indexing {doc_meta.local_path}: {e}")

            return indexed_count

        except Exception as e:
            print(f"Error in indexing: {e}")
            return 0

    async def get_indexed_documents_by_source(self, rag_service) -> Dict[str, int]:
        """Get count of indexed documents by source authority."""
        try:
            stats = await rag_service.get_stats()
            return stats.get("authorities", {})
        except Exception:
            return {}

    async def check_for_updates(self, rag_service) -> Dict[str, Any]:
        """
        Check all sources for new documents.

        Returns summary of what's new without downloading.
        """
        updates = {
            "checked_at": datetime.utcnow().isoformat(),
            "sources": []
        }

        sources = await self.get_available_sources()

        for source in sources:
            try:
                discovered = await self.discover_new_documents(source["id"])

                updates["sources"].append({
                    "id": source["id"],
                    "name": source["name"],
                    "new_documents": discovered.get("documents_found", 0),
                    "sample": discovered.get("documents", [])[:5]
                })
            except Exception as e:
                updates["sources"].append({
                    "id": source["id"],
                    "name": source["name"],
                    "error": str(e)
                })

        return updates


# Global instance
scraper_service = ScraperService()
