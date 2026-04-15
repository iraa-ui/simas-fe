// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";

const PrivateRoute = ({ children }) => {
  // Ambil state auth dan loading dari context
  const { user, loading } = useAuth();
  const location = useLocation();

  // Tampilkan loading screen selama proses verifikasi session
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

  //  Debugging: Monitor status autentikasi dan token di console
  console.log("PrivateRoute Check:", {
    user: !!user,
    loading,
    currentPath: location.pathname,
    hasToken: !!localStorage.getItem("authToken"),
  });

  // Jika user tidak ditemukan, arahkan ke login dan simpan path terakhir di state
  if (!user) {
    console.log("❌ Redirect to login - No user");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  //  Autentikasi berhasil, render komponen anak (protected content)
  console.log("✅ Access granted to:", location.pathname);
  return children;
};

export default PrivateRoute;