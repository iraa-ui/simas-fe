// src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Layouts/Sidebar";
import Topbar from "./Layouts/Topbar";
import { Box, CssBaseline } from "@mui/material";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* Sidebar */}
      <Sidebar open={isSidebarOpen} onToggleSidebar={handleSidebarToggle} />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          ml: isSidebarOpen ? "280px" : "70px", // Sesuaikan dengan width sidebar
          transition: "margin-left 250ms ease",
          width: "100%",
        }}
      >
        {/* Topbar */}
        <Topbar sidebarOpen={isSidebarOpen} />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: "#f8fafc",
            minHeight: "calc(100vh - 70px)", // Sesuaikan dengan topbar height
            mt: "70px", // Margin top untuk topbar
            p: { xs: 1.5, sm: 2, md: 3 },
            transition: "all 250ms ease",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
