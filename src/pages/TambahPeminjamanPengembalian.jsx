import React, { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import mockApi from "../api/mockApi";
import {
  FaHome,
  FaChartLine,
  FaMoneyBill,
  FaCalendarAlt,
  FaShieldAlt,
  FaUser,
  FaBox,
  FaArrowLeft,
  FaChevronDown,
} from "react-icons/fa";
import "../styles/EditTambahPeminjamanPengembalian.css";
import logo from "../assets/logo.png";

// Import SweetAlert
import Swal from "sweetalert2";

function TambahPeminjamanPengembalian() {
  const navigate = useNavigate();
  const BASE_URL = "/pinjamkembalis";

  const [formData, setFormData] = useState({
    id_karyawan: "",
    id_inventaris: "",
    tanggal_peminjaman: "",
    notes: "",
    status: "Dipinjam", // 🔹 Default status Dipinjam
  });

  const [karyawanList, setKaryawanList] = useState([]);
  const [inventarisList, setInventarisList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // State untuk search
  const [searchKaryawan, setSearchKaryawan] = useState("");
  const [searchBarang, setSearchBarang] = useState("");
  const [showDropdownKaryawan, setShowDropdownKaryawan] = useState(false);
  const [showDropdownBarang, setShowDropdownBarang] = useState(false);

  // 🔹 Ambil daftar karyawan
  useEffect(() => {
    mockApi
      .get(`/karyawans`)
      .then((res) => {
        console.log("👥 Data Karyawan:", res.data);
        const data = res.data.data || res.data;
        console.log("🔑 Key karyawan pertama:", Object.keys(data[0] || {}));
        setKaryawanList(data);
      })
      .catch((err) => {
        console.error("Gagal ambil data karyawan:", err);
      });
  }, []);

  // 🔹 STEP 1: Ambil daftar barang (inventaris) - HANYA yang TERSEDIA dan KONDISI BAIK
  useEffect(() => {
    mockApi
      .get(`/inventaris`)
      .then((res) => {
        console.log("📦 Data Inventaris:", res.data);
        const data = res.data.data || res.data;

        // Filter barang:
        // - Status Tersedia DAN kondisi Baik
        // - Jangan tampilkan:
        //   * Status tidak tersedia tapi kondisi baik
        //   * Status tersedia tapi kondisi rusak
        const filteredItems = data.filter((item) => {
          const status = item.status?.toLowerCase() || "";
          const kondisi = item.kondisi?.toLowerCase() || "";

          // Hanya tampilkan barang dengan status "tersedia" dan kondisi "baik"
          return status === "tersedia" && kondisi === "baik";
        });

        console.log("🟢 Barang yang tersedia dan kondisi baik:", filteredItems);
        console.log(
          "🔴 Barang yang tidak ditampilkan:",
          data.filter((item) => {
            const status = item.status?.toLowerCase() || "";
            const kondisi = item.kondisi?.toLowerCase() || "";
            return !(status === "tersedia" && kondisi === "baik");
          })
        );

        setInventarisList(filteredItems);
      })
      .catch((err) => {
        console.error("Gagal ambil data inventaris:", err);
      });
  }, []);

  // 🔹 Filter data berdasarkan search
  const filteredKaryawan = karyawanList.filter((karyawan) =>
    karyawan.nama?.toLowerCase().includes(searchKaryawan.toLowerCase())
  );

  const filteredBarang = inventarisList.filter((barang) =>
    barang.nama_barang?.toLowerCase().includes(searchBarang.toLowerCase())
  );

  // 🔹 Handle input perubahan value form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Handle select karyawan
  const handleSelectKaryawan = (id, nama) => {
    setFormData((prev) => ({ ...prev, id_karyawan: id }));
    setSearchKaryawan(nama);
    setShowDropdownKaryawan(false);
  };

  // 🔹 Handle select barang
  const handleSelectBarang = (id, nama) => {
    setFormData((prev) => ({ ...prev, id_inventaris: id }));
    setSearchBarang(nama);
    setShowDropdownBarang(false);
  };

  // 🔹 Handle search input change untuk karyawan
  const handleSearchKaryawanChange = (e) => {
    setSearchKaryawan(e.target.value);
    setShowDropdownKaryawan(true);
    if (!e.target.value) {
      setFormData((prev) => ({ ...prev, id_karyawan: "" }));
    }
  };

  // 🔹 Handle search input change untuk barang
  const handleSearchBarangChange = (e) => {
    setSearchBarang(e.target.value);
    setShowDropdownBarang(true);
    if (!e.target.value) {
      setFormData((prev) => ({ ...prev, id_inventaris: "" }));
    }
  };

  // 🔹 Toggle dropdown untuk karyawan
  const toggleDropdownKaryawan = () => {
    setShowDropdownKaryawan(!showDropdownKaryawan);
  };

  // 🔹 Toggle dropdown untuk barang
  const toggleDropdownBarang = () => {
    setShowDropdownBarang(!showDropdownBarang);
  };

  // 🔹 Handle click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container-karyawan")) {
        setShowDropdownKaryawan(false);
      }
      if (!event.target.closest(".dropdown-container-barang")) {
        setShowDropdownBarang(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🔹 Submit data ke backend dengan SweetAlert
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validasi frontend
    if (
      !formData.id_karyawan ||
      !formData.id_inventaris ||
      !formData.tanggal_peminjaman
    ) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Harap lengkapi semua field yang wajib diisi!",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // 🔹 KONFIRMASI SEBELUM SIMPAN
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Simpan",
      text: "Apakah Anda yakin ingin menyimpan data peminjam ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    // Jika user membatalkan
    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        id_karyawan: parseInt(formData.id_karyawan),
        id_inventaris: parseInt(formData.id_inventaris),
        tanggal_peminjaman: formData.tanggal_peminjaman,
        notes: formData.notes || "",
        status: formData.status, // 🔹 Kirim status ke backend
      };

      console.log("📤 Payload yang dikirim:", payload);

      const response = await mockApi.post(`${BASE_URL}`, payload);
      console.log("✅ Response sukses:", response.data);

      // 🔹 LANGSUNG REDIRECT KE HALAMAN UTAMA DENGAN STATE SUCCESS
      navigate("/app/peminjaman-pengembalian", {
        state: {
          showSuccessAlert: true,
          successMessage: "Data peminjaman berhasil disimpan.",
        },
      });
    } catch (error) {
      console.error("❌ Gagal simpan data:", error);

      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
        const errorMessages = error.response.data.errors;

        // 🔹 Handle error spesifik untuk id_inventaris
        if (errorMessages.id_inventaris) {
          if (
            errorMessages.id_inventaris[0].includes("invalid") ||
            errorMessages.id_inventaris[0].includes("tidak valid")
          ) {
            Swal.fire({
              icon: "error",
              title: "Gagal!",
              text: "Barang tidak tersedia atau sedang dipinjam! Silakan pilih barang lain.",
              confirmButtonColor: "#3085d6",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: `Error: ${errorMessages.id_inventaris[0]}`,
              confirmButtonColor: "#3085d6",
            });
          }
        } else if (errorMessages.id_karyawan) {
          Swal.fire({
            icon: "error",
            title: "Error Karyawan",
            text: `Error: ${errorMessages.id_karyawan[0]}`,
            confirmButtonColor: "#3085d6",
          });
        } else {
          let errorText = "Validasi gagal:\n";
          Object.keys(errorMessages).forEach((key) => {
            errorText += `- ${key}: ${errorMessages[key][0]}\n`;
          });
          Swal.fire({
            icon: "error",
            title: "Validasi Gagal",
            text: errorText,
            confirmButtonColor: "#3085d6",
          });
        }
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
          title: "Kesalahan",
          text: "Terjadi kesalahan server atau jaringan!",
          confirmButtonColor: "#3085d6",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Tambah Data Peminjaman</h2>

            <div className="section-info">
              <h3>Informasi Peminjaman</h3>
              <div className="form-grid">
                {/* Nama Karyawan dengan Search */}
                <div className="form-group dropdown-container-karyawan">
                  <label htmlFor="search_karyawan" className="required">
                    Nama Karyawan
                  </label>
                  <div className="search-input-container">
                    <input
                      type="text"
                      id="search_karyawan"
                      value={searchKaryawan}
                      onChange={handleSearchKaryawanChange}
                      onFocus={() => setShowDropdownKaryawan(true)}
                      placeholder="Cari nama karyawan..."
                      className={errors.id_karyawan ? "error-input" : ""}
                    />
                    <div
                      className="dropdown-icon"
                      onClick={toggleDropdownKaryawan}
                    >
                      <FaChevronDown
                        className={`dropdown-arrow ${
                          showDropdownKaryawan ? "rotate" : ""
                        }`}
                      />
                    </div>
                  </div>
                  {showDropdownKaryawan && filteredKaryawan.length > 0 && (
                    <div className="dropdown-list">
                      {filteredKaryawan.map((k) => (
                        <div
                          key={k.id}
                          className="dropdown-item"
                          onClick={() => handleSelectKaryawan(k.id, k.nama)}
                        >
                          {k.nama}
                        </div>
                      ))}
                    </div>
                  )}
                  {showDropdownKaryawan &&
                    filteredKaryawan.length === 0 &&
                    searchKaryawan && (
                      <div className="dropdown-list">
                        <div className="dropdown-item no-results">
                          Data tidak ditemukan
                        </div>
                      </div>
                    )}
                  {errors.id_karyawan && (
                    <span className="error-text">{errors.id_karyawan[0]}</span>
                  )}
                </div>

                {/* Nama Barang dengan Search - Hanya yang TERSEDIA dan KONDISI BAIK */}
                <div className="form-group dropdown-container-barang">
                  <label htmlFor="search_barang" className="required">
                    Nama Barang
                  </label>
                  <div className="search-input-container">
                    <input
                      type="text"
                      id="search_barang"
                      value={searchBarang}
                      onChange={handleSearchBarangChange}
                      onFocus={() => setShowDropdownBarang(true)}
                      placeholder="Cari nama barang..."
                      className={errors.id_inventaris ? "error-input" : ""}
                    />
                    <div
                      className="dropdown-icon"
                      onClick={toggleDropdownBarang}
                    >
                      <FaChevronDown
                        className={`dropdown-arrow ${
                          showDropdownBarang ? "rotate" : ""
                        }`}
                      />
                    </div>
                  </div>
                  {showDropdownBarang && filteredBarang.length > 0 && (
                    <div className="dropdown-list">
                      {filteredBarang.map((inv) => {
                        const itemId = inv.id_inventaris || inv.id;
                        return (
                          <div
                            key={itemId}
                            className="dropdown-item"
                            onClick={() =>
                              handleSelectBarang(itemId, inv.nama_barang)
                            }
                          >
                            {inv.nama_barang}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {showDropdownBarang &&
                    filteredBarang.length === 0 &&
                    searchBarang && (
                      <div className="dropdown-list">
                        <div className="dropdown-item no-results">
                          Data tidak ditemukan
                        </div>
                      </div>
                    )}
                  {errors.id_inventaris && (
                    <span className="error-text">
                      {errors.id_inventaris[0]}
                    </span>
                  )}
                </div>

                {/* Tanggal Peminjaman */}
                <div className="form-group">
                  <label htmlFor="tanggal_peminjaman" className="required">
                    Tanggal Peminjaman
                  </label>
                  <input
                    id="tanggal_peminjaman"
                    type="date"
                    name="tanggal_peminjaman"
                    value={formData.tanggal_peminjaman}
                    onChange={handleChange}
                    required
                    className={errors.tanggal_peminjaman ? "error-input" : ""}
                  />
                  {errors.tanggal_peminjaman && (
                    <span className="error-text">
                      {errors.tanggal_peminjaman[0]}
                    </span>
                  )}
                </div>

                {/* Status - Default Dipinjam dan Disabled */}
                <div className="form-group">
                  <label htmlFor="status" className="required">
                    Status
                  </label>
                  <input
                    type="text"
                    id="status"
                    name="status"
                    value="Dipinjam"
                    disabled
                    className="disabled-input"
                  />
                </div>

                {/* Keterangan */}
                <div className="form-group full-width">
                  <label htmlFor="notes">Keterangan</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Tuliskan catatan tambahan (misal: keperluan, kondisi)"
                    className={errors.notes ? "error-input" : ""}
                    rows="3"
                  />
                  {errors.notes && (
                    <span className="error-text">{errors.notes[0]}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 🔹 Tombol Aksi */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/app/peminjaman-pengembalian")}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-save"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !formData.id_karyawan ||
                  !formData.id_inventaris ||
                  !formData.tanggal_peminjaman
                }
              >
                {loading ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TambahPeminjamanPengembalian;
