// src/provider/AuthProvider.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../service/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const savedUser = localStorage.getItem("user");

      console.log("🔄 AuthProvider Check:", {
        token: !!token,
        refreshToken: !!refreshToken,
        savedUser: !!savedUser,
        currentPath: location.pathname,
      });

      if (token && refreshToken && savedUser) {
        try {
          const response = await authService.getCurrentUser();

          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log("✅ User authenticated from localStorage");

          if (["/login", "/register"].includes(location.pathname)) {
            navigate("/app/dashboard", { replace: true });
          }
        } catch (error) {
          console.error("❌ User validation failed:", error);

          // ✅ JIKA USER TIDAK VALID, LOGOUT OTOMATIS
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);

          if (location.pathname.startsWith("/app")) {
            navigate("/login", { replace: true });
          }
        }
      } else {
        console.log("ℹ️ User not authenticated");

        if (location.pathname.startsWith("/app")) {
          navigate("/login", { replace: true });
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [location.pathname, navigate]);

  // GANTI periodic validation dengan yang lebih efisien:
  useEffect(() => {
    let isMounted = true;

    const checkUserValidity = async () => {
      if (!isMounted || !user) return; // ✅ Skip jika tidak ada user

      try {
        await authService.getCurrentUser();
        console.log("✅ Periodic user validation: OK");
      } catch (error) {
        console.error("❌ Periodic user validation failed:", error);
        if (isMounted) {
          // Handle error
        }
      }
    };

    // Hanya setup interval jika user ada
    if (user) {
      const interval = setInterval(checkUserValidity, 5 * 60 * 1000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [user]); // ✅ Hanya depend on user

  // Auto refresh token mechanism - 60 MENIT
  // Di AuthProvider.jsx - PERBAIKI timing auto refresh
  useEffect(() => {
    let refreshInterval;

    const setupAutoRefresh = () => {
      if (refreshInterval) clearInterval(refreshInterval);

      console.log("⏰ Setting up auto refresh in 55 minutes...");

      // ✅ PERBAIKAN: Refresh 5 menit sebelum expired (55 menit)
      refreshInterval = setInterval(async () => {
        try {
          console.log("🔄 Auto refreshing token...");
          await authService.refreshToken();
          console.log("✅ Token refreshed successfully");
        } catch (error) {
          console.error("❌ Auto refresh failed:", error);
          logout();
        }
      }, 55 * 60 * 1000); // 55 menit
    };

    if (user) {
      // Setup auto refresh setelah 55 menit
      setupAutoRefresh();

      return () => {
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }
  }, [user]);

  // LOGIN - PERBAIKAN BESAR: JANGAN redirect jika error
  // LOGIN - PERBAIKAN: Throw error agar bisa ditangkap di component
  const login = async (credentials) => {
    setIsLoginLoading(true);
    try {
      console.log("🔄 AuthProvider: Attempting login...");

      const userData = await authService.login(credentials);
      setUser(userData);

      console.log("✅ AuthProvider: Login successful");

      // ✅ HANYA redirect jika login BERHASIL
      navigate("/app/dashboard", { replace: true });
      return { success: true };
    } catch (error) {
      console.error("❌ AuthProvider: Login failed", error);

      // ✅ THROW error agar bisa ditangkap di component Login
      throw error; // TAMBAHKAN INI
    } finally {
      setIsLoginLoading(false);
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isLoginLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// TAMBAHKAN fungsi validasi email di authService.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
