// src/layouts/Layouts/Sidebar.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// Import CSS
import "../../styles/layout-styles.css";
import logo from "../../assets/topbar-logo.png";

// Menu Items
const menuItems = [
  { text: "Dashboard", path: "/app/dashboard", icon: <DashboardIcon /> },
  { text: "Master Aset", path: "/app/master-aset", icon: <InventoryIcon /> },
  { text: "Karyawan", path: "/app/karyawans", icon: <PeopleIcon /> },
  {
    text: "Peminjaman & Pengembalian Aset",
    displayText: "Peminjaman &\nPengembalian Aset",
    path: "/app/peminjaman-pengembalian",
    icon: <CalendarMonthIcon />,
  },
  {
    text: "Penjualan Aset",
    path: "/app/penjualan-aset",
    icon: <ShoppingCartIcon />,
  },
  {
    text: "Stok barang",
    path: "/app/stokbarang",
    icon: <ShowChartIcon />,
  },
  {
    text: "Kendala Barang",
    path: "/app/kendala-barang",
    icon: <ReportProblemIcon />,
  },
];

// Styled Drawer
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "width",
})(({ theme, open, width }) => ({
  width: open ? width : "70px",
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    backgroundColor: "var(--sidebar-bg)",
    color: "var(--sidebar-text)",
    borderRight: "1px solid var(--sidebar-border)",
    boxShadow: "2px 0 12px rgba(0, 0, 0, 0.1)",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    width: open ? width : "70px",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
  },
}));

const Sidebar = ({ open, width = 260, onToggleSidebar }) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <Drawer
      variant="permanent"
      open={open}
      width={width}
      className={`sidebar ${open ? "open" : ""}`}
    >
      {/* Logo di atas */}
      <Box className="sidebar-logo-container">
        <img
          src={logo}
          alt="SIMAS79"
          className="sidebar-logo"
          style={{
            width: open ? "180px" : "0",
            height: open ? "auto" : "0",
            transition: "all var(--transition-normal)",
          }}
        />

        {/* Toggle Button - POSISI DI TENGAH VERTIKAL */}
        <IconButton
          onClick={onToggleSidebar}
          className="sidebar-toggle-btn"
          size="small"
          sx={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "#f8fafc",
            "&:hover": {
              backgroundColor: "#e2e8f0",
            },
          }}
        >
          {open ? (
            <ChevronLeftIcon sx={{ color: "#475569" }} />
          ) : (
            <MenuIcon sx={{ color: "#475569" }} />
          )}
        </IconButton>
      </Box>

      {/* Menu Items */}
      <List className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const displayText = item.displayText || item.text;

          return (
            <ListItem
              key={item.text}
              disablePadding
              className="sidebar-item"
              onMouseEnter={() => setHoveredItem(item.text)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {!open && (
                <Tooltip
                  title={item.text}
                  placement="right"
                  arrow
                  classes={{ tooltip: "sidebar-tooltip" }}
                >
                  <span>
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      className={`sidebar-button ${isActive ? "active" : ""}`}
                      sx={{
                        justifyContent: "center",
                        px: 2.5,
                        minHeight: 44,
                        mb: 0.5,
                        backgroundColor: isActive ? "#0057b8" : "transparent",
                        "&:hover": {
                          backgroundColor: isActive ? "#0057b8" : "#f1f5f9",
                        },
                      }}
                    >
                      <ListItemIcon
                        className="sidebar-icon"
                        sx={{
                          mr: 0,
                          minWidth: "auto",
                          color: isActive ? "white" : "#64748b",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                    </ListItemButton>
                  </span>
                </Tooltip>
              )}

              {open && (
                <ListItemButton
                  component={Link}
                  to={item.path}
                  className={`sidebar-button ${isActive ? "active" : ""}`}
                  sx={{
                    justifyContent: "flex-start",
                    px: 2.5,
                    minHeight: 44,
                    mb: 0.5,
                    "& .MuiListItemIcon-root": {
                      color: isActive ? "white" : "#64748b",
                    },
                  }}
                >
                  <ListItemIcon className="sidebar-icon">
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={displayText.split("\n").map((line, index) => (
                      <div key={index} style={{ whiteSpace: "normal" }}>
                        {line}
                        {index < displayText.split("\n").length - 1 && <br />}
                      </div>
                    ))}
                    className="sidebar-text"
                    sx={{
                      opacity: open ? 1 : 0,
                      transition: "opacity 0.3s",
                      "& .MuiTypography-root": {
                        fontSize: "14px",
                        fontWeight: 500,
                        color: isActive ? "white" : "#1e293b",
                      },
                    }}
                  />
                </ListItemButton>
              )}
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
