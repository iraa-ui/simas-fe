import React, { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import "../styles/EditTambahKendalaBarang.css";
import Swal from "sweetalert2";

function EditKendalaBarang() {
  const API_URL = "/kendala-barang";

  const navigate = useNavigate();
  const { id } = useParams(); // Mengambil ID kendala dari URL parameter

  // State untuk data yang bisa diubah (Editable)
  const [formData, setFormData] = useState({
    deskripsi_kendala: "",
    status: "", 
  });

  // State untuk data yang hanya ditampilkan (Read-only)
  const [displayData, setDisplayData] = useState({
    nama_karyawan: "",
    nama_barang: "",
    tanggal_kendala: "",
    status: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Ref untuk menyimpan data asli sebagai pembanding (cek apakah ada perubahan)
  const originalData = useRef({
    deskripsi_kendala: "",
    status: "",
  });

  // Efek untuk mengambil data detail kendala saat pertama kali halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const response = await mockApi.get(`${API_URL}/${id}`);
        console.log("📦 Response data edit:", response.data);

        // Menangani berbagai kemungkinan struktur response data
        let data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        console.log("📝 Data yang akan di-edit:", data);

        // Fungsi pembantu untuk memformat tanggal ke format input HTML (YYYY-MM-DD)
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        // Simpan data untuk kebutuhan tampilan (Field yang di-disable)
        setDisplayData({
          nama_karyawan: data.nama_karyawan || "-",
          nama_barang: data.nama_barang || "-",
          tanggal_kendala: formatDateForInput(data.tanggal_kendala),
          status: data.status || "Open",
        });

        const deskripsiValue = data.deskripsi_kendala || "";
        const statusValue = data.status || "Open";

        // Set data ke dalam form agar bisa diedit
        setFormData({
          deskripsi_kendala: deskripsiValue,
          status: statusValue,
        });

        // Catat data asli ke dalam ref untuk pengecekan "isDataChanged"
        originalData.current = {
          deskripsi_kendala: deskripsiValue,
          status: statusValue,
        };
      } catch (error) {
        console.error("❌ Gagal mengambil data:", error);
        
        // Penanganan error berdasarkan status code
        if (error.response?.status === 404) {
          Swal.fire({ icon: "error", title: "Data Tidak Ditemukan", text: "Data kendala tidak ditemukan!" });
        } else {
          Swal.fire({ icon: "error", title: "Gagal Memuat Data", text: "Terjadi kesalahan saat memuat data!" });
        }
        navigate("/app/kendala-barang");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  /**
   * Logika Bisnis: Membatasi pilihan status agar sesuai alur (Workflow)
   * Open -> In Progress -> Closed
   */
  const getAvailableStatusOptions = () => {
    const currentStatus = displayData.status;

    switch (currentStatus) {
      case "Open":
        return ["Open", "In progress"];
      case "In progress":
        return ["In progress", "Closed"];
      case "Closed":
        return ["Closed"];
      default:
        return ["Open", "In progress", "Closed"];
    }
  };

  // Menangani perubahan input pada field deskripsi dan status
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset pesan error pada field tersebut jika user mulai mengetik ulang
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Mengecek apakah ada perbedaan antara data di form dengan data asli di database
  const isDataChanged = () => {
    const isDeskripsiChanged =
      formData.deskripsi_kendala.trim() !==
      originalData.current.deskripsi_kendala.trim();

    const isStatusChanged = formData.status !== originalData.current.status;

    return isDeskripsiChanged || isStatusChanged;
  };

  // Fungsi untuk mengirim data yang telah diubah ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi: Jangan kirim request jika tidak ada perubahan sama sekali
    if (!isDataChanged()) {
      Swal.fire({
        icon: "info",
        title: "Tidak Ada Perubahan",
        text: "Tidak ada perubahan data untuk diupdate.",
      });
      return;
    }

    // Tampilkan konfirmasi sebelum menyimpan
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Perubahan",
      text: "Apakah Anda yakin ingin mengubah data kendala ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan Perubahan",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        deskripsi_kendala: formData.deskripsi_kendala || "",
        status: formData.status,
      };

      const response = await mockApi.put(`${API_URL}/${id}`, payload);
      
      // Jika berhasil, arahkan kembali ke tabel dengan pesan sukses
      navigate("/app/kendala-barang", {
        state: {
          showSuccessAlert: true,
          successMessage: "Data kendala berhasil diperbarui.",
        },
      });
    } catch (error) {
      console.error("❌ Gagal update data:", error);
      
      // Penanganan error validasi (422) atau error server lainnya
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        Swal.fire({ icon: "error", title: "Validasi Gagal", text: "Periksa kembali inputan Anda." });
      } else {
        Swal.fire({
          icon: "error",
          title: "Kesalahan",
          text: error.response?.data?.message || "Terjadi kesalahan jaringan atau server!",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Tampilan Loading saat Fetching data awal
  if (fetchLoading) {
    return (
      <div className="master-main-content-fixed">
        <main className="master-main-content-fixed">
          <section className="form-section">
            <div className="form-container">
              <div style={{ textAlign: "center", padding: "50px" }}>
                <h3>Memuat data...</h3>
                <p>Sedang mengambil data kendala</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Edit Data Kendala Barang</h2>

            <div className="section-info">
              <h3>Informasi Kendala</h3>

              <div className="form-grid">
                {/* Field Nama Karyawan (Read-only) */}
                <div className="form-group">
                  <label htmlFor="nama_karyawan">Nama Karyawan</label>
                  <input
                    id="nama_karyawan"
                    type="text"
                    value={displayData.nama_karyawan}
                    disabled
                    className="readonly-input"
                  />
                </div>

                {/* Field Nama Barang (Read-only) */}
                <div className="form-group">
                  <label htmlFor="nama_barang">Nama Barang</label>
                  <input
                    id="nama_barang"
                    type="text"
                    value={displayData.nama_barang}
                    disabled
                    className="readonly-input"
                  />
                </div>

                {/* Field Tanggal (Read-only) */}
                <div className="form-group">
                  <label htmlFor="tanggal_kendala">Tanggal Kendala</label>
                  <input
                    id="tanggal_kendala"
                    type="text"
                    value={displayData.tanggal_kendala}
                    disabled
                    className="readonly-input"
                  />
                </div>

                {/* Field Status (Editable dengan pilihan terbatas) */}
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={errors.status ? "error-input" : ""}
                    disabled={displayData.status === "Closed"}
                  >
                    {getAvailableStatusOptions().map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                  {errors.status && <span className="error-text">{errors.status[0]}</span>}
                  
                  {/* Hint dinamis untuk membantu user memahami alur status */}
                  {displayData.status === "Open" && (
                    <small className="input-hint" style={{ color: "#28a745" }}>Dapat diubah ke In Progress</small>
                  )}
                  {displayData.status === "In progress" && (
                    <small className="input-hint" style={{ color: "#ffc107" }}>Dapat diubah ke Closed</small>
                  )}
                  {displayData.status === "Closed" && (
                    <small className="input-hint" style={{ color: "#dc3545" }}>Status sudah selesai (Locked)</small>
                  )}
                </div>

                {/* Field Deskripsi (Editable TextArea) */}
                <div className="form-group full-width">
                  <label htmlFor="deskripsi_kendala">Deskripsi Kendala</label>
                  <textarea
                    id="deskripsi_kendala"
                    name="deskripsi_kendala"
                    value={formData.deskripsi_kendala}
                    onChange={handleChange}
                    placeholder="Jelaskan kendala..."
                    className={errors.deskripsi_kendala ? "error-input" : ""}
                    rows="4"
                  />
                  {errors.deskripsi_kendala && (
                    <span className="error-text">{errors.deskripsi_kendala[0]}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Aksi Batal dan Simpan */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/app/kendala-barang")}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-save"
                onClick={handleSubmit}
                disabled={loading || !isDataChanged()}
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

export default EditKendalaBarang;