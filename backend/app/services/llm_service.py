"""
LLM Service for generating responses.
"""

import os
from typing import Dict, Any, List, Optional


SYSTEM_PROMPT_ES = """Eres BRIS (Banking Regulation Intelligence System), un asistente experto en regulacion bancaria europea.

Tu conocimiento abarca:
- CRR/CRD (Capital Requirements Regulation/Directive)
- Basel III/IV framework
- EBA Guidelines y Technical Standards
- MREL/TLAC requirements
- Securitization framework (SEC-IRBA, SEC-SA, SEC-ERBA)
- Credit Risk Mitigation
- Liquidity requirements (LCR, NSFR)
- Leverage Ratio

Instrucciones:
1. Responde de forma clara y estructurada
2. Cita articulos especificos cuando sea relevante (ej: "CRR Article 259")
3. Si proporcionas calculos, muestra los pasos
4. Si no tienes informacion suficiente, indicalo claramente
5. Usa el contexto proporcionado para fundamentar tus respuestas
6. Responde en el idioma que te indiquen

Contexto de documentos relevantes:
{context}
"""

SYSTEM_PROMPT_EN = """You are BRIS (Banking Regulation Intelligence System), an expert assistant on European banking regulation.

Your expertise covers:
- CRR/CRD (Capital Requirements Regulation/Directive)
- Basel III/IV framework
- EBA Guidelines and Technical Standards
- MREL/TLAC requirements
- Securitization framework (SEC-IRBA, SEC-SA, SEC-ERBA)
- Credit Risk Mitigation
- Liquidity requirements (LCR, NSFR)
- Leverage Ratio

Instructions:
1. Respond clearly and in a structured manner
2. Cite specific articles when relevant (e.g., "CRR Article 259")
3. If providing calculations, show the steps
4. If you don't have sufficient information, clearly indicate this
5. Use the provided context to support your answers
6. Respond in the requested language

Relevant document context:
{context}
"""


class LLMService:
    """Service for LLM operations."""

    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "openai")
        self.openai_client = None
        self.anthropic_client = None

    def _get_openai_client(self):
        if not self.openai_client:
            from openai import OpenAI
            self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        return self.openai_client

    def _get_anthropic_client(self):
        if not self.anthropic_client:
            import anthropic
            self.anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        return self.anthropic_client

    async def generate_response(
        self,
        user_message: str,
        context: str,
        history: List[Dict[str, str]] = None,
        language: str = "es"
    ) -> Dict[str, Any]:
        """Generate response using LLM."""

        # Select system prompt based on language
        system_prompt = SYSTEM_PROMPT_ES if language == "es" else SYSTEM_PROMPT_EN
        system_prompt = system_prompt.format(context=context[:8000])  # Limit context

        # Build messages
        messages = []

        # Add history if available
        if history:
            for msg in history[-6:]:  # Last 6 messages
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        # Add current message
        messages.append({
            "role": "user",
            "content": user_message
        })

        try:
            if self.provider == "anthropic":
                return await self._generate_anthropic(system_prompt, messages)
            else:
                return await self._generate_openai(system_prompt, messages)
        except Exception as e:
            return {
                "answer": f"Lo siento, ha ocurrido un error al procesar tu consulta: {str(e)}",
                "confidence": "low"
            }

    async def _generate_openai(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Generate response using OpenAI."""
        client = self._get_openai_client()

        full_messages = [{"role": "system", "content": system_prompt}] + messages

        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=full_messages,
            temperature=0.3,
            max_tokens=2000
        )

        answer = response.choices[0].message.content

        # Estimate confidence based on response
        confidence = "high" if len(answer) > 200 else "medium"

        return {
            "answer": answer,
            "confidence": confidence,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens
            }
        }

    async def _generate_anthropic(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Generate response using Anthropic Claude."""
        client = self._get_anthropic_client()

        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
            max_tokens=2000,
            system=system_prompt,
            messages=messages
        )

        answer = response.content[0].text

        confidence = "high" if len(answer) > 200 else "medium"

        return {
            "answer": answer,
            "confidence": confidence,
            "model": response.model,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }

    async def generate_suggestions(
        self,
        user_message: str,
        answer: str
    ) -> List[str]:
        """Generate follow-up question suggestions."""
        try:
            client = self._get_openai_client()

            prompt = f"""Based on this Q&A, suggest 3 brief follow-up questions in Spanish:

Question: {user_message}
Answer: {answer[:500]}

Return only the 3 questions, one per line, no numbering."""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=200
            )

            suggestions = response.choices[0].message.content.strip().split("\n")
            return [s.strip() for s in suggestions if s.strip()][:3]

        except Exception:
            return [
                "¿Puedes explicar más sobre este tema?",
                "¿Cuáles son las implicaciones de capital?",
                "¿Qué dice la normativa EBA al respecto?"
            ]
