// src/components/PublicRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // Jika user sudah login, redirect ke dashboard
  if (user) {
    console.log("✅ User already authenticated, redirecting to dashboard");
    const from = location.state?.from?.pathname || "/app/dashboard";
    return <Navigate to={from} replace />;
  }

  // Jika belum login, tampilkan halaman login/register
  return children;
};

export default PublicRoute;
