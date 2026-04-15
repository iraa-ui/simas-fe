import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import Swal from "sweetalert2";
import "../styles/EditAset.css";

function EditAset() {
  const navigate = useNavigate();
  const { id } = useParams();
  const API_URL = "/inventaris";

  // State untuk menampung data input form
  const [formData, setFormData] = useState({
    foto: null,
    no_inventaris: "",
    nama_barang: "",
    tipe: "",
    kondisi: "",
    status: "Tersedia",
    harga: "",
    spesifikasi_barang: "",
    keterangan: "",
  });

  const [initialFormData, setInitialFormData] = useState({});
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentStatus, setCurrentStatus] = useState("");
  const [originalData, setOriginalData] = useState({});

  // List pilihan status barang
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

  // Fungsi untuk memformat angka menjadi ribuan dengan titik
  const formatHarga = (value) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue === "") return "";
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [isEditFormValid, setIsEditFormValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Validasi tombol simpan: Aktif jika field wajib terisi DAN ada perubahan data
  useEffect(() => {
    const isRequiredFieldsFilled =
      formData.nama_barang.trim() !== "" &&
      formData.tipe.trim() !== "" &&
      formData.kondisi.trim() !== "" &&
      formData.status.trim() !== "";

    const isDataChanged =
      formData.nama_barang !== initialFormData.nama_barang ||
      formData.tipe !== initialFormData.tipe ||
      formData.kondisi !== initialFormData.kondisi ||
      formData.status !== initialFormData.status ||
      formData.harga !== initialFormData.harga ||
      formData.spesifikasi_barang !== initialFormData.spesifikasi_barang ||
      formData.keterangan !== initialFormData.keterangan ||
      formData.foto !== null; 

    setIsEditFormValid(isRequiredFieldsFilled && isDataChanged);
    setHasChanges(isDataChanged);
  }, [formData, initialFormData]);

  // Mengambil data detail aset berdasarkan ID saat halaman dibuka
  useEffect(() => {
    mockApi
      .get(`${API_URL}/${id}`)
      .then((res) => {
        const data = res.data.data;

        let rawHarga = data.harga_for_edit || data.harga;

        // Bersihkan format desimal dari database jika ada
        if (
          rawHarga &&
          typeof rawHarga === "string" &&
          rawHarga.includes(".")
        ) {
          rawHarga = parseInt(rawHarga).toString();
        }

        const formattedHarga = formatHarga(rawHarga?.toString() || "");

        const initialData = {
          foto: null,
          no_inventaris: data.no_inventaris || "",
          nama_barang: data.nama_barang || "",
          tipe: data.tipe || "",
          kondisi: data.kondisi || "",
          status: data.status || "Tersedia",
          harga: formattedHarga, 
          spesifikasi_barang: data.spesifikasi_barang || "",
          keterangan: data.keterangan || "",
        };

        setFormData(initialData);
        setInitialFormData(initialData);
        setOriginalData(initialData);
        setCurrentStatus(data.status || "Tersedia");
        setPreview(data.foto_url || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Gagal mengambil data:", err);
        alert("Gagal memuat data aset.");
        setLoading(false);
      });
  }, [id]);

  // Handle perubahan input (teks, file foto, dan harga)
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "foto") {
      const file = files[0];
      if (file) {
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

        if (file.size > 5 * 1024 * 1024) {
          setErrors({
            foto: "Ukuran file harus di bawah 5MB",
            fotoBorder: true,
          });
          setPreview(null);
          setFormData((prev) => ({ ...prev, foto: null }));
          return;
        }

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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Proteksi field: Beberapa field tidak boleh diedit jika barang sedang dipinjam/diperbaiki
  const isFieldEditable = (fieldName) => {
    const nonEditableStatuses = ["Permintaan Perbaikan", "Dalam Perbaikan"];

    if (nonEditableStatuses.includes(currentStatus)) {
      return false;
    }

    const statusOnlyEditable = ["Dipinjam", "Belum Lunas", "Terjual"];

    if (statusOnlyEditable.includes(currentStatus) && fieldName !== "status") {
      return false;
    }

    return true;
  };

  // Membatasi pilihan status agar alur perubahan status tetap logis
  const getAvailableStatusOptions = () => {
    switch (currentStatus) {
      case "Tersedia":
        return ["Tersedia", "Tidak Tersedia"];
      case "Tidak Tersedia":
        return ["Tersedia", "Tidak Tersedia"];
      case "Permintaan Perbaikan":
      case "Dalam Perbaikan":
        return [currentStatus];
      case "Sudah Diperbaiki":
        return ["Dipinjam"];
      case "Dipinjam":
      case "Belum Lunas":
      case "Terjual":
        return [currentStatus];
      default:
        return STATUS_OPTIONS;
    }
  };

  // Cek apakah dropdown status boleh diklik atau dikunci
  const isStatusEditable = () => {
    const nonEditableStatuses = [
      "Dipinjam",
      "Bel_um Lunas",
      "Terjual",
      "Permintaan Perbaikan", 
      "Dalam Perbaikan", 
    ];
    return !nonEditableStatuses.includes(currentStatus);
  };

  // Proses pengiriman data ke server
  const handleSubmit = async () => {
    if (formData.foto && formData.foto.size > 5 * 1024 * 1024) {
      setErrors({
        foto: "Ukuran file harus di bawah 5MB",
        fotoBorder: true,
      });
      return;
    }

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

    try {
      setErrors({});

      // Pengecekan keamanan terakhir sebelum submit
      const nonEditableFields = [
        "no_inventaris",
        "nama_barang",
        "tipe",
        "harga",
        "spesifikasi_barang",
        "keterangan",
        "kondisi",
        "foto",
      ];
      const hasNonEditableChanges = nonEditableFields.some((field) => {
        if (
          !isFieldEditable(field) &&
          formData[field] !== originalData[field]
        ) {
          return true;
        }
        return false;
      });

      if (hasNonEditableChanges) {
        Swal.fire({
          icon: "warning",
          title: "Tidak Dapat Mengubah Data",
          text: `Tidak dapat mengubah data barang dengan status ${currentStatus}. Hanya status yang dapat diubah.`,
        });
        return;
      }

      const confirm = await Swal.fire({
        title: "Konfirmasi Perubahan",
        text: "Apakah Anda yakin ingin mengubah data aset ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Simpan Perubahan",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        reverseButtons: true,
      });

      if (!confirm.isConfirmed) return;

      setLoading(true);

      // Siapkan data dalam format FormData untuk upload file
      const dataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          if (key === "harga") {
            const numericHarga = formData.harga.replace(/\./g, "");
            dataToSend.append(key, numericHarga);
          } else {
            dataToSend.append(key, formData[key]);
          }
        }
      });
      dataToSend.append("_method", "PUT");

      await mockApi.post(`${API_URL}/${id}`, dataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/app/master-aset?action=updated");
    } catch (err) {
      console.error("❌ ERROR:", err);

      if (err.response?.data?.message) {
        const errorMessage = err.response.data.message;
        Swal.fire({
          icon: "error",
          title: "Gagal Memperbarui",
          text: errorMessage,
        });

        if (errorMessage.includes("Kondisi")) {
          setErrors({ kondisi: errorMessage });
        } else if (errorMessage.includes("status")) {
          setErrors({ status: errorMessage });
        }
      } else if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        setErrors(backendErrors);
      } else {
        Swal.fire({
          icon: "error",
          title: "Terjadi Kesalahan",
          text: "Terjadi kesalahan saat memperbarui aset!",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p style={{ textAlign: "center" }}>Memuat data aset...</p>;

  const availableStatusOptions = getAvailableStatusOptions();

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Edit Aset</h2>

            <div className="form-grid">
              {/* Bagian Input Foto */}
              <div className="form-group foto-group">
                <label>
                  Foto Barang <span style={{ color: "red" }}>*</span>
                </label>{" "}
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
                    disabled={!isFieldEditable("foto")}
                  />
                </label>
                <p className="hint">Max 5MB, PNG/JPG</p>
                {errors.foto && (
                  <span className="error-text">{errors.foto}</span>
                )}
                {!isFieldEditable("foto") && (
                  <small className="input-hint">
                    Foto tidak dapat diubah untuk status {currentStatus}
                  </small>
                )}
              </div>

              {/* Input No Inventaris (Read-only) */}
              <div className="form-group">
                <label>
                  No Inventaris <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="no_inventaris"
                  value={formData.no_inventaris}
                  onChange={handleChange}
                  disabled={true} 
                />
              </div>

              {/* Input Nama Barang */}
              <div className="form-group">
                <label>
                  Nama Barang <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <input
                  type="text"
                  name="nama_barang"
                  value={formData.nama_barang}
                  onChange={handleChange}
                  disabled={!isFieldEditable("nama_barang")}
                />
                {!isFieldEditable("nama_barang") && (
                  <small className="input-hint">
                    Nama Barang tidak dapat diubah untuk status {currentStatus}
                  </small>
                )}
              </div>

              {/* Input Tipe */}
              <div className="form-group">
                <label>
                  Tipe <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <input
                  type="text"
                  name="tipe"
                  value={formData.tipe}
                  onChange={handleChange}
                  disabled={!isFieldEditable("tipe")}
                />
                {!isFieldEditable("tipe") && (
                  <small className="input-hint">
                    Tipe tidak dapat diubah untuk status {currentStatus}
                  </small>
                )}
              </div>

              {/* Pilih Kondisi */}
              <div className="form-group">
                <label>
                  Kondisi <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <select
                  name="kondisi"
                  value={formData.kondisi}
                  onChange={handleChange}
                  disabled={!isFieldEditable("kondisi")}
                  className={errors.kondisi ? "error" : ""}
                >
                  <option value="">-- Pilih Kondisi --</option>
                  <option value="Baik">Baik</option>
                  <option value="Rusak">Rusak</option>
                </select>
                {errors.kondisi && (
                  <span className="error-message">{errors.kondisi}</span>
                )}
              </div>

              {/* Pilih Status (Terfilter berdasarkan currentStatus) */}
              <div className="form-group">
                <label>
                  Status <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={!isStatusEditable()}
                  className={errors.status ? "error" : ""}
                >
                  <option value="">-- Pilih Status --</option>
                  {availableStatusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <span className="error-message">{errors.status}</span>
                )}
                {!isStatusEditable() && (
                  <small className="input-hint" style={{ color: "#dc3545" }}>
                    Status {currentStatus} tidak dapat diubah
                  </small>
                )}
              </div>

              {/* Input Harga */}
              <div className="form-group">
                <label>Harga</label>
                <input
                  type="text"
                  name="harga"
                  value={formData.harga}
                  onChange={handleChange}
                  disabled={!isFieldEditable("harga")}
                  placeholder="Contoh: 2.000.000"
                />
                <small className="input-hint" style={{ color: "#28a745" }}>
                  Format otomatis: 2000000 → 2.000.000
                </small>
              </div>

              {/* Input Spesifikasi */}
              <div className="form-group full-width">
                <label>Spesifikasi</label>
                <textarea
                  name="spesifikasi_barang"
                  value={formData.spesifikasi_barang}
                  onChange={handleChange}
                  rows="2"
                  disabled={!isFieldEditable("spesifikasi_barang")}
                />
              </div>

              {/* Input Keterangan */}
              <div className="form-group full-width">
                <label>Keterangan</label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows="2"
                  disabled={!isFieldEditable("keterangan")}
                />
              </div>
            </div>

            {/* Navigasi Action Form */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/app/master-aset")}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-save"
                disabled={loading || !isEditFormValid}
                onClick={handleSubmit}
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

export default EditAset;