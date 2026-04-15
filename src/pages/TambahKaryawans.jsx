import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import mockApi from "../api/mockApi";
import {
  FaHome,
  FaChartLine,
  FaMoneyBill,
  FaCalendarAlt,
  FaShieldAlt,
  FaUser,
  FaBox,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/EditTambahKaryawans.css";

function TambahKaryawans() {
  // --- KONSTANTA & HOOKS ---
  const API_URL = "/karyawans";
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  // State untuk menyimpan data input form
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    status: "Inactive",
  });

  // State untuk menyimpan pesan error validasi dan status loading
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // --- EVENT HANDLERS ---
  // 🔹 Handle input perubahan value form dengan validasi real-time
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Menghapus pesan error saat pengguna mulai memperbaiki input
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // --- VALIDASI REAL-TIME UNTUK NIP ---
    if (name === "nip") {
      // Validasi karakter: Hanya memperbolehkan angka
      if (value && !/^\d*$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP harus berupa angka"],
        }));
        return;
      }

      // Validasi panjang: Maksimal 18 digit (dipotong otomatis jika lebih)
      if (value.length > 18) {
        setFormData((prev) => ({
          ...prev,
          nip: value.slice(0, 18),
        }));
        return;
      }

      // Validasi panjang minimal: Memberi peringatan jika kurang dari 9 digit
      if (value.length > 0 && value.length < 9) {
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP minimal 9 digit"],
        }));
      } else if (value.length === 0) {
        setErrors((prev) => ({
          ...prev,
          nip: "",
        }));
      }
    }

    // --- VALIDASI REAL-TIME UNTUK NAMA ---
    if (name === "nama") {
      // Validasi karakter: Hanya huruf, spasi, titik, kutip, dan dash
      if (value && !/^[a-zA-Z\s.'-]*$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          nama: ["Nama harus berupa huruf"],
        }));
        return;
      }

      // Validasi keberadaan: Memastikan nama tidak dihapus hingga kosong
      if (value.length === 0) {
        setErrors((prev) => ({
          ...prev,
          nama: ["Nama wajib diisi"],
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          nama: "",
        }));
      }
    }

    // Update state formData utama
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- LOGIC VALIDASI FORM ---
  // 🔹 Fungsi untuk memeriksa seluruh field sebelum proses submit
  const validateForm = () => {
    const newErrors = {};

    // Validasi NIP (Keberadaan, Karakter, Minimal 9, Maksimal 18)
    if (!formData.nip.trim()) {
      newErrors.nip = ["NIP wajib diisi."];
    } else if (!/^\d+$/.test(formData.nip)) {
      newErrors.nip = ["NIP harus berupa angka."];
    } else if (formData.nip.length < 9) {
      newErrors.nip = ["NIP minimal 9 digit."];
    } else if (formData.nip.length > 18) {
      newErrors.nip = ["NIP maksimal 18 digit."];
    }

    // Validasi Nama (Keberadaan, Panjang, Karakter)
    if (!formData.nama.trim()) {
      newErrors.nama = ["Nama wajib diisi."];
    } else if (formData.nama.length > 100) {
      newErrors.nama = ["Nama maksimal 100 karakter."];
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.nama)) {
      newErrors.nama = ["Nama harus berupa huruf."];
    }

    // Validasi Status (Default Inactive untuk entry baru)
    if (formData.status && formData.status !== "Inactive") {
      newErrors.status = ["Status hanya boleh Inactive untuk karyawan baru."];
    }

    return newErrors;
  };

  // --- SUBMIT PROCESS ---
  // 🔹 Fungsi untuk mengirim data ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Eksekusi validasi frontend
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      // SweetAlert khusus jika NIP kurang dari batas minimal
      if (formErrors.nip && formErrors.nip[0] === "NIP minimal 9 digit.") {
        Swal.fire({
          title: "Gagal!",
          text: "NIP anda belum lengkap, minimal 9 digit",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

      // SweetAlert untuk peringatan validasi umum
      if (Object.keys(formErrors).length > 0) {
        Swal.fire({
          title: "Gagal!",
          text: "Harap perbaiki data sebelum menyimpan!",
          icon: "warning",
          confirmButtonText: "OK"
        });
        return;
      }
    }

    // Konfirmasi final kepada pengguna sebelum data disimpan
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Simpan",
      text: "Apakah Anda yakin ingin menyimpan data karyawan ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nip: formData.nip.trim(),
        nama: formData.nama.trim(),
        status: "Inactive",
      };

      console.log("📤 Payload yang dikirim:", payload);

      const response = await mockApi.post(API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Response sukses:", response.data);

      // Navigasi ke halaman list karyawan dengan membawa state untuk trigger alert sukses
      navigate("/app/karyawans", { 
        state: { 
          showSuccessAlert: true,
          successMessage: "Data karyawan berhasil disimpan."
        } 
      });
    } catch (error) {
      console.error("❌ Gagal simpan data:", error);

      // Penanganan Error berdasarkan status kode HTTP atau masalah jaringan
      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else if (errorData.message) {
          Swal.fire({
            title: "Gagal!",
            text: errorData.message,
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } else if (error.response?.status === 500) {
        Swal.fire({ title: "Gagal!", text: "Terjadi kesalahan server.", icon: "error" });
      } else if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
        Swal.fire({ title: "Gagal!", text: "Gagal terhubung ke server.", icon: "error" });
      } else {
        Swal.fire({ title: "Gagal!", text: "Terjadi kesalahan tidak terduga.", icon: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER FUNCTION ---
  // 🔹 Logika untuk menonaktifkan/mengaktifkan tombol submit secara dinamis
  const canSubmit = () => {
    if (loading) return false;
    if (Object.keys(errors).some(key => errors[key] !== "")) return false;
    if (!formData.nip.trim() || !formData.nama.trim()) return false;
    if (formData.nip.length < 9) return false;
    return true;
  };

  // --- UI RENDER ---
  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Tambah Data Karyawan</h2>

            <form onSubmit={handleSubmit}>
              <div className="section-info">
                <h3>Informasi Karyawan</h3>

                <div className="form-grid">
                  {/* Field: NIP */}
                  <div className="form-group">
                    <label htmlFor="nip" className="required">
                      NIP
                    </label>
                    <input
                      id="nip"
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      placeholder="Masukkan NIP karyawan"
                      required
                      className={errors.nip ? "error-input" : ""}
                      maxLength={18}
                      disabled={loading}
                    />
                    {errors.nip && (
                      <span className="error-text">
                        {Array.isArray(errors.nip) ? errors.nip[0] : errors.nip}
                      </span>
                    )}
                  </div>

                  {/* Field: Nama Karyawan */}
                  <div className="form-group">
                    <label htmlFor="nama" className="required">
                      Nama Karyawan
                    </label>
                    <input
                      id="nama"
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap karyawan"
                      required
                      className={errors.nama ? "error-input" : ""}
                      maxLength={100}
                      disabled={loading}
                    />
                    {errors.nama && (
                      <span className="error-text">
                        {Array.isArray(errors.nama) ? errors.nama[0] : errors.nama}
                      </span>
                    )}
                  </div>

                  {/* Field: Status (ReadOnly - Hanya Inactive untuk data baru) */}
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <input
                      id="status"
                      type="text"
                      name="status"
                      value="Inactive"
                      disabled
                      className="disabled-input"
                      style={{
                        backgroundColor: "#f8f9fa",
                        cursor: "not-allowed",
                        color: "#6c757d",
                        border: "1px solid #dee2e6",
                      }}
                    />
                    {errors.status && (
                      <span className="error-text">
                        {Array.isArray(errors.status) ? errors.status[0] : errors.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tombol Aksi: Batal & Simpan */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate("/app/karyawans")}
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={!canSubmit()}
                >
                  {loading ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TambahKaryawans;