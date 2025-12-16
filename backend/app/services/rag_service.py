"""
RAG Service for document retrieval.
"""

import os
from typing import Dict, Any, List, Optional
from collections import Counter


class RAGService:
    """Service for RAG operations using ChromaDB."""

    def __init__(self):
        self.collection = None
        self.embeddings = None

    async def initialize(self):
        """Initialize ChromaDB connection and embeddings."""
        try:
            import chromadb
            from openai import OpenAI

            # Initialize ChromaDB
            persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./vectordb")
            collection_name = os.getenv("CHROMA_COLLECTION", "bris_documents")

            self.client = chromadb.PersistentClient(path=persist_dir)
            self.collection = self.client.get_collection(collection_name)

            # Initialize OpenAI for embeddings
            self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            print(f"RAG Service initialized with {self.collection.count()} documents")

        except Exception as e:
            print(f"Warning: Could not initialize RAG service: {e}")
            self.collection = None

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using OpenAI."""
        response = self.openai_client.embeddings.create(
            model="text-embedding-3-large",
            input=text
        )
        return response.data[0].embedding

    async def query(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Query the document database."""
        if not self.collection:
            return {"documents": [], "total": 0}

        try:
            # Get query embedding
            query_embedding = await self.get_embedding(query)

            # Build where clause for filters
            where = None
            if filters:
                where = {k: v for k, v in filters.items() if v is not None}

            # Search ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where if where else None,
                include=["documents", "metadatas", "distances"]
            )

            # Format results
            documents = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                    distance = results["distances"][0][i] if results["distances"] else 0

                    documents.append({
                        "content": doc,
                        "title": metadata.get("title", "Unknown"),
                        "file_name": metadata.get("file_name"),
                        "regulatory_topic": metadata.get("regulatory_topic"),
                        "source_authority": metadata.get("source_authority"),
                        "references": metadata.get("references"),
                        "score": 1 - distance  # Convert distance to similarity
                    })

            return {
                "documents": documents,
                "total": len(documents)
            }

        except Exception as e:
            print(f"Error querying RAG: {e}")
            return {"documents": [], "total": 0, "error": str(e)}

    async def get_stats(self) -> Dict[str, Any]:
        """Get statistics about indexed documents."""
        if not self.collection:
            return {
                "total_chunks": 0,
                "total_documents": 0,
                "topics": {},
                "authorities": {}
            }

        try:
            # Get all metadata
            count = self.collection.count()
            results = self.collection.get(
                limit=min(count, 10000),
                include=["metadatas"]
            )

            # Analyze metadata
            topics = Counter()
            authorities = Counter()
            files = set()

            for meta in results["metadatas"]:
                if meta:
                    topics[meta.get("regulatory_topic", "unknown")] += 1
                    authorities[meta.get("source_authority", "unknown")] += 1
                    if meta.get("file_name"):
                        files.add(meta["file_name"])

            return {
                "total_chunks": count,
                "total_documents": len(files),
                "topics": dict(topics),
                "authorities": dict(authorities)
            }

        except Exception as e:
            print(f"Error getting stats: {e}")
            return {
                "total_chunks": 0,
                "total_documents": 0,
                "topics": {},
                "authorities": {},
                "error": str(e)
            }

    async def list_documents(
        self,
        topic: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List unique documents."""
        if not self.collection:
            return []

        try:
            # Build filter
            where = {"regulatory_topic": topic} if topic else None

            # Get documents
            results = self.collection.get(
                limit=limit + offset,
                where=where,
                include=["metadatas"]
            )

            # Get unique documents
            seen_files = set()
            documents = []

            for meta in results["metadatas"]:
                if meta and meta.get("file_name"):
                    file_name = meta["file_name"]
                    if file_name not in seen_files:
                        seen_files.add(file_name)
                        documents.append({
                            "title": meta.get("title", "Unknown"),
                            "file_name": file_name,
                            "regulatory_topic": meta.get("regulatory_topic"),
                            "source_authority": meta.get("source_authority")
                        })

            return documents[offset:offset + limit]

        except Exception as e:
            print(f"Error listing documents: {e}")
            return []
