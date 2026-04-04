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

// Global response interceptor: enforce logout on auth expiry without redirect loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // Clear client-side session timers/markers
      try {
        localStorage.removeItem('auth.loginAt');
        localStorage.removeItem('auth.expiresAt');
      } catch {}

      // Notify the auth layer instead of forcing a full page reload.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { status } }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
