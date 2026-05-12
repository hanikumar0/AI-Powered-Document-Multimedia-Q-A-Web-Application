# 🚀 Assessment Completion Roadmap

This document outlines the remaining tasks required to fulfill the "SDE-1: Programming Assignment" requirements for the AI-Powered Document & Multimedia Q&A Web Application.

## 🔴 Priority 1: Mandatory Requirements (High Risk)

### 1. Automated Testing (95% Coverage)
The assessment strictly requires 95% coverage. Currently, there are no tests.
- [ ] **Backend Tests:**
  - Setup `pytest`, `pytest-asyncio`, and `pytest-cov`.
  - Write unit tests for `auth_service.py` (Registration/Login).
  - Write integration tests for `upload.py` (PDF/Media processing).
  - Mock Gemini API calls to test `chat_service.py`.
- [ ] **Frontend Tests:**
  - Setup `Jest` and `React Testing Library`.
  - Test `MediaViewer.tsx` to ensure timestamp seeking works.
  - Test Chat UI message rendering.

### 2. CI/CD Pipeline
- [ ] Create `.github/workflows/test.yml`.
- [ ] Configure it to:
  - Install dependencies (Python & Node.js).
  - Run Linting.
  - Run Tests and fail if coverage is below 95%.

---

## 🟡 Priority 2: Bonus Points & UX Polish

### 1. Real-time Chat Streaming
Currently, the UI waits for the full response.
- [ ] **Backend:** Modify `chat.py` to use `StreamingResponse` from FastAPI.
- [ ] **AI Service:** Update `chat_service.py` to yield chunks from the Gemini API.
- [ ] **Frontend:** Update the chat hook to handle chunked text updates for a "typing" effect.

### 2. Rate Limiting & Caching (Redis)
- [ ] Add `redis` to `docker-compose.yml`.
- [ ] Implement a simple middleware in FastAPI to limit requests per user (e.g., 10 messages/minute).
- [ ] Cache embedding results or transcription outputs to save API costs.

---

## 🟢 Priority 3: Final Deliverables

### 1. README & Documentation
- [ ] **API Docs:** Add a Swagger/OpenAPI guide or a list of endpoints.
- [ ] **Setup Guide:** Ensure Docker instructions are crystal clear.
- [ ] **Test Instructions:** Add a command (e.g., `npm run test:coverage`) so the evaluator can verify the 95% mark.

### 2. Walkthrough Video
- [ ] Record a 5-minute demo showing:
  - User registration.
  - PDF/Video upload.
  - Chatting with the file.
  - **Crucial:** Clicking a timestamp to jump the video to a specific part.
