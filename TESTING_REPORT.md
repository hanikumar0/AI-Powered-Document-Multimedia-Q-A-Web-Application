# Testing Report & Quality Assurance Document

## Project Overview
**InsightIQ** is a production-grade AI-powered multimedia application. To ensure stability, a comprehensive testing suite has been implemented across both the backend (FastAPI) and frontend (Next.js).

---

## 1. Testing Architecture

### Backend (Python/Pytest)
- **Framework:** [Pytest](https://pytest.org/)
- **Coverage Tool:** `pytest-cov`
- **Mocking:** 
  - `mongomock` for in-memory MongoDB simulation.
  - `unittest.mock` for external API services (Google Gemini).
- **Key Features:**
  - Automated database cleanup between tests.
  - Mocked RAG retrieval pipelines.
  - Async test support via `pytest-asyncio`.

### Frontend (TypeScript/Jest)
- **Framework:** [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Mocking:**
  - Custom mocks for `lucide-react` icons.
  - Zustand store mocking for state isolation.
  - Framer-motion animation bypass.
- **Key Features:**
  - Component-level testing for UI stability.
  - State management validation (Zustand).
  - Resilient to Windows path environments.

---

## 2. Test Execution Commands

### Backend Tests
Run from the root directory:
```powershell
cd backend
python -m pytest --cov=app tests/ --cov-report=term-missing
```

### Frontend Tests
Run from the root directory:
```powershell
cd frontend
npm test
```
*Note: The frontend tests are configured to use direct node paths to ensure compatibility with Windows environments containing spaces/special characters.*

---

## 3. Test Coverage Status

| Area | Status | Coverage Target | Current Status |
| :--- | :--- | :--- | :--- |
| **Backend (Total)** | ✅ Passed | 95% | 96% (Production-grade) |
| **Backend Services** | ✅ Passed | 95% | 100% Coverage |
| **Frontend Stores** | ✅ Passed | 100% | Full state logic coverage |
| **Frontend UI** | ✅ Passed | 90% | Key workflows validated |

---

## 4. Key Implementation Details & Fixes

### Database Isolation (Backend)
Tests use a specialized `patch_db` fixture in `conftest.py`. This fixture intercepts all calls to `get_database()` across all modules (API, Services, and Uploads), ensuring that no real database operations occur during testing.

### Windows Compatibility (Frontend)
To solve the "Multimedia is not recognized" error on Windows, the `package.json` test script was updated to bypass shell parsing issues:
```json
"test": "node node_modules/jest/bin/jest.js"
```

### JSDOM Compatibility
Component tests for `ChatWorkspace` now include mocks for browser-only APIs like `scrollIntoView` which are not present in the default JSDOM environment used by Jest.

### Production-Grade Backend Testing (New)
The backend test suite was expanded to include 66 comprehensive test cases, achieving **96% coverage**. Key improvements include:
- **Service Isolation:** Full mocking of Google Gemini (Generative AI) and FAISS vector search for deterministic testing.
- **Edge Case Coverage:** Added tests for rate limits (429), expired/invalid JWT tokens, multi-file RAG retrieval, and PDF/Media processing failures.
- **Async Robustness:** Optimized the `conftest.py` async database wrapper to handle `delete_one`, `insert_many`, and `count_documents` operations.

---

## 5. Troubleshooting & FAQ

**Q: Why does my IDE show "Missing module mongomock"?**
**A:** Ensure your IDE is using the Python interpreter located in `.venv`. Run `Python: Select Interpreter` in VS Code and select the `.venv` version.

**Q: Why are there "unclosed event loop" warnings?**
**A:** These were resolved by implementing a custom `event_loop` fixture in `conftest.py` that manages the lifecycle of the asyncio loop specifically for Pytest sessions.

---

## 6. Continuous Integration (CI)
Automated testing is configured via GitHub Actions in `.github/workflows/test.yml`. Every push to `main` or `master` triggers a full test run with a coverage threshold enforcement of 95%.
