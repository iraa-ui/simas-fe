// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "../components/PrivateRoute";
import PublicRoute from "../components/PublicRoute";

// Auth Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Dashboard
import Dashboard from "../pages/Dashboard";

// Karyawan Pages
import Karyawans from "../pages/Karyawans";
import TambahKaryawans from "../pages/TambahKaryawans";
import EditKaryawans from "../pages/EditKaryawans";

// Aset / Barang Pages
import MasterAset from "../pages/MasterAset";
import TambahAset from "../pages/TambahAset";
import EditAset from "../pages/EditAset";

import StokBarang from "../pages/StokBarang";
import TambahStokBarang from "../pages/TambahStokBarang";
import EditStokBarang from "../pages/EditStokBarang";

// Penjualan Aset Pages
import PenjualanAset from "../pages/PenjualanAset";
import TambahPenjualanAset from "../pages/TambahPenjualanAset";
import EditPenjualanAset from "../pages/EditPenjualanAset";

// Kendala Barang Pages
import KendalaBarang from "../pages/KendalaBarang";
import TambahKendalaBarang from "../pages/TambahKendalaBarang";
import EditKendalaBarang from "../pages/EditKendalaBarang";

// Peminjaman
import PeminjamanPengembalianAset from "../pages/PeminjamanPengembalianAset";
import TambahPeminjamanPengembalian from "../pages/TambahPeminjamanPengembalian";
import EditPeminjamanPengembalian from "../pages/EditPeminjamanPengembalian";

import QrAssetDetail from "../pages/QrAssetDetail";

function AppRoutes() {
  return (
    <Routes>
      {/* === Public Routes dengan Protection === */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      {/* === Default redirect untuk root === */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* === Protected Routes === */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* Karyawan */}
        <Route path="karyawans" element={<Karyawans />} />
        {/* ✅ PERBAIKAN: Sesuaikan dengan path di Karyawans.jsx */}
        <Route path="karyawans/tambah" element={<TambahKaryawans />} />
        <Route path="karyawans/edit/:id" element={<EditKaryawans />} />
        {/* Aset / Barang */}
        <Route path="master-aset" element={<MasterAset />} />
        {/* ✅ PERBAIKAN: Sesuaikan dengan path di MasterAset.jsx */}
        <Route path="master-aset/tambah" element={<TambahAset />} />
        <Route path="master-aset/edit/:id" element={<EditAset />} />
        {/* ✅ PERBAIKAN: Stok Barang Routes */}
        <Route path="stokbarang" element={<StokBarang />} />
        <Route path="stokbarang/tambah" element={<TambahStokBarang />} />{" "}
        <Route path="stokbarang/edit/:id" element={<EditStokBarang />} />{" "}
        {/* Penjualan Aset */}
        <Route path="penjualan-aset" element={<PenjualanAset />} />
        {/* ✅ PERBAIKAN: Sesuaikan dengan path di PenjualanAset.jsx */}
        <Route path="penjualan-aset/tambah" element={<TambahPenjualanAset />} />
        <Route path="penjualan-aset/edit/:id" element={<EditPenjualanAset />} />
        {/* Kendala Barang */}
        <Route path="kendala-barang" element={<KendalaBarang />} />
        {/* ✅ PERBAIKAN: Sesuaikan dengan path di KendalaBarang.jsx */}
        <Route path="kendala-barang/tambah" element={<TambahKendalaBarang />} />
        <Route path="kendala-barang/edit/:id" element={<EditKendalaBarang />} />
        {/* Peminjaman */}
        <Route
          path="peminjaman-pengembalian"
          element={<PeminjamanPengembalianAset />}
        />
        {/* ✅ PERBAIKAN: Sesuaikan dengan path di PeminjamanPengembalianAset.jsx */}
        <Route
          path="peminjaman-pengembalian/tambah"
          element={<TambahPeminjamanPengembalian />}
        />
        <Route
          path="peminjaman-pengembalian/edit/:id"
          element={<EditPeminjamanPengembalian />}
        />
      </Route>
      {/* === Fallback jika path tidak cocok === */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
