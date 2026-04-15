// Mengurus autentikasi: register, login, logout tanpa server

const STORAGE_KEY = "simas_registered_users";

// Mengambil semua akun yang sudah terdaftar dari localStorage
const getRegisteredUsers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Menyimpan daftar akun ke localStorage
const saveRegisteredUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const authService = {

  // Mendaftarkan akun baru
  async register(userData) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { name, username, email, password, password_confirmation } = userData;

    if (password !== password_confirmation) {
      const err = new Error("Password tidak cocok");
      err.response = { data: { message: "Password dan konfirmasi password tidak cocok!" } };
      throw err;
    }

    if (password.length < 6) {
      const err = new Error("Password terlalu pendek");
      err.response = { data: { errors: { password: ["Password minimal 6 karakter"] } } };
      throw err;
    }

    const users = getRegisteredUsers();

    const emailExists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      const err = new Error("Email sudah terdaftar");
      err.response = { data: { errors: { email: ["Email sudah terdaftar, gunakan email lain"] } } };
      throw err;
    }

    const newUser = {
      id: Date.now(),
      nama: name,
      username,
      email: email.toLowerCase(),
      password,
      role: "user",
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    return { message: "Registrasi berhasil! Silakan login." };
  },

  // Masuk ke aplikasi dengan email dan password
  async login(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { email, password } = credentials;
    const users = getRegisteredUsers();

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const err = new Error("Email tidak terdaftar");
      err.response = { data: { message: "Email belum terdaftar. Silakan daftar terlebih dahulu." } };
      throw err;
    }

    if (user.password !== password) {
      const err = new Error("Password salah");
      err.response = { data: { message: "Password yang kamu masukkan salah." } };
      throw err;
    }

    const token = "mock-token-" + Date.now();
    const refreshToken = "mock-refresh-" + Date.now();

    const sessionUser = {
      id: user.id,
      name: user.nama,
      nama: user.nama,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    localStorage.setItem("authToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(sessionUser));

    return sessionUser;
  },

  // Keluar dari aplikasi
  async logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  // Mengambil data user yang sedang login dari localStorage
  async getCurrentUser() {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");
    if (!savedUser || !token) throw new Error("Tidak ada sesi aktif");
    return JSON.parse(savedUser);
  },

  // Memperbarui token akses
  async refreshToken() {
    const newToken = "mock-token-" + Date.now();
    localStorage.setItem("authToken", newToken);
    return newToken;
  },

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