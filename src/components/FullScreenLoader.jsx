import React from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import logo from "../assets/simas79.png";

const FullScreenLoader = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
      }}
    >
      <Card
        sx={{
          minWidth: 320,
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          p: 3,
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={logo}
            alt="SIMAS 79 Logo"
            style={{ height: "60px", marginBottom: "24px" }}
          />
          <CircularProgress size={50} sx={{ color: "#3b82f6", mb: 3 }} />
          <Typography variant="h6" sx={{ color: "text.secondary" }}>
            Memuat sesi Anda...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FullScreenLoader;
