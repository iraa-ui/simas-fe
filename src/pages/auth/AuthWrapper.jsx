// src/pages/auth/AuthWrapper.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./Login";
import Register from "./Register";

const AuthWrapper = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route index element={<Login />} /> {/* default route /login */}
        <Route path="register" element={<Register />} /> {/* /login/register */}
      </Routes>
    </AnimatePresence>
  );
};

export default AuthWrapper;
