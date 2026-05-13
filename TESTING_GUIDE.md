# InsightIQ: Developer Testing Guide

This guide provides developers and evaluators with instructions on how to execute, monitor, and maintain the InsightIQ test suite.

---

## 🚀 Execution Commands

### 🛡️ Backend (FastAPI)
Ensure you have the virtual environment activated before running tests.

**Run All Tests:**
```bash
cd backend
python -m pytest tests/
```

**Generate Coverage Report (Terminal):**
```bash
python -m pytest --cov=app --cov-report=term-missing tests/
```

**Generate Coverage Report (HTML):**
```bash
python -m pytest --cov=app --cov-report=html tests/
# Open htmlcov/index.html in your browser
```

### 🎨 Frontend (Next.js)
**Run All Tests:**
```bash
cd frontend
npm test
```

**Generate Coverage Report:**
```bash
npm test -- --coverage
```

---

## 🚦 Quality Gates (CI/CD)

The project uses **GitHub Actions** to enforce quality. The pipeline located at `.github/workflows/test.yml` will automatically fail if:
1. **Linting fails**: Code must adhere to PEP8 and ESLint standards.
2. **Tests fail**: Any failing test case blocks the build.
3. **Coverage drops**: Total backend and frontend coverage must be **95% or higher**.

---

## 🏗️ Core Testing Principles

1. **Deterministic**: No real external API calls are made. Gemini, Redis, and MongoDB are fully mocked.
2. **Isolated**: Each test case starts with a fresh, empty state.
3. **Fast**: Backend unit tests execute in under 10 seconds.
4. **Environment Agnostic**: Scripts are configured to run seamlessly on Windows, Linux, and macOS.

---

## 📖 Related Documents

- [**TESTING_REPORT.md**](./TESTING_REPORT.md): Deep dive into the testing architecture and current coverage status.
- [**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md): Reference for all available endpoints.
