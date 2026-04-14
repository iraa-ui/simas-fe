import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import {
  FaHome,
  FaChartLine,
  FaMoneyBill,
  FaCalendarAlt,
  FaShieldAlt,
  FaBox,
  FaUser,
} from "react-icons/fa";
import { FaU } from "react-icons/fa6";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FaHome /> Dashboard Utama
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/master-aset"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FaBox /> Master Aset
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/stock-opname"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FaChartLine /> Stock Opname
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/penjualan-aset"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FaMoneyBill /> Penjualan Aset
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/peminjaman-pengembalian"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FaCalendarAlt /> Peminjaman & Pengembalian Aset
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/kendala-barang"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FaShieldAlt /> Kendala barang
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/karyawans"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FaUser /> Karyawan
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
