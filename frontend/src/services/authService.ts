import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  async register(data: any) {
    const response = await authApi.post('/auth/register', data);
    return response.data;
  },

  async login(data: any) {
    const response = await authApi.post('/auth/login', data);
    return response.data;
  },

  async getMe(token: string) {
    const response = await authApi.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
