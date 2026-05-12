# AI-Powered Document & Multimedia Q&A Web Application

This is a production-ready AI application that allows users to interact with PDFs, audio, and video files using a conversational AI assistant.

## Features
- **PDF Intelligence**: Extract text and perform Q&A on uploaded documents.
- **Multimedia Transcription**: Automatic transcription of audio and video files using OpenAI Whisper.
- **RAG Engine**: Semantic search and retrieval using FAISS and OpenAI Embeddings.
- **Timestamp Navigation**: Jump to specific parts of audio/video files directly from AI responses.
- **Modern UI**: Built with Next.js 15, Tailwind CSS, and Framer Motion for a premium experience.

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: FastAPI, LangChain, FAISS, MongoDB.
- **AI**: Google Gemini 2.0 Flash, Gemini Embeddings.

## CI/CD & Quality Assurance

This project implements a production-grade CI/CD pipeline using **GitHub Actions**.

### Pipeline Features
- **Automated Validation**: Triggered on every push to `main` or `master`.
- **Linting**: Enforces code style using `Black`, `Isort`, and `Flake8` (Backend) and `ESLint` (Frontend).
- **Testing**: Runs full test suites for both Backend and Frontend.
- **Coverage Enforcement**: Pipeline fails if code coverage drops below **95%**.
- **Artifacts**: Uploads coverage reports as XML artifacts.

### Running Tests Locally

#### Backend Tests
```powershell
cd backend
python -m pytest --cov=app --cov-report=term-missing tests/
```

#### Frontend Tests
```powershell
cd frontend
npm test:coverage
```

## Architecture
See the `TESTING_REPORT.md` and `TESTING_GUIDE.md` for detailed information on the testing strategy and quality assurance measures.
