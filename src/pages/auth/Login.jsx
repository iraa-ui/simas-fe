// src/pages/auth/Login.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../provider/AuthProvider";
import { motion } from "framer-motion";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Link as MuiLink,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { Link as RouterLink, useLocation } from "react-router-dom";
import logo from "../../assets/logo-simas.png";

// Import file CSS untuk styling konsisten
import "../../styles/auth-styles.css";

const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== "error",
})(({ theme, error }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    borderRadius: "50px",
    "& fieldset": {
      borderColor: error ? "#ef4444" : "#e2e8f0",
      borderWidth: "2px",
    },
    "&:hover fieldset": {
      borderColor: error ? "#ef4444" : "#3b82f6",
    },
    "&.Mui-focused fieldset": {
      borderColor: error ? "#ef4444" : "#3b82f6",
      borderWidth: "2px",
      boxShadow: error
        ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
        : "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    "& .MuiInputAdornment-root": {
      marginRight: "12px",
    },
    "& .MuiIconButton-root": {
      color: "#64748b",
      "&:hover": {
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        color: "#3b82f6",
      },
    },
  },
  "& .MuiInputLabel-root": {
    transform: "translate(18px, 18px) scale(1)",
    "&.Mui-focused": {
      transform: "translate(18px, -9px) scale(0.75)",
      color: error ? "#ef4444" : "#3b82f6",
    },
    "&.MuiFormLabel-filled": {
      transform: "translate(18px, -9px) scale(0.75)",
    },
    "&.Mui-error": {
      color: "#ef4444",
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: "16.5px 18px",
    paddingRight: "50px",
    fontSize: "14px",
  },
  "& .MuiFormHelperText-root": {
    marginLeft: "18px",
    color: error ? "#ef4444" : "#64748b",
    fontSize: "12px",
    marginTop: "4px",
  },
  marginBottom: "20px",
}));

const StyledLoginButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "#ffffff",
  fontWeight: 600,
  borderRadius: "50px",
  padding: "14px 28px",
  textTransform: "none",
  fontSize: "15px",
  letterSpacing: "0.3px",
  boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
  "&:hover": {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    boxShadow: "0 6px 10px -1px rgba(59, 130, 246, 0.4)",
    transform: "translateY(-2px)",
  },
  "&:disabled": {
    background: "#cbd5e1",
    boxShadow: "none",
    transform: "none",
  },
  transition: "all 200ms ease",
}));

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false,
  });
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });
  const passwordRef = useRef(null);

  const { login, isLoginLoading } = useAuth();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  // 🔥 FUNGSI VALIDASI EMAIL
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) return "Email harus diisi";
    if (!emailRegex.test(email)) return "Format email tidak valid";
    if (email.length < 6) return "Email terlalu pendek";
    if (!email.includes("@")) return "Email harus mengandung @";
    if (!email.includes(".") || email.split(".").pop().length < 2)
      return "Domain email tidak valid";

    return "";
  };

  // 🔥 FUNGSI VALIDASI PASSWORD
  const validatePassword = (password) => {
    if (!password) return "Password harus diisi";
    if (password.length < 8) return "Password minimal 8 karakter";

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    const errors = [];
    if (!hasUpperCase) errors.push("huruf kapital");
    if (!hasLowerCase) errors.push("huruf kecil");
    if (!hasNumbers) errors.push("angka");
    if (!hasSpecialChar) errors.push("karakter khusus");

    if (errors.length > 0) {
      return `Password harus mengandung: ${errors.join(", ")}`;
    }

    return "";
  };

  // 🔥 FUNGSI CEK APAKAH FORM VALID
  const isFormValid = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    return emailError === "" && passwordError === "";
  };

  // 🔥 HANDLE CHANGE EMAIL
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Validasi real-time
    const emailError = validateEmail(value);
    setValidationErrors((prev) => ({
      ...prev,
      email: emailError,
    }));

    // Reset error state
    if (error) {
      setError("");
      setFieldErrors({ email: false, password: fieldErrors.password });
    }
    if (successMsg) setSuccessMsg("");
  };

  // 🔥 HANDLE CHANGE PASSWORD
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Validasi real-time
    const passwordError = validatePassword(value);
    setValidationErrors((prev) => ({
      ...prev,
      password: passwordError,
    }));

    // Reset error state
    if (error) {
      setError("");
      setFieldErrors({ email: fieldErrors.email, password: false });
    }
    if (successMsg) setSuccessMsg("");
  };

  // 🔥 BARU: Auto-hide error setelah 3 detik
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
        setFieldErrors({ email: false, password: false });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // 🔥 PERBAIKAN: Fungsi toggle yang maintain cursor position dengan ref
  const handleClickShowPassword = () => {
    const input = passwordRef.current;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;

    setShowPassword((prev) => !prev);

    setTimeout(() => {
      input.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({ email: false, password: false });

    // 🔥 VALIDASI FINAL SEBELUM SUBMIT
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setValidationErrors({
        email: emailError,
        password: passwordError,
      });
      setError("Harap perbaiki error di atas sebelum login");
      return;
    }

    try {
      await login({ email, password });
    } catch (error) {
      let errorMessage = "Login gagal";
      let emailError = false;
      let passwordError = false;

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage =
          "Koneksi timeout. Silakan coba lagi atau periksa koneksi internet Anda.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;

        if (
          errorMessage.includes("Email Anda belum terdaftar") ||
          errorMessage.includes("email") ||
          errorMessage.includes("terdaftar")
        ) {
          emailError = true;
        } else if (
          errorMessage.includes("Password Anda salah") ||
          errorMessage.includes("password") ||
          errorMessage.includes("kredensial") ||
          errorMessage.includes("salah")
        ) {
          passwordError = true;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setFieldErrors({ email: emailError, password: passwordError });

      if (passwordError) {
        setPassword("");
      }
    }
  };

  return (
    <motion.div
      key="login-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <Box className="auth-page-container">
        <Container maxWidth="lg">
          <Paper className="auth-card">
            <Grid
              container
              spacing={6}
              alignItems="center"
              justifyContent="center"
            >
              {/* Gambar kiri */}
              <Grid item xs={12} md={6} className="auth-logo-section">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <img src={logo} alt="Logo Simas79" className="auth-logo" />
                  <Box className="logo-text-section"></Box>
                </motion.div>
              </Grid>

              {/* Form kanan */}
              <Grid item xs={12} md={6}>
                <Box className="auth-form-container">
                  <Typography
                    variant="h5"
                    component="h1"
                    className="auth-title"
                  >
                    Selamat Datang
                  </Typography>
                  <Typography variant="body2" className="auth-subtitle">
                    Silakan masuk ke akun Anda
                  </Typography>

                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    className="auth-form"
                  >
                    {successMsg && (
                      <Alert
                        severity="success"
                        className="auth-alert success"
                        onClose={() => setSuccessMsg("")}
                      >
                        {successMsg}
                      </Alert>
                    )}
                    {error && (
                      <Alert
                        severity="error"
                        className="auth-alert error"
                        onClose={() => {
                          setError("");
                          setFieldErrors({ email: false, password: false });
                        }}
                      >
                        {error}
                      </Alert>
                    )}

                    <StyledTextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      error={fieldErrors.email || !!validationErrors.email}
                      helperText={validationErrors.email}
                      onChange={handleEmailChange}
                      disabled={isLoginLoading}
                    />

                    <StyledTextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      error={
                        fieldErrors.password || !!validationErrors.password
                      }
                      helperText={validationErrors.password}
                      onChange={handlePasswordChange}
                      disabled={isLoginLoading}
                      inputRef={passwordRef}
                      InputProps={{
                        sx: {
                          "& .MuiOutlinedInput-input": {
                            paddingRight: "50px",
                          },
                        },
                        endAdornment: password && (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showPassword
                                  ? "sembunyikan password"
                                  : "tampilkan password"
                              }
                              onClick={handleClickShowPassword}
                              edge="end"
                              disabled={isLoginLoading}
                              className="password-toggle-btn"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <StyledLoginButton
                      type="submit"
                      fullWidth
                      variant="contained"
                      className="auth-submit-btn"
                      disabled={isLoginLoading || !isFormValid()}
                    >
                      {isLoginLoading ? (
                        <CircularProgress
                          size={24}
                          className="loading-spinner"
                        />
                      ) : (
                        "Masuk"
                      )}
                    </StyledLoginButton>

                    <Box className="auth-links">
                      <Typography variant="body2" className="auth-link-text">
                        Belum punya akun?{" "}
                        <MuiLink
                          component={RouterLink}
                          to="/register"
                          className="auth-link"
                        >
                          Daftar Sekarang
                        </MuiLink>
                      </Typography>
                      <Typography variant="body2" className="auth-link-text">
                        Lupa password?{" "}
                        <MuiLink
                          component={RouterLink}
                          to="/forgot-password"
                          className="auth-link"
                        >
                          Reset Password
                        </MuiLink>
                      </Typography>
                    </Box>

                    <Typography variant="body2" className="auth-footer">
                      ©{new Date().getFullYear()} Simas79. Hak Cipta Dilindungi
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </motion.div>
  );
};

export default Login;
