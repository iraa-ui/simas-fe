// src/pages/auth/Register.jsx
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
    "&.Mui-error fieldset": {
      borderColor: "#ef4444",
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

const StyledRegisterButton = styled(Button)(({ theme }) => ({
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

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    username: false,
    email: false,
    password: false,
    password_confirmation: false,
  });
  const [fieldErrorMessages, setFieldErrorMessages] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  // 🔥 FUNGSI VALIDASI ANGKA PADA NAMA DAN USERNAME
  const validateNoNumbers = (value) => {
    const hasNumbers = /\d/.test(value);
    return !hasNumbers;
  };

  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const navigate = useNavigate();

  // 🔥 TAMBAHKAN FUNGSI VALIDASI FORM
  const isFormValid = () => {
    // Cek apakah semua field required terisi
    const isAllFieldsFilled =
      form.name.trim() !== "" &&
      form.username.trim() !== "" &&
      form.email.trim() !== "" &&
      form.password.trim() !== "" &&
      form.password_confirmation.trim() !== "";

    // Cek apakah tidak ada error di field manapun
    const hasNoFieldErrors =
      !fieldErrors.name &&
      !fieldErrors.username &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      !fieldErrors.password_confirmation;

    // Cek validasi angka untuk nama dan username
    const hasNoNumbersInName = validateNoNumbers(form.name);
    const hasNoNumbersInUsername = validateNoNumbers(form.username);

    return (
      isAllFieldsFilled &&
      hasNoFieldErrors &&
      hasNoNumbersInName &&
      hasNoNumbersInUsername
    );
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
        setFieldErrors({
          name: false,
          username: false,
          email: false,
          password: false,
          password_confirmation: false,
        });
        setFieldErrorMessages({
          name: "",
          username: "",
          email: "",
          password: "",
          password_confirmation: "",
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // 🔥 PERBAIKAN: Fungsi toggle yang maintain cursor position
  const handleClickShowPassword = () => {
    // Simpan cursor position sebelum toggle
    const input = passwordRef.current;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;

    setShowPassword((prev) => !prev);

    // Restore cursor position setelah render
    setTimeout(() => {
      input.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const handleClickShowConfirmPassword = () => {
    // Simpan cursor position sebelum toggle
    const input = confirmPasswordRef.current;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;

    setShowConfirmPassword((prev) => !prev);

    // Restore cursor position setelah render
    setTimeout(() => {
      input.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    // Reset error untuk field yang sedang diubah
    if (error) {
      setError("");
    }
    setSuccess("");

    // 🔥 VALIDASI REAL-TIME UNTUK NAMA DAN USERNAME
    if (name === "name" || name === "username") {
      const isValid = validateNoNumbers(value);

      setFieldErrors((prev) => ({
        ...prev,
        [name]: !isValid,
      }));

      setFieldErrorMessages((prev) => ({
        ...prev,
        [name]: !isValid
          ? `${
              name === "name" ? "Nama lengkap" : "Username"
            } tidak boleh mengandung angka`
          : "",
      }));

      // Reset field errors lainnya
      setFieldErrors((prev) => ({
        ...prev,
        email: false,
        password: false,
        password_confirmation: false,
      }));
    } else {
      // Reset error untuk field lainnya
      setFieldErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
      setFieldErrorMessages((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // 🔥 VALIDASI SEBELUM SUBMIT: CEK APAKAH ADA ANGKA PADA NAMA ATAU USERNAME
    const nameHasNumbers = !validateNoNumbers(form.name);
    const usernameHasNumbers = !validateNoNumbers(form.username);

    if (nameHasNumbers || usernameHasNumbers) {
      setFieldErrors({
        name: nameHasNumbers,
        username: usernameHasNumbers,
        email: false,
        password: false,
        password_confirmation: false,
      });
      setFieldErrorMessages({
        name: nameHasNumbers ? "Nama lengkap tidak boleh mengandung angka" : "",
        username: usernameHasNumbers
          ? "Username tidak boleh mengandung angka"
          : "",
        email: "",
        password: "",
        password_confirmation: "",
      });
      setError("Terdapat kesalahan pada input. Silakan periksa kembali.");
      setLoading(false);
      return;
    }

    // ✅ TAMBAHKAN DEKLARASI VARIABEL DI SINI
    let emailError = false;
    let passwordError = false;

    if (form.password !== form.password_confirmation) {
      setError("Password dan konfirmasi password tidak cocok!");
      // 🔥 PERBAIKAN: Set field errors untuk password confirmation
      setFieldErrors({
        name: false,
        username: false,
        email: false,
        password: true,
        password_confirmation: true,
      });
      setFieldErrorMessages({
        name: "",
        username: "",
        email: "",
        password: "Password tidak cocok",
        password_confirmation: "Password tidak cocok",
      });
      setLoading(false);
      return;
    }

    try {
      await authService.register(form);
      setSuccess("Registrasi berhasil! Silakan login.");

      setTimeout(() => {
        navigate("/login", {
          state: { message: "Registrasi berhasil! Silakan login." },
        });
      }, 2000);
    } catch (apiError) {
      let errorMessage = "Pendaftaran gagal. Silakan coba lagi.";

      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;

        // 🔥 BARU: Deteksi jenis error untuk field tertentu
        if (errorMessage.includes("email") || errorMessage.includes("Email")) {
          emailError = true;
        }
        if (
          errorMessage.includes("password") ||
          errorMessage.includes("Password")
        ) {
          passwordError = true;
        }
      }
      if (apiError.response?.data?.errors) {
        const errors = apiError.response.data.errors;
        errorMessage = Object.values(errors).flat().join(", ");
        if (errors.email) emailError = true;
        if (errors.password) passwordError = true;
      }

      // ✅ SET FIELD ERRORS SETELAH VARIABEL SUDAH DIDEKLARASI
      // 🔥 PERBAIKAN: Include semua field
      setFieldErrors({
        name: false,
        username: false,
        email: emailError,
        password: passwordError,
        password_confirmation: false,
      });

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="register-page"
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
              {/* Form di kiri */}
              <Grid item xs={12} md={6}>
                <Box className="auth-form-container">
                  <Typography
                    variant="h5"
                    component="h1"
                    className="auth-title"
                  >
                    Daftar Akun
                  </Typography>
                  <Typography variant="body2" className="auth-subtitle">
                    Buat akun baru untuk mulai menggunakan SIMAS79
                  </Typography>

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
                          name: false,
                          username: false,
                          email: false,
                          password: false,
                          password_confirmation: false,
                        });
                        setFieldErrorMessages({
                          name: "",
                          username: "",
                          email: "",
                          password: "",
                          password_confirmation: "",
                        });
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    className="auth-form"
                  >
                    {/* 🔥 FIELD NAMA DENGAN VALIDASI ANGKA */}
                    <StyledTextField
                      label="Nama Lengkap"
                      name="name"
                      margin="normal"
                      fullWidth
                      required
                      value={form.name}
                      onChange={handleChange}
                      disabled={loading}
                      error={fieldErrors.name}
                      helperText={fieldErrorMessages.name}
                    />

                    {/* 🔥 FIELD USERNAME DENGAN VALIDASI ANGKA */}
                    <StyledTextField
                      label="Username"
                      name="username"
                      margin="normal"
                      fullWidth
                      required
                      value={form.username}
                      onChange={handleChange}
                      disabled={loading}
                      error={fieldErrors.username}
                      helperText={fieldErrorMessages.username}
                    />

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
                      error={fieldErrors.email}
                      helperText={
                        fieldErrors.email ? "Format email tidak valid" : ""
                      }
                    />

                    <StyledTextField
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      margin="normal"
                      fullWidth
                      required
                      value={form.password}
                      onChange={handleChange}
                      disabled={loading}
                      error={fieldErrors.password}
                      inputRef={passwordRef}
                      InputProps={{
                        sx: {
                          "& .MuiOutlinedInput-input": {
                            paddingRight: "50px",
                          },
                        },
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

                    <StyledTextField
                      label="Konfirmasi Password"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      margin="normal"
                      fullWidth
                      required
                      value={form.password_confirmation}
                      onChange={handleChange}
                      disabled={loading}
                      error={fieldErrors.password_confirmation}
                      inputRef={confirmPasswordRef}
                      InputProps={{
                        sx: {
                          "& .MuiOutlinedInput-input": {
                            paddingRight: "50px",
                          },
                        },
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
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <StyledRegisterButton
                      type="submit"
                      fullWidth
                      variant="contained"
                      className="auth-submit-btn"
                      disabled={loading || !isFormValid()}
                    >
                      {loading ? (
                        <CircularProgress
                          size={24}
                          className="loading-spinner"
                        />
                      ) : (
                        "Daftar"
                      )}
                    </StyledRegisterButton>

                    <Typography
                      variant="body2"
                      align="center"
                      className="auth-link-text"
                    >
                      Sudah punya akun?{" "}
                      <MuiLink
                        component={RouterLink}
                        to="/login"
                        className="auth-link"
                      >
                        Masuk Sekarang
                      </MuiLink>
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Gambar kanan */}
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

export default Register;
