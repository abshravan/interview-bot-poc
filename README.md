# AI Interview Prep — MVP

An AI-powered mock interview application using **Gemini Live** for real-time voice interaction.

## Architecture

```
┌─────────────┐     HTTP/WS      ┌──────────────────┐     WS (BidiGenerateContent)
│  Next.js    │ ◄──────────────► │  Express Backend │ ◄──────────────────────────► Gemini Live
│  Frontend   │                  │  (Node.js)       │
└─────────────┘                  └──────────────────┘
                                          │ HTTP
                                 ┌────────▼─────────┐     ┌──────────┐
                                 │  Resume Parser   │     │ MongoDB  │
                                 │  (Python/FastAPI)│     │          │
                                 └──────────────────┘     └──────────┘
```

## User Flow

1. **Upload Resume** → PDF parsed by FastAPI microservice
2. **Select Role** → Session created in MongoDB
3. **Live Interview** → WebSocket connects frontend ↔ backend ↔ Gemini Live (audio streaming)
4. **End Interview** → Transcript stored in MongoDB
5. **View Feedback** → Gemini Flash analyses transcript → scores + suggestions

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)

### Using Docker Compose

```bash
cp backend/.env.example backend/.env
# Add your GEMINI_API_KEY to backend/.env

docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000
- Parser:   http://localhost:8000

### Manual Setup

**1. Resume Parser**
```bash
cd resume-parser
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**2. Backend**
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and GEMINI_API_KEY
npm install
npm run dev
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| `PORT` | Express port (default: 4000) |
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google AI Studio / Vertex AI key |
| `RESUME_PARSER_URL` | FastAPI parser URL |
| `FRONTEND_URL` | CORS origin |

### frontend/.env.local
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend HTTP URL |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL |

## API Reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/resume/upload` | Upload PDF, returns `resumeId` |
| POST | `/api/sessions` | Create interview session |
| GET  | `/api/sessions/:id` | Get session + transcript |
| POST | `/api/sessions/:id/transcript` | Append transcript message |
| POST | `/api/feedback/:sessionId` | Generate & store feedback |
| GET  | `/api/feedback/:sessionId` | Retrieve feedback |
| WS   | `/ws/interview?sessionId=` | Gemini Live relay |

## Notes

- Without a `GEMINI_API_KEY`, the app runs in **mock mode** — a scripted interviewer walks through preset questions and mock feedback is returned.
- Audio format: 16kHz 16-bit PCM from browser → backend → Gemini; 24kHz 16-bit PCM from Gemini → backend → browser.
