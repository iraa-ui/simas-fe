// src/pages/TambahPenjualanAset.jsx
import React, { useState, useEffect } from "react";
import mockApi from "../api/mockApi";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import "../styles/TambahEditPenjualanAset.css";

function TambahPenjualanAset() {
  const API_BARANG = "/inventaris";
  const API_KARYAWAN = "/karyawans";
  const API_PENJUALAN =
    "/penjualan_asset";

  const navigate = useNavigate();

  const [barangList, setBarangList] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState(null);
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

  // State untuk react-select options
  const [karyawanOptions, setKaryawanOptions] = useState([]);
  const [barangOptions, setBarangOptions] = useState([]);

  const [isFormValid, setIsFormValid] = useState(false);

  // Fungsi yang lebih sederhana dan reliable
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

    // Cek jumlah_terbayar berdasarkan status
    const dibayar = unformatNumber(formData.jumlah_terbayar);

    if (formData.status === "lunas") {
      if (dibayar !== total) return false;
    } else if (formData.status === "belum lunas") {
      if (dibayar <= 0 || dibayar >= total) return false;
    }

    // Cek tidak ada error critical
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

  // useEffect untuk memantau perubahan form
  useEffect(() => {
    setIsFormValid(checkFormValidity());
  }, [formData, errors]);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    Promise.all([mockApi.get(API_BARANG), mockApi.get(API_KARYAWAN)])
      .then(([barangRes, karyawanRes]) => {
        const allBarang = barangRes.data.data || [];
        const allKaryawan = karyawanRes.data.data || [];

        // Filter barang dengan kondisi 'Baik' dan status 'Tersedia'
        const availableBarang = allBarang.filter(
          (barang) =>
            barang.kondisi?.toLowerCase() === "baik" &&
            barang.status?.toLowerCase() === "tersedia"
        );

        setBarangList(availableBarang);
        setKaryawanList(allKaryawan);

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
        console.log(
          "Barang available (Baik & Tersedia):",
          availableBarang.length
        );
        console.log("Barang available:", availableBarang);
      })
      .catch((err) => {
        console.error("Gagal mengambil data:", err);
        alert("Gagal memuat data");
      });
  }, []);

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
    // eslint-disable-next-line
  }, [formData.id_inventaris, barangList]);

  // Format angka ke format ribuan (contoh: 2000 -> "2.000")
  const formatRupiah = (value) => {
    if (value === null || value === undefined) return "";
    const numberString = value.toString().replace(/\D/g, "");
    if (!numberString) return "";
    return parseInt(numberString, 10).toLocaleString("id-ID");
  };

  // Hapus format ribuan (contoh: "2.000" -> 2000)
  const unformatNumber = (value) => {
    if (!value) return 0;
    const parsed = parseFloat(
      value.toString().replace(/\./g, "").replace(",", ".")
    );
    return isNaN(parsed) ? 0 : parsed;
  };

  // Hitung sisa pembayaran (total - dibayar)
  const calculateSisa = () => {
    const total = unformatNumber(formData.harga_jual);
    const dibayar = unformatNumber(formData.jumlah_terbayar);
    const sisa = total - dibayar;
    return sisa < 0 ? 0 : sisa;
  };

  // Handler untuk react-select karyawan
  const handleKaryawanChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      id_karyawan: selectedOption ? selectedOption.value : "",
    }));

    if (errors.id_karyawan) {
      setErrors((prev) => ({ ...prev, id_karyawan: "" }));
    }
  };

  // Handler untuk react-select barang
  const handleBarangChange = (selectedOption) => {
    const newIdInventaris = selectedOption ? selectedOption.value : "";

    setFormData((prev) => ({
      ...prev,
      id_inventaris: newIdInventaris,
    }));

    // Set harga jual otomatis ketika barang dipilih
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Format otomatis untuk harga_jual dan jumlah_terbayar seperti sebelumnya
    if (name === "harga_jual" || name === "jumlah_terbayar") {
      const cleaned = unformatNumber(value);
      updatedValue = formatRupiah(cleaned);
    }

    // copy existing state and update the field
    let updatedFormData = {
      ...formData,
      [name]: updatedValue,
    };

    // jika status diubah, jalankan logic yang sudah ada (tidak dihapus)
    if (name === "status") {
      if (value === "lunas") {
        // set tanggal sekarang & jumlah_terbayar = harga_jual (formatted)
        updatedFormData.tanggal = getTodayDate();
        updatedFormData.jumlah_terbayar = updatedFormData.harga_jual || "";
      } else if (value === "belum lunas") {
        updatedFormData.tanggal = getTodayDate();
        // kosongkan jumlah_terbayar agar user isi sendiri
        updatedFormData.jumlah_terbayar = "";
      } else {
        updatedFormData.tanggal = "";
        updatedFormData.jumlah_terbayar = "";
      }
    }

    // RE-VALIDASI REALTIME untuk jumlah_terbayar:
    // tampilkan error hanya jika jumlah bayar > total
    if (name === "jumlah_terbayar") {
      const total = parseFloat(unformatNumber(formData.harga_jual)) || 0;
      const dibayar = parseFloat(unformatNumber(value)) || 0;

      if (dibayar > total) {
        setErrors((prev) => ({
          ...prev,
          jumlah_terbayar: "Jumlah bayar tidak boleh lebih dari total harga",
        }));
      } else {
        // jika valid, hapus error jumlah_terbayar (tetap pertahankan error lain)
        setErrors((prev) => ({ ...prev, jumlah_terbayar: "" }));
      }

      // tambahan: jika status === 'lunas' dan user mengubah jumlah_terbayar,
      // biarkan submit logic mengecek konsistensi (tidak otomatis merubah status)
    }

    // set kembali state formData
    setFormData(updatedFormData);

    // jika ada error untuk field ini, hapus (preserve behavior sebelumnya)
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};

    // Ambil angka bersih untuk pengecekan (sama seperti sebelumnya)
    const total = parseFloat(unformatNumber(formData.harga_jual)) || 0;
    const dibayar = parseFloat(unformatNumber(formData.jumlah_terbayar)) || 0;

    // Validasi lama tetap utuh
    if (!formData.id_karyawan)
      newErrors.id_karyawan = "Pilih karyawan terlebih dahulu";
    if (!formData.id_inventaris)
      newErrors.id_inventaris = "Pilih barang terlebih dahulu";
    if (!formData.harga_jual || total <= 0)
      newErrors.harga_jual = "Harga jual harus diisi dan lebih dari 0";
    if (!formData.metode_pembayaran)
      newErrors.metode_pembayaran = "Pilih metode pembayaran";
    if (!formData.status) newErrors.status = "Status harus diisi";
    if (!formData.tanggal) newErrors.tanggal = "Tanggal harus diisi";

    // Tambahan proteksi: jumlah bayar tidak boleh lebih dari total
    if (dibayar > total) {
      newErrors.jumlah_terbayar =
        "Jumlah bayar tidak boleh melebihi total harga";
    }

    // Validasi sesuai status (preserve original behavior)
    if (formData.status === "lunas") {
      if (dibayar !== total) {
        newErrors.jumlah_terbayar =
          "Untuk status Lunas, jumlah bayar harus sama dengan total harga";
      }
    } else if (formData.status === "belum lunas") {
      if (!dibayar || dibayar <= 0) {
        newErrors.jumlah_terbayar = "Jumlah bayar harus diisi";
      } else if (dibayar >= total) {
        newErrors.jumlah_terbayar =
          "Untuk status Belum Lunas, jumlah bayar harus kurang dari total harga";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 🔥 KONFIRMASI SIMPAN
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

    // Siapkan payload seperti sebelumnya (kirim angka bersih)
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
        // 🔥 REDIRECT KE PENJUALAN ASET DENGAN PARAMETER
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

  // Custom styles untuk react-select
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
              {/* Nama Karyawan */}
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

              {/* Nama Barang */}
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

              {/* Status */}
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

              {/* Total Harga */}
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

              {/* Jumlah Dibayar */}
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

              {/* Sisa Pembayaran - TIDAK REQUIRED */}
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

              {/* Metode Pembayaran */}
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

              {/* Tanggal */}
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

              {/* Keterangan - TIDAK REQUIRED */}
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
