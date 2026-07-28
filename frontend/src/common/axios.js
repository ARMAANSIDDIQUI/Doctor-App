import axios from "axios";

const getBaseUrl = (envUrl, fallback) => {
  if (import.meta.env.PROD && envUrl?.includes("localhost")) {
    return fallback;
  }
  return envUrl || fallback;
};

const api = axios.create({
  baseURL: getBaseUrl(import.meta.env.VITE_API_BASE_URL, "/api"),
});

export const adminApi = axios.create({
  baseURL: getBaseUrl(import.meta.env.VITE_ADMIN_API_BASE_URL, "/admin/api"),
});

export default api;

