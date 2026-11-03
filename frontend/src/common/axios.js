import axios from "axios";

const getBaseUrl = (envUrl, fallback) => {
  if (import.meta.env.PROD && envUrl?.includes("localhost")) {
    return fallback;
  }
  return envUrl || fallback;
};

const getToken = () => {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  }
  return null;
};

const api = axios.create({
  baseURL: getBaseUrl(import.meta.env.VITE_API_BASE_URL, "/api"),
});

export const adminApi = axios.create({
  baseURL: getBaseUrl(import.meta.env.VITE_ADMIN_API_BASE_URL, "/admin/api"),
});

// Automatic token attachment for regular API
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic token attachment for Admin API
adminApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
