// src/pages/TambahPenjualanAset.jsx
import React, { useState, useEffect } from "react";
import mockApi from "../api/mockApi";
import { useNavigate } from "react-router-dom";
import Select from "react-select"; // Import library untuk dropdown pencarian
import Swal from "sweetalert2"; // Import library untuk notifikasi popup
import "../styles/TambahEditPenjualanAset.css";

function TambahPenjualanAset() {
  // Definisi endpoint API yang digunakan
  const API_BARANG = "/inventaris";
  const API_KARYAWAN = "/karyawans";
  const API_PENJUALAN = "/penjualan_asset";

  const navigate = useNavigate();

  // State untuk menampung data mentah dari API
  const [barangList, setBarangList] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState(null);

  // State utama untuk menampung data form input user
  const [formData, setFormData] = useState({
    id_karyawan: "",
    id_inventaris: "",
    harga_jual: "",
    jumlah_terbayar: "",
    metode_pembayaran: "",
    tanggal: "",
    keterangan: "",
    status: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // State khusus untuk menampung opsi yang akan ditampilkan di React-Select
  const [karyawanOptions, setKaryawanOptions] = useState([]);
  const [barangOptions, setBarangOptions] = useState([]);

  // State untuk mengontrol status aktif/non-aktif tombol simpan
  const [isFormValid, setIsFormValid] = useState(false);

  // Fungsi validasi form untuk mengecek kelengkapan data sebelum submit
  const checkFormValidity = () => {
    // Cek field wajib dasar
    if (
      !formData.id_karyawan ||
      !formData.id_inventaris ||
      !formData.metode_pembayaran ||
      !formData.status ||
      !formData.tanggal
    ) {
      return false;
    }

    // Cek harga_jual valid
    const total = unformatNumber(formData.harga_jual);
    if (!formData.harga_jual || total <= 0) {
      return false;
    }

    // Cek jumlah_terbayar berdasarkan aturan status (Lunas/Belum Lunas)
    const dibayar = unformatNumber(formData.jumlah_terbayar);

    if (formData.status === "lunas") {
      if (dibayar !== total) return false;
    } else if (formData.status === "belum lunas") {
      if (dibayar <= 0 || dibayar >= total) return false;
    }

    // Cek apakah ada error pada field kritikal
    const criticalErrors = [
      "id_karyawan",
      "id_inventaris",
      "harga_jual",
      "jumlah_terbayar",
      "metode_pembayaran",
      "status",
      "tanggal",
    ];
    if (criticalErrors.some((errorField) => errors[errorField])) {
      return false;
    }

    return true;
  };

  // useEffect untuk memantau perubahan pada data form atau error guna update status validasi
  useEffect(() => {
    setIsFormValid(checkFormValidity());
  }, [formData, errors]);

  // Helper fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Mengambil data awal (Barang & Karyawan) saat komponen pertama kali dibuka
  useEffect(() => {
    Promise.all([mockApi.get(API_BARANG), mockApi.get(API_KARYAWAN)])
      .then(([barangRes, karyawanRes]) => {
        const allBarang = barangRes.data.data || [];
        const allKaryawan = karyawanRes.data.data || [];

        // Hanya tampilkan barang yang Kondisi Baik dan Status Tersedia
        const availableBarang = allBarang.filter(
          (barang) =>
            barang.kondisi?.toLowerCase() === "baik" &&
            barang.status?.toLowerCase() === "tersedia"
        );

        setBarangList(availableBarang);
        setKaryawanList(allKaryawan);

        // Format data untuk keperluan komponen React-Select
        setKaryawanOptions(
          allKaryawan.map((karyawan) => ({
            value: karyawan.id,
            label: karyawan.nama,
          }))
        );

        setBarangOptions(
          availableBarang.map((barang) => ({
            value: barang.id_inventaris,
            label: barang.nama_barang,
            data: barang,
          }))
        );

        console.log("Total barang:", allBarang.length);
        console.log("Barang available (Baik & Tersedia):", availableBarang.length);
        console.log("Barang available:", availableBarang);
      })
      .catch((err) => {
        console.error("Gagal mengambil data:", err);
        alert("Gagal memuat data");
      });
  }, []);

  // Update harga otomatis ketika barang dipilih berdasarkan ID
  useEffect(() => {
    if (formData.id_inventaris && barangList.length > 0) {
      const barang = barangList.find(
        (b) => b.id_inventaris == formData.id_inventaris
      );
      if (barang) {
        setSelectedBarang(barang);
        setFormData((prev) => ({
          ...prev,
          harga_jual: formatRupiah(barang.harga?.toString() || ""),
        }));
      }
    }
  }, [formData.id_inventaris, barangList]);

  // Fungsi utilitas: Format angka menjadi format ribuan Indonesia
  const formatRupiah = (value) => {
    if (value === null || value === undefined) return "";
    const numberString = value.toString().replace(/\D/g, "");
    if (!numberString) return "";
    return parseInt(numberString, 10).toLocaleString("id-ID");
  };

  // Fungsi utilitas: Menghapus format ribuan (titik) agar menjadi angka murni
  const unformatNumber = (value) => {
    if (!value) return 0;
    const parsed = parseFloat(
      value.toString().replace(/\./g, "").replace(",", ".")
    );
    return isNaN(parsed) ? 0 : parsed;
  };

  // Fungsi untuk menghitung selisih harga dan jumlah bayar
  const calculateSisa = () => {
    const total = unformatNumber(formData.harga_jual);
    const dibayar = unformatNumber(formData.jumlah_terbayar);
    const sisa = total - dibayar;
    return sisa < 0 ? 0 : sisa;
  };

  // Handler perubahan pilihan karyawan di dropdown
  const handleKaryawanChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      id_karyawan: selectedOption ? selectedOption.value : "",
    }));

    if (errors.id_karyawan) {
      setErrors((prev) => ({ ...prev, id_karyawan: "" }));
    }
  };

  // Handler perubahan pilihan barang di dropdown (sekaligus set harga jual)
  const handleBarangChange = (selectedOption) => {
    const newIdInventaris = selectedOption ? selectedOption.value : "";

    setFormData((prev) => ({
      ...prev,
      id_inventaris: newIdInventaris,
    }));

    if (selectedOption && selectedOption.data) {
      setSelectedBarang(selectedOption.data);
      setFormData((prev) => ({
        ...prev,
        harga_jual: formatRupiah(selectedOption.data.harga?.toString() || ""),
      }));
    } else {
      setSelectedBarang(null);
      setFormData((prev) => ({
        ...prev,
        harga_jual: "",
      }));
    }

    if (errors.id_inventaris) {
      setErrors((prev) => ({ ...prev, id_inventaris: "" }));
    }
  };

  // Handler utama untuk perubahan input form manual
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Otomatis format rupiah saat mengetik di input harga/bayar
    if (name === "harga_jual" || name === "jumlah_terbayar") {
      const cleaned = unformatNumber(value);
      updatedValue = formatRupiah(cleaned);
    }

    let updatedFormData = {
      ...formData,
      [name]: updatedValue,
    };

    // Logic khusus saat mengganti Status (Lunas / Belum Lunas)
    if (name === "status") {
      if (value === "lunas") {
        updatedFormData.tanggal = getTodayDate();
        updatedFormData.jumlah_terbayar = updatedFormData.harga_jual || "";
      } else if (value === "belum lunas") {
        updatedFormData.tanggal = getTodayDate();
        updatedFormData.jumlah_terbayar = "";
      } else {
        updatedFormData.tanggal = "";
        updatedFormData.jumlah_terbayar = "";
      }
    }

    // Validasi realtime jumlah bayar tidak boleh melebihi total harga
    if (name === "jumlah_terbayar") {
      const total = parseFloat(unformatNumber(formData.harga_jual)) || 0;
      const dibayar = parseFloat(unformatNumber(value)) || 0;

      if (dibayar > total) {
        setErrors((prev) => ({
          ...prev,
          jumlah_terbayar: "Jumlah bayar tidak boleh lebih dari total harga",
        }));
      } else {
        setErrors((prev) => ({ ...prev, jumlah_terbayar: "" }));
      }
    }

    setFormData(updatedFormData);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Fungsi pengiriman data ke server
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    const total = parseFloat(unformatNumber(formData.harga_jual)) || 0;
    const dibayar = parseFloat(unformatNumber(formData.jumlah_terbayar)) || 0;

    // Validasi mandatory fields sebelum submit
    if (!formData.id_karyawan) newErrors.id_karyawan = "Pilih karyawan terlebih dahulu";
    if (!formData.id_inventaris) newErrors.id_inventaris = "Pilih barang terlebih dahulu";
    if (!formData.harga_jual || total <= 0) newErrors.harga_jual = "Harga jual harus diisi dan lebih dari 0";
    if (!formData.metode_pembayaran) newErrors.metode_pembayaran = "Pilih metode pembayaran";
    if (!formData.status) newErrors.status = "Status harus diisi";
    if (!formData.tanggal) newErrors.tanggal = "Tanggal harus diisi";

    if (dibayar > total) {
      newErrors.jumlah_terbayar = "Jumlah bayar tidak boleh melebihi total harga";
    }

    // Validasi sinkronisasi status dan nominal pembayaran
    if (formData.status === "lunas") {
      if (dibayar !== total) {
        newErrors.jumlah_terbayar = "Untuk status Lunas, jumlah bayar harus sama dengan total harga";
      }
    } else if (formData.status === "belum lunas") {
      if (!dibayar || dibayar <= 0) {
        newErrors.jumlah_terbayar = "Jumlah bayar harus diisi";
      } else if (dibayar >= total) {
        newErrors.jumlah_terbayar = "Untuk status Belum Lunas, jumlah bayar harus kurang dari total harga";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Munculkan popup konfirmasi sebelum benar-benar mengirim ke database
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Simpan",
      text: "Apakah Anda yakin ingin menyimpan data penjualan ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Simpan",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);

    // Payload data dengan angka yang sudah bersih (tanpa format titik)
    const dataToSend = {
      id_karyawan: formData.id_karyawan,
      id_inventaris: formData.id_inventaris,
      harga_jual: total,
      jumlah_terbayar: dibayar,
      metode_pembayaran: formData.metode_pembayaran,
      tanggal: formData.tanggal,
      keterangan: formData.keterangan,
      status: formData.status,
    };

    mockApi
      .post(API_PENJUALAN, dataToSend)
      .then((response) => {
        // Berhasil simpan, redirect dengan query parameter action=created
        navigate("/app/penjualan-aset?action=created");
      })
      .catch((err) => {
        console.error("Gagal menyimpan data:", err);
        const errorMessage = err.response?.data?.message || err.message;

        if (err.response?.data?.errors) {
          const backendErrors = err.response.data.errors;
          setErrors(backendErrors);
          Swal.fire({
            icon: "error",
            title: "Validasi Gagal",
            text: "Terjadi kesalahan validasi data",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal Menyimpan!",
            text: "Terjadi kesalahan saat menyimpan data: " + errorMessage,
          });
        }
      })
      .finally(() => setLoading(false));
  };

  const sisaPembayaran = calculateSisa();
  const isJumlahBayarDisabled = formData.status === "lunas";

  // Pengaturan style kustom untuk library react-select agar sesuai dengan tema form
  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused
        ? "#3b82f6"
        : errors.id_karyawan || errors.id_inventaris
        ? "#dc3545"
        : "#d1d5db",
      "&:hover": {
        borderColor: state.isFocused
          ? "#3b82f6"
          : errors.id_karyawan || errors.id_inventaris
          ? "#dc3545"
          : "#d1d5db",
      },
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      minHeight: "42px",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 1000,
    }),
  };

  return (
    <div className="create-container">
      <div className="form-card">
        <h2>Tambah Data Penjualan Aset</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-grid">
              
              {/* Field Dropdown Karyawan dengan fitur pencarian */}
              <div className="form-group">
                <label>
                  Nama Karyawan <span className="required-star">*</span>
                </label>
                <Select
                  options={karyawanOptions}
                  value={karyawanOptions.find(
                    (option) => option.value === formData.id_karyawan
                  )}
                  onChange={handleKaryawanChange}
                  placeholder="-- Pilih Karyawan --"
                  isSearchable
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={customStyles}
                  noOptionsMessage={({ inputValue }) =>
                    inputValue ? "Data tidak ditemukan" : "Tidak ada data"
                  }
                />
                {errors.id_karyawan && (
                  <span className="error-message">{errors.id_karyawan}</span>
                )}
              </div>

              {/* Field Dropdown Barang dengan fitur pencarian */}
              <div className="form-group">
                <label>
                  Nama Barang <span className="required-star">*</span>
                </label>
                <Select
                  options={barangOptions}
                  value={barangOptions.find(
                    (option) => option.value === formData.id_inventaris
                  )}
                  onChange={handleBarangChange}
                  placeholder="-- Pilih Barang --"
                  isSearchable
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={customStyles}
                  noOptionsMessage={({ inputValue }) =>
                    inputValue
                      ? "Data tidak ditemukan"
                      : "Tidak ada barang yang tersedia"
                  }
                />
                {errors.id_inventaris && (
                  <span className="error-message">{errors.id_inventaris}</span>
                )}
              </div>

              {/* Field Pilihan Status Penjualan */}
              <div className="form-group">
                <label>
                  Status Penjualan <span className="required-star">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className={errors.status ? "error" : ""}
                >
                  <option value="">-- Pilih Status --</option>
                  <option value="belum lunas">Belum Lunas</option>
                  <option value="lunas">Lunas</option>
                </select>
                {errors.status && (
                  <span className="error-message">{errors.status}</span>
                )}
              </div>

              {/* Field Total Harga (Read-only, otomatis terisi saat barang dipilih) */}
              <div className="form-group">
                <label>
                  Total Harga <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="harga_jual"
                  placeholder="Diambil otomatis dari inventaris"
                  value={formData.harga_jual}
                  onChange={handleChange}
                  required
                  disabled
                  className={
                    errors.harga_jual
                      ? "error readonly-input"
                      : "readonly-input"
                  }
                />
                {errors.harga_jual && (
                  <span className="error-message">{errors.harga_jual}</span>
                )}
                <small className="input-hint">
                  Harga total barang (tidak bisa diubah)
                </small>
              </div>

              {/* Field Nominal yang dibayar oleh pembeli */}
              <div className="form-group">
                <label>
                  Jumlah Dibayar <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="jumlah_terbayar"
                  placeholder="Contoh: 500.000"
                  value={formData.jumlah_terbayar}
                  onChange={handleChange}
                  required
                  disabled={isJumlahBayarDisabled}
                  className={errors.jumlah_terbayar ? "error" : ""}
                />
                {errors.jumlah_terbayar && (
                  <span className="error-message">
                    {errors.jumlah_terbayar}
                  </span>
                )}
                <small className="input-hint">
                  {isJumlahBayarDisabled
                    ? "Auto sesuai total harga"
                    : "Masukkan jumlah yang sudah dibayar"}
                </small>
              </div>

              {/* Field Tampilan Sisa Bayar (Otomatis berkurang) */}
              <div className="form-group">
                <label>Sisa Pembayaran</label>
                <input
                  type="text"
                  value={`Rp ${Math.max(sisaPembayaran, 0).toLocaleString(
                    "id-ID"
                  )}`}
                  disabled
                  className="readonly-input"
                />
                <small className="input-hint">
                  Auto calculate: Total - Jumlah Bayar
                </small>
              </div>

              {/* Field Pilihan Metode Pembayaran */}
              <div className="form-group">
                <label>
                  Metode Pembayaran <span className="required-star">*</span>
                </label>
                <select
                  name="metode_pembayaran"
                  value={formData.metode_pembayaran}
                  onChange={handleChange}
                  required
                  className={errors.metode_pembayaran ? "error" : ""}
                >
                  <option value="">-- Pilih Metode --</option>
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer</option>
                </select>
                {errors.metode_pembayaran && (
                  <span className="error-message">
                    {errors.metode_pembayaran}
                  </span>
                )}
              </div>

              {/* Field Input Tanggal Penjualan */}
              <div className="form-group">
                <label>
                  Tanggal <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  required
                  className={errors.tanggal ? "error" : ""}
                />
                {errors.tanggal && (
                  <span className="error-message">{errors.tanggal}</span>
                )}
              </div>

              {/* Field TextArea untuk Catatan Tambahan */}
              <div className="form-group full-width">
                <label>Keterangan</label>
                <textarea
                  name="keterangan"
                  placeholder="Tuliskan keterangan tambahan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Tombol aksi form */}
          <div className="form-buttons">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/app/penjualan-aset")}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading || !isFormValid}
              style={{
                backgroundColor:
                  !isFormValid || loading ? "#9ca3af" : "#3b82f6",
                color: !isFormValid || loading ? "#6b7280" : "white",
                cursor: !isFormValid || loading ? "not-allowed" : "pointer",
                borderColor: !isFormValid || loading ? "#d1d5db" : "#3b82f6",
                opacity: !isFormValid || loading ? 0.6 : 1,
              }}
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TambahPenjualanAset;