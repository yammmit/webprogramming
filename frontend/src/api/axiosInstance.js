import axios from "axios";

// API base URL configurable via Vite env: VITE_API_BASE
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
// Toggle mock mode with Vite env: VITE_USE_MOCK=true
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;
