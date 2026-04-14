// ============================================================
// FILE: src/service/authService.js  (VERSI MOCK dengan Register)
//
// CARA KERJA:
//   - register() → simpan akun ke localStorage
//   - login()    → cek email & password harus cocok dengan akun yang sudah didaftar
//   - logout()   → hapus session
//
// CATATAN: Data akun tersimpan di localStorage dengan key "registeredUsers"
//          Jadi akun tetap ada selama localStorage tidak dihapus
// ============================================================

const STORAGE_KEY = "simas_registered_users";

// Ambil semua akun yang sudah terdaftar dari localStorage
const getRegisteredUsers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Simpan akun ke localStorage
const saveRegisteredUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const authService = {

  // REGISTER — simpan akun baru ke localStorage
  async register(userData) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { name, username, email, password, password_confirmation } = userData;

    // Validasi password cocok
    if (password !== password_confirmation) {
      const err = new Error("Password tidak cocok");
      err.response = {
        data: { message: "Password dan konfirmasi password tidak cocok!" }
      };
      throw err;
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      const err = new Error("Password terlalu pendek");
      err.response = {
        data: { errors: { password: ["Password minimal 6 karakter"] } }
      };
      throw err;
    }

    const users = getRegisteredUsers();

    // Cek apakah email sudah terdaftar
    const emailExists = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      const err = new Error("Email sudah terdaftar");
      err.response = {
        data: { errors: { email: ["Email sudah terdaftar, gunakan email lain"] } }
      };
      throw err;
    }

    // Simpan akun baru
    const newUser = {
      id: Date.now(),
      nama: name,
      username,
      email: email.toLowerCase(),
      password, // di aplikasi nyata ini di-hash, tapi untuk demo cukup begini
      role: "user",
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    console.log("[mockAuth] Akun berhasil didaftarkan:", email);
    return { message: "Registrasi berhasil! Silakan login." };
  },

  // LOGIN — cek email & password
  async login(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { email, password } = credentials;
    const users = getRegisteredUsers();

    // Cari akun berdasarkan email
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // Email tidak ditemukan
    if (!user) {
      const err = new Error("Email tidak terdaftar");
      err.response = {
        data: { message: "Email belum terdaftar. Silakan daftar terlebih dahulu." }
      };
      throw err;
    }

    // Password salah
    if (user.password !== password) {
      const err = new Error("Password salah");
      err.response = {
        data: { message: "Password yang kamu masukkan salah." }
      };
      throw err;
    }

    // Login berhasil — simpan session
    const token = "mock-token-" + Date.now();
    const refreshToken = "mock-refresh-" + Date.now();

    const sessionUser = {
      id: user.id,
      name: user.nama,   // field "name" untuk Topbar
      nama: user.nama,   // field "nama" untuk halaman lain
      username: user.username,
      email: user.email,
      role: user.role,
    };

    localStorage.setItem("authToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(sessionUser));

    console.log("[mockAuth] Login berhasil:", email);
    return sessionUser;
  },

  // LOGOUT — hapus session
  async logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    console.log("[mockAuth] Logout berhasil");
  },

  // GET CURRENT USER — dari localStorage
  async getCurrentUser() {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");
    if (!savedUser || !token) {
      throw new Error("Tidak ada sesi aktif");
    }
    return JSON.parse(savedUser);
  },

  // REFRESH TOKEN — selalu berhasil
  async refreshToken() {
    const newToken = "mock-token-" + Date.now();
    localStorage.setItem("authToken", newToken);
    return newToken;
  },

  // FORGOT PASSWORD — simulasi saja
  async forgotPassword(email) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const users = getRegisteredUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const err = new Error("Email tidak ditemukan");
      err.response = { data: { message: "Email tidak terdaftar di sistem." } };
      throw err;
    }
    return { message: "Link reset password telah dikirim ke email kamu." };
  },

  async verifyOtp(email, otp, token) {
    return { message: "OTP valid", reset_token: "mock-reset-token" };
  },

  async resetPassword(email, resetToken, password, passwordConfirmation) {
    return { message: "Password berhasil direset" };
  },
};

export default authService;