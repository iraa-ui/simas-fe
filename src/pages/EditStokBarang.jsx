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
  const API_URL = "/stok_barang";
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nama_barang: "",
    kuantitas: "",
    kategori: "",
    harga_satuan: "",
    tanggal_transaksi: new Date().toISOString().split("T")[0],
    dibayar_oleh: "",
    notes: "",
    tipe: "",
    jumlah_transaksi: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // AUTO CALCULATE: Kuantitas setelah transaksi
  const [kuantitasSetelah, setKuantitasSetelah] = useState(0);

  const [hasChanges, setHasChanges] = useState(false);

  // Tambahkan fungsi ini di dalam component EditStokBarang
  const handleWheel = (e) => {
    e.target.blur(); // 🔥 Nonaktifkan scroll wheel behavior
  };

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        console.log("Fetching data for ID:", id);
        const response = await mockApi.get(`${API_URL}/${id}`);
        const stockData = response.data.data;

        console.log("Data received from API:", stockData);

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

  // REAL-TIME CALCULATION: Update kuantitas setelah
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

  const checkForChanges = () => {
    const hasFormChanges =
      formData.tipe !== "" ||
      formData.jumlah_transaksi !== "" ||
      formData.tanggal_transaksi !== originalData.tanggal_transaksi ||
      formData.dibayar_oleh !== originalData.dibayar_oleh ||
      formData.notes !== originalData.notes;

    setHasChanges(hasFormChanges);
  };

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

  useEffect(() => {
    checkForChanges();
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};
    const stokSaatIni = parseInt(formData.kuantitas) || 0;
    const jumlahBaru = parseInt(formData.jumlah_transaksi) || 0;

    // VALIDASI: Tipe transaksi wajib
    if (!formData.tipe) {
      newErrors.tipe = "Tipe transaksi wajib dipilih";
    }

    // VALIDASI: Jumlah transaksi wajib
    if (!formData.jumlah_transaksi || formData.jumlah_transaksi <= 0) {
      newErrors.jumlah_transaksi =
        "Jumlah transaksi wajib diisi dan harus lebih dari 0";
    }

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

  //  FUNGSI BARU: Cek apakah form sudah valid dan bisa disubmit
  const isFormValid = () => {
    const stokSaatIni = parseInt(formData.kuantitas) || 0;
    const jumlahBaru = parseInt(formData.jumlah_transaksi) || 0;

    // Cek field wajib
    if (
      !formData.tipe ||
      !formData.jumlah_transaksi ||
      formData.jumlah_transaksi <= 0 ||
      !formData.tanggal_transaksi ||
      !formData.dibayar_oleh.trim()
    ) {
      return false;
    }

    // Cek validasi khusus untuk barang keluar
    if (formData.tipe === "keluar" && jumlahBaru > stokSaatIni) {
      return false;
    }

    // Cek apakah ada perubahan data
    if (!hasChanges) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

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
      return; // 🔥 BATALKAN JIKA USER TIDAK KONFIRM
    }

    setLoading(true);

    try {
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
      console.log("Data original:", originalData);

      const response = await mockApi.put(`${API_URL}/${id}`, payload);

      console.log("Response success:", response.data);

      // Navigate dengan parameter untuk trigger auto-sort di list
      navigate("/app/stokbarang?action=updated&itemId=" + id);
    } catch (error) {
      console.error("Error updating stock:", error);

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);

        if (error.response.status === 422) {
          const validationErrors = error.response.data.errors;
          if (validationErrors) {
            let errorMessage = "Validasi gagal:\n";
            Object.keys(validationErrors).forEach((key) => {
              errorMessage += `- ${validationErrors[key].join(", ")}\n`;
            });
            alert(errorMessage);
          }
        } else if (error.response.status === 400) {
          alert(error.response.data.message);
        } else {
          alert(
            "Gagal mengupdate stock: " +
              (error.response.data.message || "Error tidak diketahui")
          );
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

  // Get class untuk input jumlah berdasarkan validasi
  const getJumlahInputClass = () => {
    const stokSaatIni = parseInt(formData.kuantitas) || 0;
    const jumlahBaru = parseInt(formData.jumlah_transaksi) || 0;

    if (formData.tipe === "keluar" && jumlahBaru > stokSaatIni) {
      return "error-input warning-red"; // Class khusus untuk warning merah
    }

    return errors.jumlah_transaksi ? "error-input" : "";
  };

  // Format currency untuk display (tanpa .00)
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
              {/* SECTION 1: DATA LAMA (READ-ONLY) */}
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
                        value={
                          formData.harga_satuan
                            ? formatCurrencyDisplay(formData.harga_satuan)
                            : ""
                        }
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

              {/* SECTION 2: TRANSAKSI BARU */}
              <div className="section-info">
                <h3>Transaksi Baru</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="tipe" className="required">
                      Tipe Transaksi
                    </label>
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
                    {errors.tipe && (
                      <span className="error-text">{errors.tipe}</span>
                    )}
                    <span className="input-hint">
                      Pilih jenis transaksi yang akan dilakukan
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="jumlah_transaksi" className="required">
                      Jumlah
                    </label>
                    <input
                      type="number"
                      id="jumlah_transaksi"
                      name="jumlah_transaksi"
                      value={formData.jumlah_transaksi}
                      onChange={handleChange}
                      onWheel={handleWheel} // 🔥 TAMBAHKAN INI
                      className={getJumlahInputClass()}
                      placeholder="0"
                      min="1"
                      disabled={loading || !formData.tipe}
                    />
                    {errors.jumlah_transaksi && (
                      <span className="error-text">
                        {errors.jumlah_transaksi}
                      </span>
                    )}
                    <span className="input-hint">
                      {!formData.tipe ? (
                        <>
                          <FaExclamationTriangle
                            style={{ color: "#ffc107", marginRight: "4px" }}
                          />
                          Pilih tipe transaksi terlebih dahulu
                        </>
                      ) : (
                        `Jumlah unit yang akan ${
                          formData.tipe === "masuk"
                            ? "ditambahkan"
                            : "dikeluarkan"
                        }`
                      )}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Stok Setelah Transaksi</label>
                    <input
                      type="number"
                      value={kuantitasSetelah}
                      readOnly
                      className={`readonly-input ${
                        formData.tipe === "keluar" && kuantitasSetelah < 0
                          ? "warning-red"
                          : formData.tipe === "keluar" &&
                            kuantitasSetelah <
                              parseInt(formData.kuantitas) * 0.2
                          ? "warning-input"
                          : ""
                      }`}
                    />
                    <span className="input-hint">
                      <FaCalculator style={{ marginRight: "5px" }} />
                      {formData.tipe && formData.jumlah_transaksi
                        ? `Akan ${
                            formData.tipe === "masuk"
                              ? "bertambah"
                              : "berkurang"
                          } menjadi ${kuantitasSetelah} unit`
                        : "Hasil perhitungan akan muncul di sini"}
                      {formData.tipe === "keluar" && kuantitasSetelah < 0 && (
                        <>
                          <br />
                          <FaExclamationTriangle
                            style={{ color: "#e74c3c", marginRight: "4px" }}
                          />
                          Stok minus! Tidak dapat diproses
                        </>
                      )}
                      {formData.tipe === "keluar" &&
                        kuantitasSetelah >= 0 &&
                        kuantitasSetelah <
                          parseInt(formData.kuantitas) * 0.2 && (
                          <>
                            <br />
                            <FaExclamationTriangle
                              style={{ color: "#ffc107", marginRight: "4px" }}
                            />
                            Stok hampir habis!
                          </>
                        )}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: INFORMASI TRANSAKSI */}
              <div className="section-info">
                <h3>Informasi Transaksi</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="tanggal_transaksi" className="required">
                      Tanggal Transaksi
                    </label>
                    <input
                      type="date"
                      id="tanggal_transaksi"
                      name="tanggal_transaksi"
                      value={formData.tanggal_transaksi}
                      onChange={handleChange}
                      className={errors.tanggal_transaksi ? "error-input" : ""}
                      disabled={loading}
                    />
                    {errors.tanggal_transaksi && (
                      <span className="error-text">
                        {errors.tanggal_transaksi}
                      </span>
                    )}
                    <span className="input-hint">Tanggal transaksi ini</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dibayar_oleh" className="required">
                      Dibayar Oleh
                    </label>
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
                    {errors.dibayar_oleh && (
                      <span className="error-text">{errors.dibayar_oleh}</span>
                    )}
                    <span className="input-hint">Nama individu/Departemen</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: KETERANGAN TAMBAHAN */}
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
                    <span className="input-hint">
                      Contoh: Tambahan dari supplier, untuk event, pemakaian
                      internal, dll.
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
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
