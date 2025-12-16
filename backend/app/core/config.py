"""
Configuration settings for BRIS API.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings."""

    # API Settings
    API_TITLE: str = "BRIS API"
    API_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Frontend URL (Vercel)
    FRONTEND_URL: str = "https://bris-frontend.vercel.app"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    EMBEDDING_MODEL: str = "text-embedding-3-large"

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    # LLM Provider (openai or anthropic)
    LLM_PROVIDER: str = "openai"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./vectordb"
    CHROMA_COLLECTION: str = "bris_documents"

    # Redis (optional, for session management)
    REDIS_URL: str = ""

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
