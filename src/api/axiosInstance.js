// src/api/axiosInstance.js
import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const API_BASE_URL = "https://simas-be-dev.cloudias79.com/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ✅ TAMBAHKAN Request Interceptor (yg sebelumnya hilang)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor - LOGIC SAMA PERSIS, hanya struktur diperbaiki
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ API Success:", response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.log("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
    });

    // ✅ PERBAIKAN: SKIP UNTUK ENDPOINT LOGIN & REGISTER
    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register") ||
      originalRequest.url.includes("/auth/forgot-password") ||
      originalRequest.url.includes("/auth/verify-otp") ||
      originalRequest.url.includes("/auth/reset-password")
    ) {
      console.log("🔶 Auth endpoint error, reject normally");
      return Promise.reject(error);
    }

    // ✅ FIX: URUTAN YANG BENAR
    // 1. Skip non-401 errors dulu
    if (error.response?.status !== 401) {
      console.log("🔶 Non-401 error, reject normally");
      return Promise.reject(error);
    }

    // 2. Skip jika sudah retry atau endpoint refresh
    if (
      originalRequest._retry ||
      originalRequest.url.includes("/auth/refresh")
    ) {
      console.log("🔶 Already retried or refresh endpoint, reject");
      return Promise.reject(error);
    }

    // 3. Cek error karena user deleted dari database
    const errorMessage = error.response?.data?.message || "";
    if (
      errorMessage.includes("tidak ditemukan") ||
      errorMessage.includes("Akun tidak ditemukan")
    ) {
      console.log("🚨 User deleted from database, auto logout");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // 4. Validasi refresh token
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.log("🔶 No refresh token, redirect to login");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // ✅ PERBAIKAN: Tambahkan queue system untuk handle multiple requests
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // ✅ Mulai proses refresh token
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.log("🔄 Attempting token refresh...");

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const { access_token } = response.data;

      if (!access_token) {
        throw new Error("No access token in refresh response");
      }

      console.log("✅ Token refreshed successfully");
      localStorage.setItem("authToken", access_token);

      // ✅ PERBAIKAN: Process queue sebelum retry request
      processQueue(null, access_token);

      // Update header dan retry request
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      console.error("❌ Token refresh failed:", refreshError);

      // ✅ PERBAIKAN: Process queue dengan error
      processQueue(refreshError, null);

      // ✅ FIX: Clear data dan redirect
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // ✅ FIX: Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
