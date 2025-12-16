# BRIS - Banking Regulation Intelligence System

AI-powered assistant for European banking regulation queries. Built with FastAPI, Next.js, and RAG (Retrieval-Augmented Generation) using ChromaDB.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│                    Next.js + React                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Render)                         │
│                    FastAPI + Python                         │
├─────────────────────────────────────────────────────────────┤
│  RAG Service  │  LLM Service  │  Calculator Service         │
└───────┬───────────────┬───────────────┬─────────────────────┘
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌─────────────┐ ┌─────────────┐
│   ChromaDB    │ │  OpenAI /   │ │  Regulatory │
│  (58K docs)   │ │  Claude     │ │  Formulas   │
└───────────────┘ └─────────────┘ └─────────────┘
```

## Features

- 💬 **Chat**: Conversational AI for regulatory queries with source citations
- 🧮 **Calculator**: SEC-IRBA/SEC-SA risk weight calculations
- 📚 **Documents**: Browse and search 58,000+ regulatory document chunks
- 🎨 **Santander Branding**: Corporate design with red (#EC0000) theme

## Tech Stack

### Backend
- FastAPI
- ChromaDB (vector store)
- OpenAI / Anthropic (LLM)
- Python 3.11

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- TypeScript

## Local Development

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local

# Run development server
npm run dev
```

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set root directory to `webapp/backend`
4. Set environment variables:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY` (optional)
   - `FRONTEND_URL`
5. Add a disk for ChromaDB persistence

### Frontend (Vercel)

1. Import project on Vercel
2. Set root directory to `webapp/frontend`
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL

## API Endpoints

### Chat
- `POST /api/v1/chat/` - Send message and get AI response

### Calculator
- `POST /api/v1/calculator/securitization` - Calculate securitization RW
- `POST /api/v1/calculator/securitization/compare` - Compare SEC-IRBA vs SEC-SA
- `POST /api/v1/calculator/leverage-ratio` - Calculate leverage ratio

### Documents
- `GET /api/v1/documents/stats` - Get database statistics
- `POST /api/v1/documents/search` - Search documents

## Environment Variables

### Backend
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional
LLM_PROVIDER=openai
FRONTEND_URL=https://your-frontend.vercel.app
CHROMA_PERSIST_DIR=./vectordb
```

### Frontend
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## License

Proprietary - Banco Santander Global Asset Desk

## Author

Built with Claude Code - Banking Regulation Team
