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
  const API_URL = "/karyawans";
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    status: "Inactive",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔹 Handle input perubahan value form
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error ketika user mulai mengetik
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Validasi real-time untuk NIP
    if (name === "nip") {
      // Hanya izinkan angka
      if (value && !/^\d*$/.test(value)) {
        // Set error state untuk NIP TANPA reset nilai
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP harus berupa angka"],
        }));
        // Biarkan nilai tetap seperti sebelumnya, jangan reset
        return;
      }

      // Validasi panjang NIP (maksimal 18 digit)
      if (value.length > 18) {
        // Potong ke 18 digit
        setFormData((prev) => ({
          ...prev,
          nip: value.slice(0, 18),
        }));
        return;
      }

      // 🔹 VALIDASI REAL-TIME UNTUK NIP MINIMAL 9 DIGIT
      if (value.length > 0 && value.length < 9) {
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP minimal 9 digit"],
        }));
      } else if (value.length === 0) {
        // Clear error jika field kosong
        setErrors((prev) => ({
          ...prev,
          nip: "",
        }));
      }
    }

    // Validasi real-time untuk NAMA (harus huruf)
    if (name === "nama") {
      // Hanya izinkan huruf, spasi, dan karakter khusus nama
      if (value && !/^[a-zA-Z\s.'-]*$/.test(value)) {
        // Set error state untuk Nama TANPA reset nilai
        setErrors((prev) => ({
          ...prev,
          nama: ["Nama harus berupa huruf"],
        }));
        // Biarkan nilai tetap seperti sebelumnya, jangan reset
        return;
      }

      // 🔹 VALIDASI REAL-TIME UNTUK NAMA YANG DIHAPUS
      if (value.length === 0) {
        setErrors((prev) => ({
          ...prev,
          nama: ["Nama wajib diisi"],
        }));
      } else {
        // Clear error jika nama sudah terisi
        setErrors((prev) => ({
          ...prev,
          nama: "",
        }));
      }
    }

    // Update form data jika validasi berhasil
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 Validasi form sebelum submit
  const validateForm = () => {
    const newErrors = {};

    // 🔹 VALIDASI NIP - MINIMAL 9 DIGIT, MAKSIMAL 18 DIGIT
    if (!formData.nip.trim()) {
      newErrors.nip = ["NIP wajib diisi."];
    } else if (!/^\d+$/.test(formData.nip)) {
      newErrors.nip = ["NIP harus berupa angka."];
    } else if (formData.nip.length < 9) {
      newErrors.nip = ["NIP minimal 9 digit."];
    } else if (formData.nip.length > 18) {
      newErrors.nip = ["NIP maksimal 18 digit."];
    }

    // 🔹 VALIDASI NAMA
    if (!formData.nama.trim()) {
      newErrors.nama = ["Nama wajib diisi."];
    } else if (formData.nama.length > 100) {
      newErrors.nama = ["Nama maksimal 100 karakter."];
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.nama)) {
      newErrors.nama = ["Nama harus berupa huruf."];
    }

    // 🔹 VALIDASI STATUS
    if (formData.status && formData.status !== "Inactive") {
      newErrors.status = ["Status hanya boleh Inactive untuk karyawan baru."];
    }

    return newErrors;
  };

  // 🔹 Submit data ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validasi frontend - CEK NIP MINIMAL 9 DIGIT DAN MAKSIMAL 18 DIGIT
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      // 🔹 SWEETALERT KHUSUS UNTUK NIP KURANG DARI 9 DIGIT
      if (formErrors.nip && formErrors.nip[0] === "NIP minimal 9 digit.") {
        Swal.fire({
          title: "Gagal!",
          text: "NIP anda belum lengkap, minimal 9 digit",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

      // 🔹 SWEETALERT UNTUK VALIDASI LAINNYA
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

    // 🔹 KONFIRMASI SEBELUM SIMPAN
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

    // Jika user membatalkan
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

      // 🔹 LANGSUNG REDIRECT KE HALAMAN KARYAWANS DENGAN STATE SUCCESS
      navigate("/app/karyawans", { 
        state: { 
          showSuccessAlert: true,
          successMessage: "Data karyawan berhasil disimpan."
        } 
      });
    } catch (error) {
      console.error("❌ Gagal simpan data:", error);
      console.error("❌ Error details:", error.response?.data);

      // Handle error response dari backend
      if (error.response?.status === 422) {
        const errorData = error.response.data;

        if (errorData.errors) {
          // 🔹 HANYA TAMPILKAN ERROR DI FORM UNTUK VALIDASI BIASA
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
        Swal.fire({
          title: "Gagal!",
          text: "Terjadi kesalahan server. Silakan coba lagi.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else if (
        error.code === "NETWORK_ERROR" ||
        error.message === "Network Error"
      ) {
        Swal.fire({
          title: "Gagal!",
          text: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          title: "Gagal!",
          text: "Terjadi kesalahan tidak terduga. Silakan coba lagi.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Check jika form bisa disubmit
  const canSubmit = () => {
    // Jika loading, disable tombol
    if (loading) return false;
    
    // Jika ada error, disable tombol
    if (Object.keys(errors).some(key => errors[key] !== "")) return false;
    
    // Cek NIP dan Nama sudah terisi
    if (!formData.nip.trim() || !formData.nama.trim()) return false;
    
    // Cek NIP minimal 9 digit
    if (formData.nip.length < 9) return false;
    
    return true;
  };

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Tambah Data Karyawan</h2>

            <form onSubmit={handleSubmit}>
              {/* Section Informasi Karyawan */}
              <div className="section-info">
                <h3>Informasi Karyawan</h3>

                <div className="form-grid">
                  {/* NIP */}
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
                        {Array.isArray(errors.nip)
                          ? errors.nip[0]
                          : errors.nip}
                      </span>
                    )}
                  </div>

                  {/* Nama Karyawan */}
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
                        {Array.isArray(errors.nama)
                          ? errors.nama[0]
                          : errors.nama}
                      </span>
                    )}
                  </div>

                  {/* 🔹 Status Field (Readonly) */}
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
                        {Array.isArray(errors.status)
                          ? errors.status[0]
                          : errors.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 🔹 Tombol Aksi */}
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