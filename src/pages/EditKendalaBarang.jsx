import React, { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import "../styles/EditTambahKendalaBarang.css";
import Swal from "sweetalert2";

function EditKendalaBarang() {
  const API_URL = "/kendala-barang";

  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    deskripsi_kendala: "",
    status: "", // 🔥 TAMBAHAN: Field status
  });

  const [displayData, setDisplayData] = useState({
    nama_karyawan: "",
    nama_barang: "",
    tanggal_kendala: "",
    status: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // 🔹 Ref untuk menyimpan data original
  const originalData = useRef({
    deskripsi_kendala: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const response = await mockApi.get(`${API_URL}/${id}`);
        console.log("📦 Response data edit:", response.data);

        let data = response.data.data || response.data;

        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        console.log("📝 Data yang akan di-edit:", data);

        // Format tanggal untuk input type="date" (YYYY-MM-DD)
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        // Set data untuk display (disabled fields)
        setDisplayData({
          nama_karyawan: data.nama_karyawan || "-",
          nama_barang: data.nama_barang || "-",
          tanggal_kendala: formatDateForInput(data.tanggal_kendala),
          status: data.status || "Open",
        });

        // 🔥 PERUBAHAN: Set deskripsi_kendala DAN status yang bisa diubah
        const deskripsiValue = data.deskripsi_kendala || "";
        const statusValue = data.status || "Open";

        setFormData({
          deskripsi_kendala: deskripsiValue,
          status: statusValue,
        });

        // Simpan data original ke ref
        originalData.current = {
          deskripsi_kendala: deskripsiValue,
          status: statusValue,
        };
      } catch (error) {
        console.error("❌ Gagal mengambil data:", error);

        if (error.response?.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Data Tidak Ditemukan",
            text: "Data kendala tidak ditemukan!",
            confirmButtonColor: "#3085d6",
          });
        } else if (error.response?.status === 500) {
          Swal.fire({
            icon: "error",
            title: "Error Server",
            text: "Error server internal!",
            confirmButtonColor: "#3085d6",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal Memuat Data",
            text: "Gagal memuat data untuk diedit!",
            confirmButtonColor: "#3085d6",
          });
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

  const getAvailableStatusOptions = () => {
    const currentStatus = displayData.status;

    switch (currentStatus) {
      case "Open":
        // 🔥 Open tampilkan Open (status saat ini) dan In Progress (opsi berikutnya)
        return ["Open", "In progress"];
      case "In progress":
        // 🔥 In Progress tampilkan In Progress (status saat ini) dan Closed (opsi berikutnya)
        return ["In progress", "Closed"];
      case "Closed":
        // 🔥 Closed tidak bisa diubah lagi, hanya tampilkan Closed
        return ["Closed"];
      default:
        return ["Open", "In progress", "Closed"];
    }
  };

  // 🔹 Handle input perubahan value form - HANYA untuk deskripsi_kendala
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error ketika user mulai mengetik
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 🔹 Fungsi untuk mengecek apakah data sudah berubah - VERSI LENGKAP
  const isDataChanged = () => {
    const isDeskripsiChanged =
      formData.deskripsi_kendala.trim() !==
      originalData.current.deskripsi_kendala.trim();

    const isStatusChanged = formData.status !== originalData.current.status;

    // 🔥 PERBAIKAN: Hanya cek perubahan, validasi alur biar backend yang handle
    // Hapus validasi ketat di frontend karena backend sudah handle
    return isDeskripsiChanged || isStatusChanged;
  };

  // 🔹 Update data ke backend - VERSI LENGKAP
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Jika data tidak berubah, tidak perlu kirim request
    if (!isDataChanged()) {
      Swal.fire({
        icon: "info",
        title: "Tidak Ada Perubahan",
        text: "Tidak ada perubahan data untuk diupdate.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // 🔹 KONFIRMASI SEBELUM UPDATE
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Perubahan",
      text: "Apakah Anda yakin ingin mengubah data kendala ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan Perubahan",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    // Jika user membatalkan
    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("🔄 Mengupdate data dengan ID:", id);
      console.log("📝 Data yang akan diupdate:", formData);

      // 🔹 PERBAIKAN: Kirim hanya field yang diubah dan format yang benar
      const payload = {
        deskripsi_kendala: formData.deskripsi_kendala || "",
        status: formData.status,
      };

      console.log("📤 Payload yang dikirim:", payload);

      const response = await mockApi.put(`${API_URL}/${id}`, payload);
      console.log("✅ Response sukses:", response.data);

      // 🔹 LANGSUNG REDIRECT KE HALAMAN UTAMA DENGAN STATE SUCCESS
      navigate("/app/kendala-barang", {
        state: {
          showSuccessAlert: true,
          successMessage: "Data kendala berhasil diperbarui.",
        },
      });
    } catch (error) {
      console.error("❌ Gagal update data:", error);
      console.log("📋 Response error:", error.response?.data);

      // 🔹 PERBAIKAN: Handle error dengan lebih spesifik
      if (error.response?.status === 422) {
        const errorMessages = error.response.data.errors || {};
        setErrors(errorMessages);

        let errorText = "Validasi gagal:\n";
        Object.keys(errorMessages).forEach((key) => {
          errorText += `- ${key}: ${errorMessages[key][0]}\n`;
        });
        Swal.fire({
          icon: "error",
          title: "Validasi Gagal",
          html: errorText.replace(/\n/g, "<br>"),
          confirmButtonColor: "#3085d6",
        });
      } else if (error.response?.status === 500) {
        // 🔹 Tampilkan error detail dari backend untuk debugging
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Error server internal!";
        Swal.fire({
          icon: "error",
          title: "Error Server",
          html: `Terjadi kesalahan server:<br><small>${errorMessage}</small>`,
          confirmButtonColor: "#3085d6",
        });
      } else if (error.response?.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text: error.response.data.message || "Gagal menyimpan data kendala.",
          confirmButtonColor: "#3085d6",
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Data Tidak Ditemukan",
          text: "Data tidak ditemukan!",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Kesalahan",
          text:
            error.response?.data?.message ||
            "Terjadi kesalahan jaringan atau server tidak merespons!",
          confirmButtonColor: "#3085d6",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan loading saat mengambil data
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

            {/* Section Informasi Kendala */}
            <div className="section-info">
              <h3>Informasi Kendala</h3>

              <div className="form-grid">
                {/* Nama Karyawan - DISABLED */}
                <div className="form-group">
                  <label htmlFor="nama_karyawan">Nama Karyawan</label>
                  <input
                    id="nama_karyawan"
                    type="text"
                    value={displayData.nama_karyawan}
                    disabled
                    required
                    className="readonly-input"
                  />
                </div>

                {/* Nama Barang - DISABLED */}
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

                {/* Tanggal Kendala - DISABLED */}
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

                {/* Status - EDITABLE dengan validasi alur */}
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={errors.status ? "error-input" : ""}
                    disabled={displayData.status === "Closed"} // 🔥 Disable jika status sudah Closed
                  >
                    {/* 🔥 Tampilkan hanya opsi yang diperbolehkan (hanya opsi berikutnya) */}
                    {getAvailableStatusOptions().map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <span className="error-text">{errors.status[0]}</span>
                  )}
                  {/* 🔥 TAMBAHKAN PETUNJUK ALUR STATUS */}
                  {displayData.status === "Open" && (
                    <small className="input-hint" style={{ color: "#28a745" }}>
                      Status dapat diubah ke In Progress
                    </small>
                  )}
                  {displayData.status === "In progress" && (
                    <small className="input-hint" style={{ color: "#ffc107" }}>
                      Status dapat diubah ke Closed
                    </small>
                  )}
                  {displayData.status === "Closed" && (
                    <small className="input-hint" style={{ color: "#dc3545" }}>
                      Status Closed tidak dapat diubah
                    </small>
                  )}
                </div>

                {/* Deskripsi Kendala - EDITABLE */}
                <div className="form-group full-width">
                  <label htmlFor="deskripsi_kendala">Deskripsi Kendala</label>
                  <textarea
                    id="deskripsi_kendala"
                    name="deskripsi_kendala"
                    value={formData.deskripsi_kendala}
                    onChange={handleChange}
                    placeholder="Jelaskan kendala yang terjadi pada barang..."
                    className={errors.deskripsi_kendala ? "error-input" : ""}
                    rows="4"
                  />
                  {errors.deskripsi_kendala && (
                    <span className="error-text">
                      {errors.deskripsi_kendala[0]}
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
