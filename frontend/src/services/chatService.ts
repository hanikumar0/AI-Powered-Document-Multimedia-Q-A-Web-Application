import axios from 'axios';
import Cookies from 'js-cookie';

import { apiConfig } from './apiConfig';

const API_URL = apiConfig.API_URL;


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
  },

  async sendMessageStreaming(message: string, sessionId: string, onChunk: (chunk: string) => void, context: any = {}) {
    const token = Cookies.get('auth-token');
    
    const response = await fetch(`${API_URL}/chat/message/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        message, 
        session_id: sessionId,
        ...context
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = { id: '', sources: [] };

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                onChunk(data.content);
              } else if (data.type === 'done') {
                result = { id: data.id, sources: data.sources };
              } else if (data.type === 'error') {
                throw new Error(data.content);
              }
            } catch (e) {
              console.error('Error parsing streaming chunk:', e);
            }
          }
        }
      }
    }
    return result;
  }
};
