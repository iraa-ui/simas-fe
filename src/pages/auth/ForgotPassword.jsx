// src/pages/auth/ForgotPassword.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
import logo from "../../assets/logo-simas.png";
import { authService } from "../../service/authService";

// Import CSS yang sama untuk konsistensi
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

const StyledButton = styled(Button)(({ theme }) => ({
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
    color: "#9ca3af",
  },
  transition: "all 200ms ease",
}));

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    password_confirmation: "",
  });
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    otp: false,
    password: false,
    password_confirmation: false,
  });

  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
        setFieldErrors({
          email: false,
          otp: false,
          password: false,
          password_confirmation: false,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleClickShowPassword = () => {
    const input = passwordRef.current;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    setShowPassword((prev) => !prev);
    setTimeout(() => {
      input.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const handleClickShowConfirmPassword = () => {
    const input = confirmPasswordRef.current;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    setShowConfirmPassword((prev) => !prev);
    setTimeout(() => {
      input.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (error) {
      setError("");
      setFieldErrors({
        ...fieldErrors,
        [e.target.name]: false,
      });
    }
    setSuccess("");
  };

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({
      email: false,
      otp: false,
      password: false,
      password_confirmation: false,
    });
    setSuccess("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Format email tidak valid");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(form.email);
      setResetToken(response.token);

      setSuccess(
        `Kode OTP telah dikirim ke email ${form.email}. Silakan cek inbox atau folder spam.`
      );
      setStep(2);
    } catch (apiError) {
      let errorMessage = "Gagal mengirim OTP. Silakan coba lagi.";
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }
      if (apiError.response?.data?.errors) {
        const errors = apiError.response.data.errors;
        errorMessage = Object.values(errors).flat().join(", ");
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({
      email: false,
      otp: false,
      password: false,
      password_confirmation: false,
    });

    if (form.otp.length !== 6) {
      setError("Kode OTP harus 6 digit");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.verifyOtp(
        form.email,
        form.otp,
        resetToken
      );
      setResetToken(response.reset_token);
      setSuccess("Kode OTP valid");
      setStep(3);
    } catch (apiError) {
      let errorMessage = "Kode OTP tidak valid.";
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({
      email: false,
      otp: false,
      password: false,
      password_confirmation: false,
    });

    if (form.password !== form.password_confirmation) {
      setError("Password baru dan Konfirmasi Password Baru harus sesuai");
      setLoading(false);
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(form.password)) {
      setError(
        "Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, 1 angka, dan 1 karakter khusus (@$!%*?&)"
      );
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword(
        form.email,
        resetToken,
        form.password,
        form.password_confirmation
      );

      setSuccess(
        "Password berhasil direset! Silakan login dengan password baru."
      );

      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password berhasil direset! Silakan login dengan password baru.",
          },
        });
      }, 3000);
    } catch (apiError) {
      let errorMessage = "Gagal reset password. Silakan coba lagi.";
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }
      if (apiError.response?.data?.errors) {
        const errors = apiError.response.data.errors;
        errorMessage = Object.values(errors).flat().join(", ");
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Box
            component="form"
            onSubmit={handleRequestOtp}
            className="auth-form"
          >
            <Typography variant="h5" component="h1" className="auth-title">
              Lupa Password
            </Typography>
            <Typography variant="body2" className="auth-subtitle">
              Masukkan email Anda yang terdaftar. Kami akan mengirimkan kode OTP
              untuk mereset password.
            </Typography>

            <StyledTextField
              label="Email"
              name="email"
              type="email"
              margin="normal"
              fullWidth
              required
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              placeholder="contoh@email.com"
              error={fieldErrors.email}
            />

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              className="auth-submit-btn"
              disabled={loading || !form.email}
            >
              {loading ? (
                <CircularProgress size={24} className="loading-spinner" />
              ) : (
                "Kirim Kode OTP"
              )}
            </StyledButton>
          </Box>
        );

      case 2:
        return (
          <Box
            component="form"
            onSubmit={handleVerifyOtp}
            className="auth-form"
          >
            <Typography variant="h5" component="h1" className="auth-title">
              Verifikasi OTP
            </Typography>
            <Typography variant="body2" className="auth-subtitle">
              Masukkan 6-digit kode OTP yang dikirim ke{" "}
              <strong>{form.email}</strong>
            </Typography>

            <StyledTextField
              label="Kode OTP"
              name="otp"
              type="text"
              margin="normal"
              fullWidth
              required
              value={form.otp}
              onChange={handleChange}
              disabled={loading}
              inputProps={{ maxLength: 6 }}
              placeholder="123456"
              error={fieldErrors.otp}
            />

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              className="auth-submit-btn"
              disabled={loading || form.otp.length !== 6}
            >
              {loading ? (
                <CircularProgress size={24} className="loading-spinner" />
              ) : (
                "Verifikasi OTP"
              )}
            </StyledButton>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Tidak menerima kode?{" "}
              <MuiLink
                component="button"
                type="button"
                onClick={handleRequestOtp}
                className="auth-link"
                disabled={loading}
              >
                Kirim Ulang OTP
              </MuiLink>
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box
            component="form"
            onSubmit={handleResetPassword}
            className="auth-form"
          >
            <Typography variant="h5" component="h1" className="auth-title">
              Reset Password
            </Typography>
            <Typography variant="body2" className="auth-subtitle">
              Buat password baru untuk akun Anda
            </Typography>

            <StyledTextField
              label="Password Baru"
              name="password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              fullWidth
              required
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              placeholder="Password@123"
              helperText="Minimal 8 karakter, mengandung huruf besar, kecil, angka, dan karakter khusus"
              error={fieldErrors.password}
              inputRef={passwordRef}
              InputProps={{
                endAdornment: form.password && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword
                          ? "sembunyikan password"
                          : "tampilkan password"
                      }
                      onClick={handleClickShowPassword}
                      edge="end"
                      disabled={loading}
                      className="password-toggle-btn"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              label="Konfirmasi Password Baru"
              name="password_confirmation"
              type={showConfirmPassword ? "text" : "password"}
              margin="normal"
              fullWidth
              required
              value={form.password_confirmation}
              onChange={handleChange}
              disabled={loading}
              placeholder="Password@123"
              error={fieldErrors.password_confirmation}
              inputRef={confirmPasswordRef}
              InputProps={{
                endAdornment: form.password_confirmation && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showConfirmPassword
                          ? "sembunyikan password"
                          : "tampilkan password"
                      }
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                      disabled={loading}
                      className="password-toggle-btn"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              className="auth-submit-btn"
              disabled={
                loading || !form.password || !form.password_confirmation
              }
            >
              {loading ? (
                <CircularProgress size={24} className="loading-spinner" />
              ) : (
                "Reset Password"
              )}
            </StyledButton>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      key="forgot-password-page"
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

              <Grid item xs={12} md={6}>
                <Box className="auth-form-container">
                  {success && (
                    <Alert severity="success" className="auth-alert success">
                      {success}
                    </Alert>
                  )}
                  {error && (
                    <Alert
                      severity="error"
                      className="auth-alert error"
                      onClose={() => {
                        setError("");
                        setFieldErrors({
                          email: false,
                          otp: false,
                          password: false,
                          password_confirmation: false,
                        });
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  {renderStepContent()}

                  <Box className="auth-links">
                    <Typography variant="body2" className="auth-link-text">
                      <MuiLink
                        component={RouterLink}
                        to="/login"
                        className="auth-link"
                      >
                        ← Kembali ke Login
                      </MuiLink>
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="body2" className="auth-footer">
              ©{new Date().getFullYear()} Simas79. Hak Cipta Dilindungi
            </Typography>
          </Paper>
        </Container>
      </Box>
    </motion.div>
  );
};

export default ForgotPassword;
