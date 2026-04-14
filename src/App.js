// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { AuthProvider } from "./provider/AuthProvider";
import AppRoutes from "./routes/AppRoutes";
import AuthWrapper from "./pages/auth/AuthWrapper";
import QrAssetDetail from "./pages/QrAssetDetail";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CssBaseline />
        <Routes>
          {/* ✅ ROUTE BARU UNTUK QR CODE - TARUH DI ATAS */}
          <Route path="/aset/:id" element={<QrAssetDetail />} />
          {/* semua route auth di bawah /login/* */}
          <Route path="/login/*" element={<AuthWrapper />} />
          {/* route utama lain */}
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
