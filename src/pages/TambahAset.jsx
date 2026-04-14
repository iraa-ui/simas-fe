import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mockApi from "../api/mockApi";
import Swal from "sweetalert2";
import "../styles/TambahAset.css";

function TambahAset() {
  const navigate = useNavigate();
  const BASE_URL = "/inventaris";

  const [formData, setFormData] = useState({
    foto: null,
    no_inventaris: "",
    nama_barang: "",
    tipe: "",
    kondisi: "Baik",
    status: "Tersedia",
    harga: "",
    spesifikasi_barang: "",
    keterangan: "",
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingNoInventaris, setLoadingNoInventaris] = useState(true);

  const STATUS_OPTIONS = [
    "Tersedia",
    "Dipinjam",
    "Terjual",
    "Tidak Tersedia",
    "Belum Lunas",
    "Permintaan Perbaikan",
    "Dalam Perbaikan",
    "Sudah Diperbaiki",
  ];

  // 🔥 PERBAIKAN: Force refresh data dengan menghapus cache
  useEffect(() => {
    const fetchNextNoInventaris = async () => {
      try {
        setLoadingNoInventaris(true);

        // 🔥 FORCE REFRESH: Clear cache dan gunakan timestamp
        const timestamp = new Date().getTime();

        // Option 1: Gunakan endpoint khusus
        const response = await mockApi.get(
          `${BASE_URL}/next-no-inventaris?t=${timestamp}`,
          {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );

        if (response.data && response.data.next_no_inventaris) {
          setFormData((prev) => ({
            ...prev,
            no_inventaris: response.data.next_no_inventaris,
          }));

          // 🔥 DEBUG: Log hasil
          console.log(
            "✅ Generated No Inventaris:",
            response.data.next_no_inventaris
          );
        } else {
          await fetchManualFallback();
        }
      } catch (error) {
        console.error("Gagal mengambil nomor inventaris:", error);
        await fetchManualFallback();
      } finally {
        setLoadingNoInventaris(false);
      }
    };

    // 🔥 PERBAIKAN: Fallback yang lebih baik
    const fetchManualFallback = async () => {
      try {
        const response = await mockApi.get(
          `${BASE_URL}?t=${new Date().getTime()}`,
          {
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (response.data && response.data.data) {
          const existingData = response.data.data;

          // 🔥 LOGIC FALLBACK: Cari gap secara manual
          const existingNumbers = existingData
            .map((item) => {
              const match = item.no_inventaris?.match(/INV\/(\d+)/);
              return match ? parseInt(match[1]) : null;
            })
            .filter((num) => num !== null)
            .sort((a, b) => a - b);

          let nextNumber = 1;
          for (let i = 0; i < existingNumbers.length; i++) {
            if (existingNumbers[i] > nextNumber) {
              break; // Found gap
            }
            nextNumber = existingNumbers[i] + 1;
          }

          const formattedNumber = String(nextNumber).padStart(2, "0");
          const fallbackNoInventaris = `INV/${formattedNumber}`;

          setFormData((prev) => ({
            ...prev,
            no_inventaris: fallbackNoInventaris,
          }));
          console.log("🔄 Using manual gap detection:", fallbackNoInventaris);
        }
      } catch (fallbackError) {
        console.error("Fallback juga gagal:", fallbackError);
        setFormData((prev) => ({
          ...prev,
          no_inventaris: "INV/01",
        }));
      }
    };

    fetchNextNoInventaris();
  }, []);

  // Tambah state ini setelah state lainnya
  const [isFormValid, setIsFormValid] = useState(false);

  // 🔥 GANTI EFFECT VALIDASI YANG SUDAH ADA dengan ini:
  useEffect(() => {
    const isValid =
      formData.foto !== null &&
      formData.nama_barang.trim() !== "" &&
      formData.tipe.trim() !== "" &&
      formData.kondisi.trim() !== "" &&
      formData.status.trim() !== "";
    setIsFormValid(isValid);
  }, [
    formData.foto,
    formData.nama_barang,
    formData.tipe,
    formData.kondisi,
    formData.status,
  ]);

  // 🔥 Format harga otomatis
  const formatHarga = (value) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue === "") return "";
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "foto") {
      const file = files[0];
      if (file) {
        // Validasi tipe file
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
          setErrors({
            foto: "Format file harus PNG, JPG, atau JPEG",
            fotoBorder: true,
          });
          setPreview(null);
          setFormData((prev) => ({ ...prev, foto: null }));
          return;
        }

        // Validasi ukuran file
        if (file.size > 5 * 1024 * 1024) {
          setErrors({
            foto: "Ukuran file harus di bawah 5MB",
            fotoBorder: true,
          });
          setPreview(null);
          setFormData((prev) => ({ ...prev, foto: null }));
          return;
        }

        // Jika validasi berhasil, clear errors dan set data
        setErrors((prev) => ({
          ...prev,
          foto: null,
          fotoBorder: false,
        }));
        setFormData((prev) => ({ ...prev, foto: file }));
        setPreview(URL.createObjectURL(file));
      }
    } else if (name === "harga") {
      const formattedValue = formatHarga(value);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      if (name === "no_inventaris") {
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error ketika user mengubah input
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    // Validasi file size (double check)
    if (formData.foto && formData.foto.size > 5 * 1024 * 1024) {
      setErrors({
        foto: "Ukuran file harus di bawah 5MB",
        fotoBorder: true,
      });
      return;
    }

    // Validasi file type (double check)
    if (formData.foto) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(formData.foto.type)) {
        setErrors({
          foto: "Format file harus PNG, JPG, atau JPEG",
          fotoBorder: true,
        });
        return;
      }
    }

    const requiredFields = ["nama_barang", "tipe"];
    let hasErrors = false;
    const newErrors = {};

    for (let field of requiredFields) {
      if (!formData[field]) {
        newErrors[field] = `Field ${field} harus diisi`;
        hasErrors = true;
      }
    }

    if (!formData.foto) {
      newErrors.foto = "Foto barang harus diupload";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Konfirmasi simpan
    const confirm = await Swal.fire({
      title: "Konfirmasi Simpan",
      text: "Apakah Anda yakin ingin menyimpan data aset ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Simpan",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    setErrors({});

    try {
      const dataToSend = new FormData();
      const hargaNumerik = formData.harga
        ? formData.harga.replace(/\./g, "")
        : "";

      Object.keys(formData).forEach((key) => {
        if (key === "harga") {
          dataToSend.append(key, hargaNumerik);
        } else if (key === "no_inventaris") {
          // Skip, biarkan sistem generate otomatis
        } else if (formData[key] !== null) {
          dataToSend.append(key, formData[key]);
        }
      });

      await mockApi.post(BASE_URL, dataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Langsung redirect ke halaman master aset
      navigate("/app/master-aset?action=created");
      // Tampilkan alert success di halaman master aset
      // Note: Alert ini akan ditampilkan di MasterAset component
      // Kita perlu menggunakan approach yang berbeda untuk ini
    } catch (err) {
      console.error("❌ ERROR DETAIL:", err);

      let errorMessage = "Terjadi kesalahan tidak diketahui.";

      if (err.response) {
        const { status, data } = err.response;

        if (status === 422) {
          setErrors(data.errors || {});
          errorMessage = "Validasi gagal";
        } else {
          errorMessage = `Kesalahan server (${status})`;
        }
      } else if (err.request) {
        errorMessage = "Tidak ada respon dari server.";
      } else {
        errorMessage = `Terjadi error: ${err.message}`;
      }

      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan!",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Tambah Aset</h2>

            <div className="form-grid">
              {/* Upload Foto */}
              <div className="form-group foto-group">
                <label>
                  Foto Barang <span style={{ color: "red" }}>*</span>
                </label>
                <label
                  className={`upload-box ${
                    errors.fotoBorder ? "error-border" : ""
                  }`}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="preview-img" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>+</span>
                      <p>Upload</p>
                    </div>
                  )}
                  <input
                    type="file"
                    name="foto"
                    accept="image/png, image/jpeg"
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                </label>
                {errors.foto && (
                  <span className="error-text">{errors.foto}</span>
                )}
                <p className="hint">Max 5MB, PNG/JPG</p>
              </div>

              {/* No Inventaris - DISABLE */}
              <div className="form-group">
                <label>
                  No Inventaris <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <input
                  type="text"
                  name="no_inventaris"
                  value={
                    loadingNoInventaris ? "Loading..." : formData.no_inventaris
                  }
                  onChange={handleChange}
                  disabled
                  className="disabled-input"
                  title="Nomor inventaris diatur otomatis oleh sistem"
                />
                <small className="input-hint">
                  🔒 Nomor inventaris diatur otomatis oleh sistem
                </small>
              </div>

              {/* Nama Barang */}
              <div className="form-group">
                <label>
                  Nama Barang <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <input
                  type="text"
                  name="nama_barang"
                  value={formData.nama_barang}
                  onChange={handleChange}
                  placeholder="Masukkan nama barang"
                />
                {errors.nama_barang && (
                  <span className="error-text">{errors.nama_barang[0]}</span>
                )}
              </div>

              {/* Tipe */}
              <div className="form-group">
                <label>
                  Tipe <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <input
                  type="text"
                  name="tipe"
                  value={formData.tipe}
                  onChange={handleChange}
                  placeholder="Masukkan tipe barang"
                />
                {errors.tipe && (
                  <span className="error-text">{errors.tipe[0]}</span>
                )}
              </div>

              {/* Kondisi */}
              <div className="form-group">
                <label>
                  Kondisi <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <select name="kondisi" value="Baik" disabled>
                  <option value="Baik">Baik</option>
                </select>
              </div>

              {/* Status */}
              <div className="form-group">
                <label>
                  Status <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <select name="status" value={formData.status} disabled>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} disabled={s !== "Tersedia"}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga */}
              <div className="form-group">
                <label>
                  Harga <span style={{ color: "red" }}>*</span>{" "}
                </label>
                <input
                  type="text"
                  name="harga"
                  value={formData.harga}
                  onChange={handleChange}
                  placeholder="Contoh: 2.000.000"
                />
                <small className="input-hint">
                  Format: 1.000.000 (otomatis terformat)
                </small>
                {errors.harga && (
                  <span className="error-text">{errors.harga[0]}</span>
                )}
              </div>

              {/* Spesifikasi */}
              <div className="form-group full-width">
                <label>Spesifikasi</label>
                <textarea
                  name="spesifikasi_barang"
                  value={formData.spesifikasi_barang}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Masukkan spesifikasi barang"
                />
              </div>

              {/* Keterangan */}
              <div className="form-group full-width">
                <label>Keterangan</label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Masukkan keterangan tambahan"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/app/master-aset")}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-save"
                disabled={loading || loadingNoInventaris || !isFormValid} // 🔥 TAMBAH !isFormValid
                onClick={handleSubmit}
              >
                {loading ? "Menyimpan..." : "Simpan Aset"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TambahAset;
