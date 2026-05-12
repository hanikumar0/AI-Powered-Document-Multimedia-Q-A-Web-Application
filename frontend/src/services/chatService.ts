import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

const getAuthHeader = () => {
  const token = Cookies.get('auth-token');
  return { Authorization: `Bearer ${token}` };
};

export const chatService = {
  async getSessions() {
    const response = await axios.get(`${API_URL}/chat/sessions`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async createSession(title?: string) {
    const response = await axios.post(`${API_URL}/chat/sessions`, { title }, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getMessages(sessionId: string) {
    const response = await axios.get(`${API_URL}/chat/sessions/${sessionId}/messages`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async sendMessage(message: string, sessionId: string) {
    const response = await axios.post(`${API_URL}/chat/message`, {
      message,
      session_id: sessionId
    }, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async attachFiles(sessionId: string, fileIds: string[]) {
    const response = await axios.post(`${API_URL}/chat/sessions/${sessionId}/files`, {
      file_ids: fileIds
    }, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async deleteSession(sessionId: string) {
    const response = await axios.delete(`${API_URL}/chat/sessions/${sessionId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  }
};
