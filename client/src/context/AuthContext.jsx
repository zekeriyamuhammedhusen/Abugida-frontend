import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const autoLogoutTimer = useRef(null);

  // Session expiry (in hours)
  const SESSION_MAX_AGE_HOURS = 6; // adjust as needed
  const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_HOURS * 60 * 60 * 1000;

  const clearAutoLogoutTimer = () => {
    if (autoLogoutTimer.current) {
      clearTimeout(autoLogoutTimer.current);
      autoLogoutTimer.current = null;
    }
  };

  const scheduleAutoLogout = (expiresAtMs) => {
    clearAutoLogoutTimer();
    const remaining = expiresAtMs - Date.now();
    if (remaining <= 0) {
      toast.error("Session expired. Please log in again.");
      logout();
      return;
    }
    autoLogoutTimer.current = setTimeout(() => {
      toast.error("Session expired. Please log in again.");
      logout();
    }, remaining);
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await api.get(`/api/auth/me`);
        setUser(res.data);
        // Restore or create session expiry
        const storedExpires = Number(localStorage.getItem("auth.expiresAt") || 0);
        let expiresAt = storedExpires;
        if (!storedExpires) {
          const now = Date.now();
          expiresAt = now + SESSION_MAX_AGE_MS;
          localStorage.setItem("auth.loginAt", String(now));
          localStorage.setItem("auth.expiresAt", String(expiresAt));
        }
        scheduleAutoLogout(expiresAt);
      } catch (err) {
        setUser(null);
        // Clear any stale session data
        clearAutoLogoutTimer();
        localStorage.removeItem("auth.loginAt");
        localStorage.removeItem("auth.expiresAt");
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
    return () => clearAutoLogoutTimer();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post(`/api/auth/login`, { email, password });
      setUser(res.data.user);
      // Start session expiry from login time
      const now = Date.now();
      const expiresAt = now + SESSION_MAX_AGE_MS;
      localStorage.setItem("auth.loginAt", String(now));
      localStorage.setItem("auth.expiresAt", String(expiresAt));
      scheduleAutoLogout(expiresAt);
      navigate(getDashboardPath(res.data.user?.role));
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  

  // Logout function
  const logout = async () => {
    try {
      await api.post(`/api/auth/logout`);
      setUser(null);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Logout failed";
      setError(errorMsg);
      toast.error(errorMsg);
    }
    finally {
      // Always clear timer and storage on logout
      clearAutoLogoutTimer();
      localStorage.removeItem("auth.loginAt");
      localStorage.removeItem("auth.expiresAt");
    }
  };

  // Helper function to get dashboard path
  const getDashboardPath = (role) => {
    switch (role) {
      case "student": return "/";
      case "instructor": return "/instructor-dashboard";
      case "admin": return "/admin-dashboard";
      default: return "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};