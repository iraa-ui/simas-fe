import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

// 1. Buat Context
const NotificationContext = createContext(null);

// 2. Buat Provider
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null); // { message, severity, key }

  // Fungsi untuk memicu notifikasi
  const notify = useCallback((message, severity = "info") => {
    setNotification({ message, severity, key: new Date().getTime() });
  }, []);

  // Fungsi untuk menutup notifikasi
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {notification && (
        <Snackbar
          key={notification.key}
          open={true}
          autoHideDuration={5000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleClose}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
