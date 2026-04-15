import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import {
  FaSave,
  FaTimes,
  FaEdit,
  FaCalculator,
  FaExclamationTriangle,
} from "react-icons/fa";
import "../styles/TambahEditStokBarang.css";
import Swal from "sweetalert2";

function EditStokBarang() {
  // Inisialisasi URL API dan Hooks untuk Navigasi serta Parameter URL (ID Barang)
  const API_URL = "/stok_barang";
  const navigate = useNavigate();
  const { id } = useParams();

  // State untuk menyimpan data formulir input
  const [formData, setFormData] = useState({
    nama_barang: "",
    kuantitas: "",
    kategori: "",
    harga_satuan: "",
    tanggal_transaksi: new Date().toISOString().split("T")[0], // Default tanggal hari ini
    dibayar_oleh: "",
    notes: "",
    tipe: "", // 'masuk' atau 'keluar'
    jumlah_transaksi: "",
  });

  // State pendukung untuk pembandingan data, error handling, dan status loading
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // State untuk menghitung secara otomatis sisa/total stok setelah transaksi
  const [kuantitasSetelah, setKuantitasSetelah] = useState(0);

  // State untuk mendeteksi apakah ada perubahan pada form dibanding data awal
  const [hasChanges, setHasChanges] = useState(false);

  // Handler untuk menonaktifkan perubahan angka melalui scroll mouse pada input number
  const handleWheel = (e) => {
    e.target.blur(); 
  };

  // Effect untuk mengambil data awal barang dari API saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        console.log("Fetching data for ID:", id);
        const response = await mockApi.get(`${API_URL}/${id}`);
        const stockData = response.data.data;

        console.log("Data received from API:", stockData);

        // Mengisi form dengan data yang didapat dari API
        setFormData({
          nama_barang: stockData.nama_barang || "",
          kuantitas: stockData.total || stockData.kuantitas || "0",
          kategori: stockData.kategori || "",
          harga_satuan: stockData.harga_satuan || "",
          tanggal_transaksi: new Date().toISOString().split("T")[0],
          dibayar_oleh: stockData.dibayar_oleh || "",
          notes: stockData.notes || "",
          tipe: "",
          jumlah_transaksi: "",
        });

        setOriginalData(stockData);
        setKuantitasSetelah(stockData.total || stockData.kuantitas || 0);
        setHasChanges(false);
      } catch (error) {
        console.error("Error fetching stock data:", error);
        alert("Gagal memuat data stok barang");
        navigate("/app/stokbarang");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchStockData();
  }, [id, navigate]);

  // Effect untuk kalkulasi real-time stok akhir (Stok Saat Ini +/- Jumlah Transaksi)
  useEffect(() => {
    const stokSaatIni = parseInt(formData.kuantitas) || 0;
    const jumlahBaru = parseInt(formData.jumlah_transaksi) || 0;

    let kuantitasBaru = stokSaatIni;

    if (formData.tipe === "masuk") {
      kuantitasBaru = stokSaatIni + jumlahBaru;
    } else if (formData.tipe === "keluar") {
      kuantitasBaru = stokSaatIni - jumlahBaru;
    }

    setKuantitasSetelah(kuantitasBaru);
  }, [formData.tipe, formData.jumlah_transaksi, formData.kuantitas]);

  // Fungsi untuk mengecek apakah user telah melakukan perubahan pada field tertentu
  const checkForChanges = () => {
    const hasFormChanges =
      formData.tipe !== "" ||
      formData.jumlah_transaksi !== "" ||
      formData.tanggal_transaksi !== originalData.tanggal_transaksi ||
      formData.dibayar_oleh !== originalData.dibayar_oleh ||
      formData.notes !== originalData.notes;

    setHasChanges(hasFormChanges);
  };

  // Handler untuk mengupdate state formData setiap kali input berubah
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Menghapus pesan error pada field yang sedang diketik oleh user
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Trigger pengecekan perubahan setiap kali formData berubah
  useEffect(() => {
    checkForChanges();
  }, [formData]);

  // Fungsi validasi form sebelum dikirim ke server
  const validateForm = () => {
    const newErrors = {};
    const stokSaatIni = parseInt(formData.kuantitas) || 0;
    const jumlahBaru = parseInt(formData.jumlah_transaksi) || 0;

    // Validasi: Pastikan tipe transaksi dipilih
    if (!formData.tipe) {
      newErrors.tipe = "Tipe transaksi wajib dipilih";
    }

    // Validasi: Pastikan jumlah transaksi lebih dari 0
    if (!formData.jumlah_transaksi || formData.jumlah_transaksi <= 0) {
      newErrors.jumlah_transaksi =
        "Jumlah transaksi wajib diisi dan harus lebih dari 0";
    }

    // Validasi: Cegah stok keluar melebihi stok yang tersedia
    if (formData.tipe === "keluar" && jumlahBaru > stokSaatIni) {
      newErrors.jumlah_transaksi = `Stok tidak cukup! Stok tersedia: ${stokSaatIni} unit`;
    }

    if (!formData.tanggal_transaksi) {
      newErrors.tanggal_transaksi = "Tanggal transaksi wajib diisi";
    }

    if (!formData.dibayar_oleh.trim()) {
      newErrors.dibayar_oleh = "Dibayar oleh wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fungsi pengecekan kelayakan form (untuk mengaktifkan/menonaktifkan tombol submit)
  const isFormValid = () => {
    const stokSaatIni = parseInt(formData.kuantitas) || 0;
    const jumlahBaru = parseInt(formData.jumlah_transaksi) || 0;

    if (
      !formData.tipe ||
      !formData.jumlah_transaksi ||
      formData.jumlah_transaksi <= 0 ||
      !formData.tanggal_transaksi ||
      !formData.dibayar_oleh.trim()
    ) {
      return false;
    }

    if (formData.tipe === "keluar" && jumlahBaru > stokSaatIni) {
      return false;
    }

    if (!hasChanges) {
      return false;
    }

    return true;
  };

  // Fungsi utama untuk menangani pengiriman data (submit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Tampilkan konfirmasi menggunakan SweetAlert2
    const confirmResult = await Swal.fire({
      title: "Update Transaksi?",
      text: "Apakah Anda yakin ingin memperbarui transaksi stok barang ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Update!",
      cancelButtonText: "Batal",
    });

    if (!confirmResult.isConfirmed) {
      return; 
    }

    setLoading(true);

    try {
      // Menyiapkan data yang akan dikirim ke API
      const payload = {
        nama_barang: formData.nama_barang.trim(),
        kuantitas: kuantitasSetelah,
        kategori: formData.kategori,
        harga_satuan: parseFloat(formData.harga_satuan),
        tanggal_transaksi: formData.tanggal_transaksi,
        dibayar_oleh: formData.dibayar_oleh.trim(),
        notes: formData.notes || "",
        tipe: formData.tipe,
      };

      console.log("Payload yang dikirim:", payload);
      const response = await mockApi.put(`${API_URL}/${id}`, payload);

      console.log("Response success:", response.data);

      // Navigasi kembali ke daftar stok dengan parameter sukses
      navigate("/app/stokbarang?action=updated&itemId=" + id);
    } catch (error) {
      console.error("Error updating stock:", error);
      // Handling error berdasarkan status code dari server
      if (error.response) {
        if (error.response.status === 422) {
          const validationErrors = error.response.data.errors;
          if (validationErrors) {
            let errorMessage = "Validasi gagal:\n";
            Object.keys(validationErrors).forEach((key) => {
              errorMessage += `- ${validationErrors[key].join(", ")}\n`;
            });
            alert(errorMessage);
          }
        } else {
          alert("Gagal mengupdate stock: " + (error.response.data.message || "Error tidak diketahui"));
        }
      } else {
        alert("Network error: Tidak dapat terhubung ke server");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/app/stokbarang");
  };

  // Opsi pilihan untuk dropdown Kategori dan Tipe
  const kategoriOptions = [
    { value: "", label: "Pilih Kategori" },
    { value: "ATK", label: "ATK" },
    { value: "Pantry", label: "Pantry (Makanan & Minuman)" },
    { value: "Kebersihan", label: "Kebersihan" },
    { value: "Elektronik", label: "Elektronik" },
    { value: "Konsumable", label: "Konsumable" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const tipeOptions = [
    { value: "", label: "Pilih Tipe Transaksi" },
    { value: "masuk", label: "Barang Masuk" },
    { value: "keluar", label: "Barang Keluar" },
  ];

  // Helper untuk menentukan class CSS input jumlah (misal: jadi merah jika error/stok kurang)
  const getJumlahInputClass = () => {
    const stokSaatIni = parseInt(formData.kuantitas) || 0;
    const jumlahBaru = parseInt(formData.jumlah_transaksi) || 0;

    if (formData.tipe === "keluar" && jumlahBaru > stokSaatIni) {
      return "error-input warning-red"; 
    }

    return errors.jumlah_transaksi ? "error-input" : "";
  };

  // Helper untuk memformat angka ke format mata uang Rupiah (IDR)
  const formatCurrencyDisplay = (amount) => {
    if (!amount) return "0";
    return new Intl.NumberFormat("id-ID").format(amount);
  };

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>
                <FaEdit style={{ marginRight: "10px" }} />
                Edit Stok Barang
              </h2>
              <p>Update transaksi stok barang - ID: {id}</p>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                <strong>Stok saat ini:</strong> {formData.kuantitas} unit
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* SECTION 1: DATA LAMA (Hanya untuk dibaca/Read-Only) */}
              <div className="section-info">
                <h3>Data Barang Saat Ini</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nama Barang</label>
                    <input
                      type="text"
                      value={formData.nama_barang}
                      readOnly
                      className="readonly-input"
                    />
                    <span className="input-hint">Tidak dapat diubah</span>
                  </div>

                  <div className="form-group">
                    <label>Kategori</label>
                    <input
                      type="text"
                      value={formData.kategori}
                      readOnly
                      className="readonly-input"
                    />
                    <span className="input-hint">Tidak dapat diubah</span>
                  </div>

                  <div className="form-group">
                    <label>Harga Satuan (Rp)</label>
                    <div className="input-with-prefix">
                      <input
                        type="text"
                        value={formData.harga_satuan ? formatCurrencyDisplay(formData.harga_satuan) : ""}
                        readOnly
                        className="readonly-input"
                      />
                    </div>
                    <span className="input-hint">Harga per unit</span>
                  </div>

                  <div className="form-group">
                    <label>Stok Saat Ini</label>
                    <input
                      type="number"
                      value={formData.kuantitas}
                      readOnly
                      className="readonly-input"
                    />
                    <span className="input-hint">Jumlah unit tersedia</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INPUT TRANSAKSI BARU (Logika tambah/kurang stok) */}
              <div className="section-info">
                <h3>Transaksi Baru</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="tipe" className="required">Tipe Transaksi</label>
                    <select
                      id="tipe"
                      name="tipe"
                      value={formData.tipe}
                      onChange={handleChange}
                      className={errors.tipe ? "error-input" : ""}
                      disabled={loading}
                    >
                      {tipeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipe && <span className="error-text">{errors.tipe}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="jumlah_transaksi" className="required">Jumlah</label>
                    <input
                      type="number"
                      id="jumlah_transaksi"
                      name="jumlah_transaksi"
                      value={formData.jumlah_transaksi}
                      onChange={handleChange}
                      onWheel={handleWheel}
                      className={getJumlahInputClass()}
                      placeholder="0"
                      min="1"
                      disabled={loading || !formData.tipe}
                    />
                    {errors.jumlah_transaksi && <span className="error-text">{errors.jumlah_transaksi}</span>}
                  </div>

                  <div className="form-group">
                    <label>Stok Setelah Transaksi</label>
                    <input
                      type="number"
                      value={kuantitasSetelah}
                      readOnly
                      className={`readonly-input ${
                        formData.tipe === "keluar" && kuantitasSetelah < 0 ? "warning-red" : ""
                      }`}
                    />
                    <span className="input-hint">
                      <FaCalculator style={{ marginRight: "5px" }} />
                      {formData.tipe && formData.jumlah_transaksi
                        ? `Akan ${formData.tipe === "masuk" ? "bertambah" : "berkurang"} menjadi ${kuantitasSetelah} unit`
                        : "Hasil perhitungan otomatis"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DETAIL INFORMASI (Tanggal & Penanggung Jawab) */}
              <div className="section-info">
                <h3>Informasi Transaksi</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="tanggal_transaksi" className="required">Tanggal Transaksi</label>
                    <input
                      type="date"
                      id="tanggal_transaksi"
                      name="tanggal_transaksi"
                      value={formData.tanggal_transaksi}
                      onChange={handleChange}
                      className={errors.tanggal_transaksi ? "error-input" : ""}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dibayar_oleh" className="required">Dibayar Oleh</label>
                    <input
                      type="text"
                      id="dibayar_oleh"
                      name="dibayar_oleh"
                      value={formData.dibayar_oleh}
                      onChange={handleChange}
                      className={errors.dibayar_oleh ? "error-input" : ""}
                      placeholder="Nama pembayar / departemen"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: CATATAN TAMBAHAN */}
              <div className="section-info">
                <h3>Keterangan Tambahan</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="notes">Deskripsi</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Masukkan deskripsi transaksi (opsional)"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* TOMBOL AKSI: Batal atau Simpan */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <FaTimes style={{ marginRight: "8px" }} />
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading || !isFormValid()}
                >
                  <FaSave style={{ marginRight: "8px" }} />
                  {loading ? "Mengupdate..." : "Update Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EditStokBarang;