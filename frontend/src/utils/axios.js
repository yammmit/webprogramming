import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL,
  withCredentials: false,
});

// Attach token from localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Global response handler: on 401 remove token and optionally redirect
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        // optional: redirect to login
        // window.location.href = '/login';
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;