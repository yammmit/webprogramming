import axios from "axios";

// Use backend root by default so routes mounted at /auth, /users, /api, etc. resolve correctly
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Authorization header automatically if an idToken is stored (Firebase client token)
api.interceptors.request.use(
  (config) => {
    // prefer 'access_token' (app convention), fall back to legacy 'idToken'
    const token = localStorage.getItem("access_token") || localStorage.getItem("idToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Named export so other modules can check whether mocks are enabled
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default api;
