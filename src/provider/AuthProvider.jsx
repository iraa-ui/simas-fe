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

  // Cek status login pas aplikasi pertama kali di-load
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

      // Kalau data di storage lengkap, coba validasi ke server
      if (token && refreshToken && savedUser) {
        try {
          await authService.getCurrentUser();

          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log("✅ User authenticated from localStorage");

          // Kalau udah login tapi iseng buka page login/register, balikin ke dashboard
          if (["/login", "/register"].includes(location.pathname)) {
            navigate("/app/dashboard", { replace: true });
          }
        } catch (error) {
          console.error("❌ User validation failed:", error);

          // Jaga-jaga kalau token nggak valid (expired/tampered), langsung clear semua
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);

          // Kalau gagal pas lagi di dalem menu /app, lempar ke login
          if (location.pathname.startsWith("/app")) {
            navigate("/login", { replace: true });
          }
        }
      } else {
        console.log("ℹ️ User not authenticated");

        // Tendang ke login kalau coba-coba akses menu internal tanpa auth
        if (location.pathname.startsWith("/app")) {
          navigate("/login", { replace: true });
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [location.pathname, navigate]);

  // Validasi user tiap 5 menit buat mastiin session masih idup
  useEffect(() => {
    let isMounted = true;

    const checkUserValidity = async () => {
      if (!isMounted || !user) return; 

      try {
        await authService.getCurrentUser();
        console.log("✅ Periodic user validation: OK");
      } catch (error) {
        console.error("❌ Periodic user validation failed:", error);
        if (isMounted) {
          // Tambahin logic handle error di sini kalau perlu
        }
      }
    };

    // Setting interval cuma kalau usernya lagi login aja
    if (user) {
      const interval = setInterval(checkUserValidity, 5 * 60 * 1000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [user]);

  // Auto refresh token tiap 55 menit (sebelum token utama mati di menit 60)
  useEffect(() => {
    let refreshInterval;

    const setupAutoRefresh = () => {
      if (refreshInterval) clearInterval(refreshInterval);

      console.log("⏰ Setting up auto refresh in 55 minutes...");

      refreshInterval = setInterval(async () => {
        try {
          console.log("🔄 Auto refreshing token...");
          await authService.refreshToken();
          console.log("✅ Token refreshed successfully");
        } catch (error) {
          console.error("❌ Auto refresh failed:", error);
          logout(); // Kalau gagal refresh, mending force logout buat keamanan
        }
      }, 55 * 60 * 1000); 
    };

    if (user) {
      setupAutoRefresh();

      return () => {
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }
  }, [user]);

  // Handle proses login
  const login = async (credentials) => {
    setIsLoginLoading(true);
    try {
      console.log("🔄 AuthProvider: Attempting login...");

      const userData = await authService.login(credentials);
      setUser(userData);

      console.log("✅ AuthProvider: Login successful");

      // Cuma pindah page kalau login beneran tembus
      navigate("/app/dashboard", { replace: true });
      return { success: true };
    } catch (error) {
      console.error("❌ AuthProvider: Login failed", error);
      // Lempar error ke component (Login.jsx) biar bisa munculin notif error di UI
      throw error; 
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Bersih-bersih data pas user logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Apapun yang terjadi (API error atau nggak), storage harus bersih dan balik ke login
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

// Hook biar gampang panggil data auth di component lain
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Helper buat cek format email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};