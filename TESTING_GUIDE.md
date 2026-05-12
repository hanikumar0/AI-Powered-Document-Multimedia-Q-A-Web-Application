# Testing Guide

This guide provides instructions on how to run and maintain tests for the InsightIQ application.

## 🚀 Quick Start

### Backend Tests
```powershell
cd backend
python -m pytest tests/
```

### Frontend Tests
```powershell
cd frontend
npm test
```

## 📋 Detailed Report
For a full analysis of the testing architecture, coverage status, and implemented fixes (such as Windows path handling and database mocking), please refer to:
[**TESTING_REPORT.md**](./TESTING_REPORT.md)

## 🛠 Troubleshooting
If you encounter any issues with the testing environment, check the following:
1. **Python Interpreter:** Ensure your IDE is using the `.venv` at the root.
2. **Node Modules:** Run `npm install` in the `frontend` directory if Jest is not found.
3. **Database:** Ensure no real MongoDB instance is required for tests; everything is mocked via `mongomock`.
