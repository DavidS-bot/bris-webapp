"""
Pydantic schemas for BRIS API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# Chat Models
# ============================================================================

class ChatMessage(BaseModel):
    """A single chat message."""
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    """Request for chat endpoint."""
    message: str = Field(..., description="User message", min_length=1, max_length=2000)
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    include_sources: bool = Field(True, description="Include source documents in response")
    language: str = Field("es", description="Response language: 'es' or 'en'")


class Source(BaseModel):
    """Source document reference."""
    title: str
    file_name: Optional[str] = None
    regulatory_topic: Optional[str] = None
    excerpt: str
    relevance_score: Optional[float] = None


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    answer: str
    sources: List[Source] = []
    session_id: str
    confidence: str = Field("medium", description="Confidence level: low, medium, high")
    suggestions: List[str] = Field([], description="Follow-up question suggestions")
    processing_time_ms: Optional[int] = None


# ============================================================================
# Calculator Models
# ============================================================================

class SecuritizationApproach(str, Enum):
    SEC_IRBA = "SEC-IRBA"
    SEC_SA = "SEC-SA"
    SEC_ERBA = "SEC-ERBA"


class SecuritizationRequest(BaseModel):
    """Request for securitization RW calculation."""
    kirb: float = Field(..., ge=0.001, le=0.50, description="KIRB (e.g., 0.04 for 4%)")
    ksa: Optional[float] = Field(None, ge=0.001, le=0.50, description="KSA for SEC-SA")
    lgd: float = Field(0.40, ge=0.05, le=0.95, description="Pool LGD")
    maturity: float = Field(4.0, ge=1.0, le=10.0, description="Weighted average maturity")
    attachment: float = Field(..., ge=0.0, le=1.0, description="Attachment point")
    detachment: float = Field(..., ge=0.0, le=1.0, description="Detachment point")
    pool_size: Optional[float] = Field(None, description="Pool size in EUR millions")
    approach: SecuritizationApproach = SecuritizationApproach.SEC_IRBA
    is_sts: bool = Field(False, description="Is STS securitization")


class SecuritizationResult(BaseModel):
    """Result of securitization calculation."""
    approach: str
    p_parameter: float
    risk_weight: float
    risk_weight_percent: str
    rwa: Optional[float] = None
    capital_requirement: Optional[float] = None
    calculation_steps: List[str]
    inputs: Dict[str, Any]


class SecuritizationComparison(BaseModel):
    """Comparison between approaches."""
    sec_irba: SecuritizationResult
    sec_sa: SecuritizationResult
    optimal_approach: str
    rw_difference: float
    capital_savings: Optional[float] = None
    recommendation: str


class LeverageRatioRequest(BaseModel):
    """Request for leverage ratio calculation."""
    tier1_capital: float = Field(..., description="Tier 1 capital in EUR millions")
    on_balance_exposures: float = Field(..., description="On-balance sheet exposures")
    derivative_exposures: float = Field(0, description="Derivative exposures (SA-CCR)")
    sft_exposures: float = Field(0, description="SFT exposures")
    off_balance_items: float = Field(0, description="Off-balance sheet items")
    ccf_off_balance: float = Field(1.0, ge=0.1, le=1.0, description="CCF for off-balance")


class LeverageRatioResult(BaseModel):
    """Result of leverage ratio calculation."""
    leverage_ratio: float
    leverage_ratio_percent: str
    total_exposure_measure: float
    compliant: bool
    buffer_to_minimum: float
    breakdown: Dict[str, float]


class RWARequest(BaseModel):
    """Request for RWA calculation."""
    exposure_class: str = Field(..., description="Exposure class (corporate, retail, etc.)")
    exposure_amount: float = Field(..., description="Exposure amount in EUR millions")
    approach: str = Field("SA", description="SA or IRB")
    pd: Optional[float] = Field(None, description="PD for IRB (e.g., 0.02 for 2%)")
    lgd: Optional[float] = Field(None, description="LGD for IRB")
    maturity: Optional[float] = Field(None, description="Maturity for IRB")
    risk_weight_override: Optional[float] = Field(None, description="Manual RW for SA")


class RWAResult(BaseModel):
    """Result of RWA calculation."""
    exposure_class: str
    approach: str
    risk_weight: float
    rwa: float
    capital_requirement: float
    calculation_steps: List[str]


# ============================================================================
# Document Models
# ============================================================================

class DocumentInfo(BaseModel):
    """Information about an indexed document."""
    title: str
    file_name: str
    regulatory_topic: str
    source_authority: str
    chunk_count: int


class DocumentStats(BaseModel):
    """Statistics about the document database."""
    total_chunks: int
    total_documents: int
    topics: Dict[str, int]
    authorities: Dict[str, int]


class SearchRequest(BaseModel):
    """Request for document search."""
    query: str = Field(..., min_length=3, max_length=500)
    top_k: int = Field(5, ge=1, le=20)
    topic_filter: Optional[str] = None


class SearchResult(BaseModel):
    """Result of document search."""
    query: str
    results: List[Source]
    total_found: int
