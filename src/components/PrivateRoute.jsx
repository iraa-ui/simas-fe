// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";

const PrivateRoute = ({ children }) => {
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

  // ✅ PERBAIKAN: Debug untuk melihat apa yang terjadi
  console.log("PrivateRoute Check:", {
    user: !!user,
    loading,
    currentPath: location.pathname,
    hasToken: !!localStorage.getItem("authToken"),
  });

  // Redirect to login if not authenticated
  if (!user) {
    console.log("❌ Redirect to login - No user");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Render protected content
  console.log("✅ Access granted to:", location.pathname);
  return children;
};

export default PrivateRoute;
