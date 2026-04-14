import React, { useEffect, useState } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import Swal from "sweetalert2";
import "../styles/EditTambahKaryawans.css";

function EditKaryawans() {
  const API_URL = "/karyawans";
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    status: "",
  });

  const [originalData, setOriginalData] = useState({
    current_nip: "",
    current_nama: "",
    current_status: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);

  // 🔹 Ambil data berdasarkan ID untuk di-edit
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const response = await mockApi.get(`${API_URL}/${id}`);
        console.log("📦 Response data edit:", response.data);

        let data = null;

        if (response.data) {
          if (response.data.data) {
            if (response.data.data.karyawan) {
              data = response.data.data.karyawan;
            } else {
              data = response.data.data;
            }
          } else if (response.data.karyawan) {
            data = response.data.karyawan;
          } else {
            data = response.data;
          }
        }

        console.log("📝 Data yang akan di-edit:", data);

        if (!data) {
          throw new Error("Data tidak ditemukan");
        }

        const nipValue = data.nip || "";
        const namaValue = data.nama || "";

        let statusValue = "active";
        if (data.status !== undefined && data.status !== null) {
          statusValue = data.status.toString().toLowerCase();
        }

        console.log(
          "🎯 Nilai akhir - NIP:",
          nipValue,
          "Nama:",
          namaValue,
          "Status:",
          statusValue
        );

        setOriginalData({
          current_nip: nipValue,
          current_nama: namaValue,
          current_status: statusValue,
        });

        setFormData({
          nip: nipValue,
          nama: namaValue,
          status: statusValue,
        });
      } catch (error) {
        console.error("❌ Gagal mengambil data:", error);
        Swal.fire({
          title: "Gagal!",
          text: "Gagal memuat data untuk diedit!",
          icon: "error",
          confirmButtonText: "OK"
        }).then(() => {
          navigate("/app/karyawans");
        });
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  // 🔹 Handle input perubahan value form
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Set flag bahwa user telah melakukan perubahan
    if (!hasUserMadeChanges) {
      setHasUserMadeChanges(true);
    }

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

      // 🔹 VALIDASI REAL-TIME UNTUK NIP YANG DIHAPUS
      if (value.length === 0) {
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP wajib diisi"],
        }));
      } else if (value.length < 9) {
        // 🔹 PERUBAHAN: MINIMAL 9 DIGIT, BUKAN 18 DIGIT
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP minimal 9 digit"],
        }));
      } else {
        // Clear error jika NIP sudah valid
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

      // Validasi real-time untuk nama yang dihapus
      if (value.length === 0) {
        setErrors((prev) => ({
          ...prev,
          nama: ["Nama wajib diisi"],
        }));
      } else {
        // Clear error jika nama sudah valid
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

    return newErrors;
  };

  // 🔹 Cek apakah ada perubahan data
  const hasDataChanged = () => {
    const trimmedNip = formData.nip.trim();
    const trimmedNama = formData.nama.trim();

    return (
      trimmedNip !== originalData.current_nip ||
      trimmedNama !== originalData.current_nama
    );
  };

  // 🔹 Update data ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // 🔹 CEK APAKAH KARYAWAN ACTIVE - TAMPILKAN ERROR LANGSUNG
    if (isActiveKaryawan) {
      Swal.fire({
        title: "Gagal!",
        text: "Karyawan ini sedang melakukan aktivitas, tidak dapat diubah!",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    // Validasi frontend UNTUK KARYAWAN INACTIVE
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

      // 🔹 PERBAIKAN PESAN ERROR VALIDASI UNTUK KASUS LAIN
      Swal.fire({
        title: "Gagal!",
        text: "Harap perbaiki data sebelum menyimpan!",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    const trimmedNip = formData.nip.trim();
    const trimmedNama = formData.nama.trim();

    // Cek jika tidak ada perubahan
    if (
      trimmedNip === originalData.current_nip &&
      trimmedNama === originalData.current_nama
    ) {
      Swal.fire({
        title: "Tidak Ada Perubahan",
        text: "Tidak ada perubahan data yang perlu disimpan.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }

    // 🔹 KONFIRMASI SEBELUM UPDATE (HANYA UNTUK INACTIVE)
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Perubahan",
      text: "Apakah Anda yakin ingin mengubah data karyawan ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan Perubahan",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    // Jika user membatalkan
    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      console.log("🔄 Mengupdate data dengan ID:", id);

      const payload = {
        nip: trimmedNip,
        nama: trimmedNama,
      };

      console.log("📤 Payload:", payload);

      const response = await mockApi.put(`${API_URL}/${id}`, payload);
      console.log("✅ Response sukses:", response.data);

      // 🔹 LANGSUNG REDIRECT KE HALAMAN KARYAWANS DENGAN STATE SUCCESS
      navigate("/app/karyawans", { 
        state: { 
          showSuccessAlert: true,
          successMessage: "Data karyawan berhasil diperbarui." 
        } 
      });

    } catch (error) {
      console.error("❌ Gagal update data:", error);

      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        const errorMessages = error.response.data.errors;

        if (errorMessages.nip) {
          Swal.fire({
            title: "Gagal!",
            text: errorMessages.nip[0],
            icon: "error",
            confirmButtonText: "OK"
          });
        } else if (errorMessages.nama) {
          Swal.fire({
            title: "Gagal!",
            text: errorMessages.nama[0],
            icon: "error",
            confirmButtonText: "OK"
          });
        }
      } else if (error.response?.status === 403) {
        // 🔹 PERBAIKAN PESAN ERROR KARYAWAN SEDANG AKTIF
        Swal.fire({
          title: "Gagal!",
          text: "Karyawan ini sedang melakukan aktivitas, tidak dapat diubah.",
          icon: "error",
          confirmButtonText: "OK"
        });
      } else {
        Swal.fire({
          title: "Gagal!",
          text: "Terjadi kesalahan server atau jaringan.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan loading saat mengambil data
  if (fetchLoading) {
    return (
      <div className="mmaster-main-content-fixed">
        <main className="master-main-content-fixed">
          <section className="form-section">
            <div className="form-container">
              <div style={{ textAlign: "center", padding: "50px" }}>
                <h3>Memuat data...</h3>
                <p>Sedang mengambil data karyawan</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // 🔹 Format status untuk display
  const getStatusDisplay = (status) => {
    if (status === "active") return "Active";
    if (status === "inactive") return "Inactive";
    return "Unknown";
  };

  // 🔹 Check apakah karyawan aktif
  const isActiveKaryawan = originalData.current_status === "active";

  // 🔹 Check apakah tombol simpan harus disabled
  const isSaveDisabled = () => {
    // Jika loading, disable tombol
    if (loading) return true;
    
    // Jika karyawan active, tombol disabled
    if (isActiveKaryawan) return true;
    
    // Jika karyawan inactive, tombol disabled sampai user melakukan perubahan
    if (!isActiveKaryawan && !hasUserMadeChanges) return true;
    
    // Jika ada error, disable tombol
    if (Object.keys(errors).some(key => errors[key] !== "")) return true;
    
    // Jika NIP atau Nama kosong, disable tombol
    if (!formData.nip.trim() || !formData.nama.trim()) return true;
    
    // Jika NIP kurang dari 9 digit, disable tombol
    if (formData.nip.length < 9) return true;
    
    return false;
  };

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Edit Data Karyawan</h2>

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
                    placeholder="Masukkan NIP karyawan (min. 9 digit)"
                    className={errors.nip ? "error-input" : ""}
                    maxLength={18}
                    disabled={loading || isActiveKaryawan}
                  />
                  {errors.nip && (
                    <span className="error-text">
                      {Array.isArray(errors.nip) ? errors.nip[0] : errors.nip}
                    </span>
                  )}
                </div>

                {/* Nama Karyawan */}
                <div className="form-group">
                  <label htmlFor="nama-karyawan" className="required">
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
                    disabled={loading || isActiveKaryawan}
                  />
                  {errors.nama && (
                    <span className="error-text">
                      {Array.isArray(errors.nama) ? errors.nama[0] : errors.nama}
                    </span>
                  )}
                </div>

                {/* 🔹 Status Karyawan - SELALU DISABLED */}
                <div className="form-group">
                  <label htmlFor="status">Status Karyawan</label>
                  <input
                    id="status"
                    type="text"
                    name="status"
                    value={getStatusDisplay(originalData.current_status)}
                    disabled
                    className="readonly-input"
                    placeholder="Status karyawan"
                  />
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
                onClick={handleSubmit}
                disabled={isSaveDisabled()}
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EditKaryawans;