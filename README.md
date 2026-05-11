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
- **AI**: OpenAI GPT-4o, Whisper, Embeddings.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- OpenAI API Key

### Installation
1. Clone the repository.
2. Create a `.env` file in the `backend` directory with your `OPENAI_API_KEY`.
3. Run `docker-compose up --build`.
4. Open `http://localhost:3000` in your browser.

## Architecture
See the `artifacts/implementation_plan.md` for a detailed breakdown of the system architecture and implementation phases.
