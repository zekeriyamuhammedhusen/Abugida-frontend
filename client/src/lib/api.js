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

      // Avoid hard refresh loops when already on an auth page
      if (typeof window !== 'undefined') {
        const path = window.location?.pathname || '';
        const authPaths = ['/login', '/signup', '/register'];
        if (!authPaths.includes(path)) {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
