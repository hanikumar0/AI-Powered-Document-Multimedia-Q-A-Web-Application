import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

const getAuthHeader = () => {
  const token = Cookies.get('auth-token');
  return { Authorization: `Bearer ${token}` };
};

export const fileService = {
  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/upload/`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        // You can handle progress here if needed
      }
    });
    return response.data;
  },

  async getFiles() {
    const response = await axios.get(`${API_URL}/upload/`, {
      headers: getAuthHeader(),
    });
    return response.data;
  }
};
