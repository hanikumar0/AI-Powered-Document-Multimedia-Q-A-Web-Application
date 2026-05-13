# InsightIQ API Reference

This document provides a detailed breakdown of the available API endpoints in the InsightIQ platform. All requests should be made to the base URL `http://localhost:8000/api`.

---

## 🔐 Authentication

### `POST /auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "John Doe"
  }
  ```
- **Response**: `201 Created` with user details.

### `POST /auth/login`
Authenticates a user and returns a JWT token.
- **Request Body**:
  ```json
  {
    "username": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
  ```

---

## 📁 File Management

### `POST /upload`
Uploads a file for processing. Supported formats: `.pdf`, `.mp3`, `.mp4`, `.png`, `.jpg`.
- **Content-Type**: `multipart/form-data`
- **Request**: File binary.
- **Response**:
  ```json
  {
    "file_id": "uuid-v4",
    "filename": "document.pdf",
    "message": "File uploaded and Gemini processing started"
  }
  ```

### `GET /upload/files`
Lists all uploaded files for the current environment.
- **Authentication**: Required (Bearer Token)
- **Response**: Array of file metadata objects.

---

## 💬 Chat & Intelligence

### `POST /chat/message`
Sends a question to the AI and receives a full response.
- **Authentication**: Required (Bearer Token)
- **Request Body**:
  ```json
  {
    "message": "What is the summary of this document?",
    "session_id": "session-uuid"
  }
  ```
- **Response**:
  ```json
  {
    "role": "assistant",
    "content": "The document discusses...",
    "sources": [
      {"filename": "doc.pdf", "page": 1}
    ]
  }
  ```

### `POST /chat/message/stream`
Sends a question and streams the AI response in real-time using Server-Sent Events (SSE).
- **Authentication**: Required (Bearer Token)
- **Request Body**: (Same as above)
- **Events**:
  - `data: {"type": "chunk", "content": "..."}`
  - `data: {"type": "done", "id": "...", "sources": [...]}`
  - `data: {"type": "error", "content": "..."}`

### `GET /chat/sessions`
Retrieves all chat sessions for the user.
- **Response**: Array of session objects with titles and last update timestamps.

---

## 🛡️ Security & Rate Limiting

- **JWT Authentication**: Most endpoints require an `Authorization: Bearer <token>` header.
- **Rate Limiting**: Enforced via Redis. 
  - Standard limit: **10 messages per minute**.
  - Responses exceeding the limit will return `429 Too Many Requests`.

---

## 🛠️ Interactive Exploration

When the backend is running, you can explore and test all endpoints using:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
