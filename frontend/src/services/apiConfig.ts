const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export const apiConfig = {
  BASE_URL,
  API_URL,
  UPLOADS_URL: `${BASE_URL}/uploads`,
};
