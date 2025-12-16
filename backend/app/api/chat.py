"""
Chat API endpoint for conversational RAG.
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Optional
import uuid
import time

from app.models.schemas import ChatRequest, ChatResponse, Source
from app.services.rag_service import RAGService
from app.services.llm_service import LLMService

router = APIRouter()


# In-memory session storage (use Redis in production)
sessions: dict = {}


@router.post("/", response_model=ChatResponse)
async def chat(request: Request, chat_request: ChatRequest):
    """
    Process a chat message and return AI response with sources.
    """
    start_time = time.time()

    # Get or create session
    session_id = chat_request.session_id or str(uuid.uuid4())
    if session_id not in sessions:
        sessions[session_id] = {"history": []}

    session = sessions[session_id]

    try:
        # Get RAG service
        rag_service: RAGService = request.app.state.rag_service

        # Search relevant documents
        rag_results = await rag_service.query(
            query=chat_request.message,
            top_k=5
        )

        # Build context from RAG results
        context = "\n\n".join([
            f"[Source: {r['title']}]\n{r['content']}"
            for r in rag_results["documents"]
        ])

        # Get conversation history
        history = session["history"][-10:]  # Last 10 messages

        # Generate response with LLM
        llm_service = LLMService()
        response = await llm_service.generate_response(
            user_message=chat_request.message,
            context=context,
            history=history,
            language=chat_request.language
        )

        # Build sources list
        sources = []
        if chat_request.include_sources:
            for doc in rag_results["documents"]:
                sources.append(Source(
                    title=doc.get("title", "Unknown"),
                    file_name=doc.get("file_name"),
                    regulatory_topic=doc.get("regulatory_topic"),
                    excerpt=doc.get("content", "")[:300] + "...",
                    relevance_score=doc.get("score")
                ))

        # Update session history
        session["history"].append({"role": "user", "content": chat_request.message})
        session["history"].append({"role": "assistant", "content": response["answer"]})

        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)

        # Generate follow-up suggestions
        suggestions = await llm_service.generate_suggestions(
            user_message=chat_request.message,
            answer=response["answer"]
        )

        return ChatResponse(
            answer=response["answer"],
            sources=sources,
            session_id=session_id,
            confidence=response.get("confidence", "medium"),
            suggestions=suggestions,
            processing_time_ms=processing_time
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@router.get("/history/{session_id}")
async def get_history(session_id: str):
    """Get chat history for a session."""
    if session_id not in sessions:
        return {"history": []}
    return {"history": sessions[session_id]["history"]}


@router.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear chat history for a session."""
    if session_id in sessions:
        sessions[session_id] = {"history": []}
    return {"status": "cleared"}
