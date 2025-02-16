import axios from 'axios';
import Constants from '../Constants';

const api = axios.create({
  baseURL: Constants.BACKEND_URL, // Update to match your FastAPI server URL
  //withCredentials: true, // Important for CORS
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;