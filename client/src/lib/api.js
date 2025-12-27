import axios from 'axios';

// If VITE_API_BASE_URL is empty or unset, default to an empty string
// so requests go to the same origin (e.g. '/api/...') and Vite's proxy
// will forward them to the backend. This avoids cross-site cookie issues
// during local development.
const baseURL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
