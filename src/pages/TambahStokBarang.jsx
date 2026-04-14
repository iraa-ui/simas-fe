import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mockApi from "../api/mockApi";
import { FaSave, FaTimes, FaPlus, FaCalculator } from "react-icons/fa";
import "../styles/TambahEditStokBarang.css";
import Swal from "sweetalert2";

function TambahStokBarang() {
  const API_URL = "/stok_barang";
  const HISTORY_API_URL =
    "/histori-stok";
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nama_barang: "",
    kuantitas: "",
    kategori: "",
    total_harga: "",
    harga: "",
    tanggal_transaksi: new Date().toISOString().split("T")[0],
    dibayar_oleh: "",
    notes: "",
    tipe: "masuk",
  });

  const [kategoriLainnya, setKategoriLainnya] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // currency display
  const [displayTotalHarga, setDisplayTotalHarga] = useState("");

  // Tambahkan fungsi ini di dalam component TambahStokBarang
  const handleWheel = (e) => {
    e.target.blur(); // 🔥 Nonaktifkan scroll wheel behavior
  };

  // Atau alternatif: prevent default behavior
  const preventScroll = (e) => {
    e.preventDefault();
  };

  // currency format (10.000)
  const formatToCurrency = (value) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("id-ID").format(Number(numericValue));
  };

  const parseCurrencyToNumber = (currencyString) => {
    return currencyString.replace(/\./g, "");
  };

  const isFormValid = () => {
    // 1. CHECK SEMUA FIELD WAJIB TERISI
    const requiredFieldsValid =
      formData.nama_barang.trim() &&
      formData.kuantitas &&
      formData.kuantitas > 0 &&
      formData.kategori &&
      (formData.kategori !== "Lainnya" || kategoriLainnya.trim()) &&
      formData.total_harga &&
      formData.total_harga > 0 &&
      formData.tanggal_transaksi &&
      formData.dibayar_oleh.trim();

    // 2. CHECK TIDAK ADA ERRORS DI FORM
    const noErrors = Object.keys(errors).every((key) => errors[key] === "");

    // 3. KEDUA KONDISI HARUS TERPENUHI
    return requiredFieldsValid && noErrors;
  };

  // AUTO CALCULATE: harga = total_harga / kuantitas
  useEffect(() => {
    const kuantitas = parseFloat(formData.kuantitas) || 0;
    const totalHarga = parseFloat(formData.total_harga) || 0;

    let hargaSatuan = 0;
    if (kuantitas > 0 && totalHarga > 0) {
      hargaSatuan = totalHarga / kuantitas;
    }

    setFormData((prev) => ({
      ...prev,
      harga: hargaSatuan > 0 ? hargaSatuan.toFixed(2) : "",
    }));
  }, [formData.kuantitas, formData.total_harga]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "kategori") {
      setFormData((prev) => ({
        ...prev,
        kategori: value,
      }));

      // 🔥 PERBAIKAN: Clear error kategori ketika diubah
      if (errors.kategori) {
        setErrors((prev) => ({
          ...prev,
          kategori: "",
        }));
      }
      return;
    }

    if (name === "total_harga") {
      const formattedValue = formatToCurrency(value);
      setDisplayTotalHarga(formattedValue);

      const numericValue = parseCurrencyToNumber(formattedValue);
      setFormData((prev) => ({
        ...prev,
        total_harga: numericValue || "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nama_barang.trim()) {
      newErrors.nama_barang = "Nama barang wajib diisi";
    }

    if (!formData.kuantitas || formData.kuantitas <= 0) {
      newErrors.kuantitas = "Jumlah barang wajib diisi dan harus lebih dari 0";
    }

    if (!formData.kategori) {
      newErrors.kategori = "Kategori wajib dipilih";
    }

    if (formData.kategori === "Lainnya" && !kategoriLainnya.trim()) {
      newErrors.kategori = "Kategori lainnya wajib diisi";
    }

    if (!formData.total_harga || formData.total_harga < 0) {
      newErrors.total_harga = "Total harga wajib diisi dan tidak boleh negatif";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validateForm()) return;

    const confirmResult = await Swal.fire({
      title: "Simpan Data Barang?",
      text: "Apakah Anda yakin ingin menyimpan data barang baru ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan!",
      cancelButtonText: "Batal",
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      // 1. PAYLOAD UNTUK CREATE BARANG
      const stokPayload = {
        ...formData,
        kategori:
          formData.kategori === "Lainnya" ? kategoriLainnya : formData.kategori,
        kuantitas: parseInt(formData.kuantitas),
        total_harga: parseFloat(formData.total_harga),
        harga: parseFloat(formData.harga),
      };

      console.log("🔵 Stok payload:", stokPayload);

      // 2. CREATE BARANG BARU
      const response = await mockApi.post(API_URL, stokPayload);
      console.log("✅ Barang created:", response.data);

      const newItemId = response.data.data?.id_barang;

      // 3. NAVIGATE KE LIST
      console.log("🟢 Navigating to list...");
      navigate("/app/stokbarang?action=created&itemId=" + newItemId);
    } catch (error) {
      console.error("❌ Error creating item:", error);

      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;

        // 🔥 PERBAIKAN: Handle error validasi kategori
        if (validationErrors.kategori) {
          setErrors((prev) => ({
            ...prev,
            kategori: validationErrors.kategori.join(", "),
          }));
        }

        // Handle error unique nama barang
        if (validationErrors.nama_barang) {
          setErrors((prev) => ({
            ...prev,
            nama_barang: "Nama barang sudah tersedia",
          }));
        } else {
          // Tampilkan error validasi lainnya
          let errorMessage = "Validasi gagal:\n";
          Object.keys(validationErrors).forEach((key) => {
            errorMessage += `- ${key}: ${validationErrors[key].join(", ")}\n`;
          });
          alert(errorMessage);
        }
      } else if (error.response?.status === 422) {
        // Handle Laravel validation error
        const errorData = error.response.data;
        if (errorData.errors?.nama_barang) {
          setErrors((prev) => ({
            ...prev,
            nama_barang: "Nama barang sudah tersedia",
          }));
        }
        if (errorData.errors?.kategori) {
          setErrors((prev) => ({
            ...prev,
            kategori: errorData.errors.kategori.join(", "),
          }));
        }
      } else {
        alert(
          "Gagal menambah stock: " +
            (error.response?.data?.message || "Network error")
        );
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

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>
                <FaPlus style={{ marginRight: "10px" }} />
                Tambah Barang Baru
              </h2>
              <p>
                Isi form berikut untuk menambahkan data barang baru ke sistem
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* SECTION 1: DATA MASTER BARANG */}
              <div className="section-info">
                <h3>Data Master Barang</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="nama_barang" className="required">
                      Nama Barang
                    </label>
                    <input
                      type="text"
                      id="nama_barang"
                      name="nama_barang"
                      value={formData.nama_barang}
                      onChange={handleChange}
                      className={errors.nama_barang ? "error-input" : ""}
                      placeholder="Masukkan nama barang"
                      disabled={loading}
                    />
                    {errors.nama_barang && (
                      <span className="error-text">{errors.nama_barang}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="kategori" className="required">
                      Kategori
                    </label>
                    <select
                      id="kategori"
                      name="kategori"
                      value={formData.kategori}
                      onChange={handleChange}
                      className={errors.kategori ? "error-input" : ""}
                      disabled={loading}
                    >
                      {kategoriOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* 🔥 PERBAIKAN: Tambahkan error styling pada input lainnya */}
                    {formData.kategori === "Lainnya" && (
                      <input
                        type="text"
                        placeholder="Masukkan kategori lainnya"
                        value={kategoriLainnya}
                        onChange={(e) => {
                          setKategoriLainnya(e.target.value);
                          // 🔥 PERBAIKAN: Clear error ketika user mulai mengetik
                          if (errors.kategori) {
                            setErrors((prev) => ({
                              ...prev,
                              kategori: "",
                            }));
                          }
                        }}
                        className={`input-lainnya ${
                          errors.kategori ? "error-input" : ""
                        }`} // 🔥 Tambahkan error styling
                        style={{ marginTop: "8px" }}
                        disabled={loading}
                      />
                    )}

                    {errors.kategori && (
                      <span className="error-text">{errors.kategori}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: TRANSAKSI PERTAMA */}
              <div className="section-info">
                <h3>Transaksi Pertama</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="kuantitas" className="required">
                      Jumlah Barang
                    </label>
                    <input
                      type="number"
                      id="kuantitas"
                      name="kuantitas"
                      value={formData.kuantitas}
                      onChange={handleChange}
                      onWheel={handleWheel} // 🔥 TAMBAHKAN INI
                      className={errors.kuantitas ? "error-input" : ""}
                      placeholder="0"
                      min="1"
                      disabled={loading}
                    />
                    {errors.kuantitas && (
                      <span className="error-text">{errors.kuantitas}</span>
                    )}
                    <span className="input-hint">Jumlah unit yang masuk</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="total_harga" className="required">
                      Total Harga (Rp)
                    </label>
                    <div className="input-with-prefix">
                      <input
                        type="text"
                        id="total_harga"
                        name="total_harga"
                        value={displayTotalHarga}
                        onChange={handleChange}
                        className={errors.total_harga ? "error-input" : ""}
                        placeholder="0"
                        disabled={loading}
                      />
                    </div>
                    {errors.total_harga && (
                      <span className="error-text">{errors.total_harga}</span>
                    )}
                    <span className="input-hint">
                      Total yang dibayar ke supplier
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="harga">Harga Satuan (Rp)</label>
                    <div className="input-with-prefix">
                      <input
                        type="text"
                        id="harga"
                        name="harga"
                        value={
                          formData.harga
                            ? new Intl.NumberFormat("id-ID").format(
                                formData.harga
                              )
                            : ""
                        }
                        readOnly
                        className="readonly-input"
                        placeholder="0"
                        disabled={loading}
                      />
                    </div>
                    <span className="input-hint">
                      <FaCalculator style={{ marginRight: "5px" }} />
                      Auto: Total Harga ÷ Jumlah Barang
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
                    <label htmlFor="notes">Catatan</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Masukkan catatan tambahan mengenai barang atau transaksi (opsional)"
                      disabled={loading}
                    />
                    <span className="input-hint">
                      Contoh: Supplier, nomor PO, kondisi barang, dll.
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
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading || !isFormValid()}
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

export default TambahStokBarang;
