import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
  const token = Cookies.get('auth-token');
  return { Authorization: `Bearer ${token}` };
};

export const chatService = {
  async sendMessage(message: string, fileId?: string) {
    const response = await axios.post(`${API_URL}/chat/`, {
      message,
      file_id: fileId
    }, {
      headers: getAuthHeader(),
    });
    return response.data;
  }
};
