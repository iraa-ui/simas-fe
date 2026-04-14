// src/layouts/Layouts/Topbar.jsx
import { useState } from "react";
import { useAuth } from "../../provider/AuthProvider";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
} from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";

// Import CSS
import "../../styles/layout-styles.css";

// Avatar colors by day
const getAvatarColor = () => {
  const day = new Date().getDay();
  const colors = [
    "#ef4444", // Sunday
    "#f97316", // Monday
    "#eab308", // Tuesday
    "#22c55e", // Wednesday
    "#0ea5e9", // Thursday
    "#3b82f6", // Friday
    "#8b5cf6", // Saturday
  ];
  return colors[day];
};

// Format date
const getFormattedDate = () => {
  const date = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

// Get user initials
const getInitials = (user) => {
  if (!user) return "U";

  if (user.name) {
    const nameParts = user.name.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (
        nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
      ).toUpperCase();
    }
  }

  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }

  return "U";
};

const Topbar = ({ sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const isMenuOpen = Boolean(anchorEl);
  const avatarColor = getAvatarColor();
  const currentDate = getFormattedDate();

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  // Profile menu component - DI DALAM Topbar.jsx
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      className="profile-menu"
      sx={{
        "& .MuiPaper-root": {
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          border: "1px solid #e2e8f0",
          minWidth: 240,
        },
      }}
    >
      {/* User Info Header */}
      <MenuItem disabled className="user-menu-header">
        <Box>
          <Typography variant="body2" className="username-display">
            @{user?.username || "username"}
          </Typography>
          <Typography variant="caption" className="user-divisi">
            {user?.divisi || "HC/GA"}
          </Typography>
          {user?.name && (
            <Typography
              variant="body2"
              sx={{
                fontSize: "13px",
                color: "#64748b",
                mt: 1,
                fontWeight: 500,
              }}
            >
              {user.name}
            </Typography>
          )}
        </Box>
      </MenuItem>

      <Divider className="menu-divider" />

      {/* Logout Button */}
      <MenuItem onClick={handleLogout} className="logout-button">
        <LogoutIcon className="logout-icon" />
        <Typography variant="body2">Keluar</Typography>
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <AppBar position="static" className="topbar" elevation={0}>
        <Toolbar
          sx={{
            minHeight: "var(--topbar-height) !important",
            height: "var(--topbar-height) !important",
            padding: "0 !important",
            width: "100%",
          }}
        >
          <Box className="topbar-content">
            {/* Spacer untuk mendorong konten ke kanan */}
            <Box className="topbar-spacer" />

            {/* User Info dan Avatar di ujung kanan */}
            <Box className="user-info-container">
              <Box className="user-info">
                <Typography variant="body1" className="user-name">
                  {user?.name || "Pengguna"}
                </Typography>
                <Typography variant="caption" className="current-date">
                  {currentDate}
                </Typography>
              </Box>

              <IconButton
                edge="end"
                onClick={handleProfileMenuOpen}
                className="avatar-button"
                sx={{ ml: 2 }}
              >
                <Avatar
                  sx={{
                    bgcolor: avatarColor,
                    color: "white",
                    width: 40,
                    height: 40,
                    fontSize: "14px",
                    fontWeight: 700,
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
                    border: "3px solid rgba(255, 255, 255, 0.9)",
                  }}
                  className="user-avatar"
                >
                  {getInitials(user)}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
    </>
  );
};

export default Topbar;
