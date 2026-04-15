import React, { useEffect, useState } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import Swal from "sweetalert2";
import "../styles/EditTambahKaryawans.css";

function EditKaryawans() {
  const API_URL = "/karyawans";
  const navigate = useNavigate();
  const { id } = useParams();

  // State untuk menampung data input yang sedang diketik
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    status: "",
  });

  // State untuk menyimpan data asli dari database sebagai pembanding
  const [originalData, setOriginalData] = useState({
    current_nip: "",
    current_nama: "",
    current_status: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);

  // Mengambil detail data karyawan berdasarkan ID saat halaman dimuat
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const response = await mockApi.get(`${API_URL}/${id}`);
        console.log("📦 Response data edit:", response.data);

        let data = null;

        // Logika pengecekan struktur response API yang berbeda-beda
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

        // Simpan ke originalData untuk pengecekan perubahan nantinya
        setOriginalData({
          current_nip: nipValue,
          current_nama: namaValue,
          current_status: statusValue,
        });

        // Masukkan data ke form input
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

  // Fungsi untuk menangani setiap perubahan di input field
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Tandai bahwa user sudah mulai menyentuh/mengubah form
    if (!hasUserMadeChanges) {
      setHasUserMadeChanges(true);
    }

    // Hapus pesan error pada field yang sedang diketik
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Validasi khusus input NIP (Hanya angka dan batasan digit)
    if (name === "nip") {
      if (value && !/^\d*$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP harus berupa angka"],
        }));
        return;
      }

      if (value.length > 18) {
        setFormData((prev) => ({
          ...prev,
          nip: value.slice(0, 18),
        }));
        return;
      }

      // Validasi panjang minimal NIP secara real-time
      if (value.length === 0) {
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP wajib diisi"],
        }));
      } else if (value.length < 9) {
        setErrors((prev) => ({
          ...prev,
          nip: ["NIP minimal 9 digit"],
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          nip: "",
        }));
      }
    }

    // Validasi khusus Nama (Hanya huruf dan karakter nama)
    if (name === "nama") {
      if (value && !/^[a-zA-Z\s.'-]*$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          nama: ["Nama harus berupa huruf"],
        }));
        return;
      }

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

    // Update state formData setiap ada ketikan valid
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fungsi validasi manual sebelum data dikirim ke server
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nip.trim()) {
      newErrors.nip = ["NIP wajib diisi."];
    } else if (!/^\d+$/.test(formData.nip)) {
      newErrors.nip = ["NIP harus berupa angka."];
    } else if (formData.nip.length < 9) {
      newErrors.nip = ["NIP minimal 9 digit."];
    } else if (formData.nip.length > 18) {
      newErrors.nip = ["NIP maksimal 18 digit."];
    }

    if (!formData.nama.trim()) {
      newErrors.nama = ["Nama wajib diisi."];
    } else if (formData.nama.length > 100) {
      newErrors.nama = ["Nama maksimal 100 karakter."];
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.nama)) {
      newErrors.nama = ["Nama harus berupa huruf."];
    }

    return newErrors;
  };

  // Mengecek apakah ada perbedaan antara input sekarang dengan data awal
  const hasDataChanged = () => {
    const trimmedNip = formData.nip.trim();
    const trimmedNama = formData.nama.trim();

    return (
      trimmedNip !== originalData.current_nip ||
      trimmedNama !== originalData.current_nama
    );
  };

  // Fungsi utama untuk memproses pengiriman data edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Proteksi: Karyawan dengan status 'active' dilarang keras untuk diubah datanya
    if (isActiveKaryawan) {
      Swal.fire({
        title: "Gagal!",
        text: "Karyawan ini sedang melakukan aktivitas, tidak dapat diubah!",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    // Jalankan validasi form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      // Notifikasi khusus jika NIP belum mencapai panjang minimal
      if (formErrors.nip && formErrors.nip[0] === "NIP minimal 9 digit.") {
        Swal.fire({
          title: "Gagal!",
          text: "NIP anda belum lengkap, minimal 9 digit",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

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

    // Jika user klik simpan tapi datanya sebenarnya masih sama
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

    // Munculkan dialog konfirmasi sebelum benar-benar menyimpan ke API
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

      // Pindah ke halaman daftar karyawan sambil membawa status sukses untuk SweetAlert di sana
      navigate("/app/karyawans", { 
        state: { 
          showSuccessAlert: true,
          successMessage: "Data karyawan berhasil diperbarui." 
        } 
      });

    } catch (error) {
      console.error("❌ Gagal update data:", error);

      // Penanganan error validasi dari sisi server (Backend)
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

  // Tampilan placeholder saat data sedang proses loading dari API
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

  // Merubah teks status dari value database ke teks yang enak dibaca
  const getStatusDisplay = (status) => {
    if (status === "active") return "Active";
    if (status === "inactive") return "Inactive";
    return "Unknown";
  };

  const isActiveKaryawan = originalData.current_status === "active";

  // Fungsi pengecekan kondisi untuk menentukan apakah tombol simpan boleh diklik atau tidak
  const isSaveDisabled = () => {
    if (loading) return true;
    if (isActiveKaryawan) return true;
    if (!isActiveKaryawan && !hasUserMadeChanges) return true;
    if (Object.keys(errors).some(key => errors[key] !== "")) return true;
    if (!formData.nip.trim() || !formData.nama.trim()) return true;
    if (formData.nip.length < 9) return true;
    
    return false;
  };

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Edit Data Karyawan</h2>

            <div className="section-info">
              <h3>Informasi Karyawan</h3>

              <div className="form-grid">
                {/* Input Field NIP */}
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

                {/* Input Field Nama */}
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

                {/* Input Field Status (Hanya untuk dilihat, tidak bisa diubah) */}
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

            {/* Bagian Bawah Form untuk aksi Batal dan Simpan */}
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