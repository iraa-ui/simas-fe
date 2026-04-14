import React from "react";
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../provider/AuthProvider";

const ProtectedRoute = ({ children }) => {
  return children;

  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
