import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import mockApi from "../api/mockApi";
import { FaChevronDown } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/EditTambahKendalaBarang.css";

function TambahKendalaBarang() {
  const API_URL = "/kendala-barang";
  const KARYAWAN_API_URL = "/karyawans";
  const PEMINJAMAN_API_URL =
    "/pinjamkembalis";
  const INVENTARIS_API_URL =
    "/inventaris";

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id_karyawan: "",
    id_inventaris: "",
    deskripsi_kendala: "",
    tanggal_kendala: new Date().toISOString().split("T")[0],
    status: "Open",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [karyawanList, setKaryawanList] = useState([]);
  const [inventarisList, setInventarisList] = useState([]);
  const [karyawanLoading, setKaryawanLoading] = useState(true);
  const [inventarisLoading, setInventarisLoading] = useState(false);

  // State untuk search dan dropdown
  const [searchKaryawan, setSearchKaryawan] = useState("");
  const [searchBarang, setSearchBarang] = useState("");
  const [showDropdownKaryawan, setShowDropdownKaryawan] = useState(false);
  const [showDropdownBarang, setShowDropdownBarang] = useState(false);

  useEffect(() => {
    fetchKaryawanWithBarangDipinjam();
  }, []);

  // 🔹 FUNGSI BARU: Ambil data karyawan yang memiliki barang dipinjam
  const fetchKaryawanWithBarangDipinjam = async () => {
    setKaryawanLoading(true);

    try {
      // Ambil data peminjaman dulu
      const peminjamanResponse = await mockApi.get(PEMINJAMAN_API_URL);
      console.log("📦 Data peminjaman:", peminjamanResponse.data);

      let dataPeminjaman = [];
      if (
        peminjamanResponse.data &&
        peminjamanResponse.data.data &&
        Array.isArray(peminjamanResponse.data.data)
      ) {
        dataPeminjaman = peminjamanResponse.data.data;
      }

      // Filter hanya yang status "Dipinjam"
      const barangDipinjam = dataPeminjaman.filter(
        (peminjaman) =>
          peminjaman && peminjaman.status?.toString().trim() === "Dipinjam"
      );

      console.log("📦 Barang yang sedang dipinjam:", barangDipinjam);

      // Ambil daftar karyawan unik yang memiliki barang dipinjam
      const karyawanUnik = [
        ...new Set(barangDipinjam.map((p) => p.nama_karyawan)),
      ];
      console.log("👥 Karyawan dengan barang dipinjam:", karyawanUnik);

      // Sekarang ambil data lengkap karyawan
      const karyawanResponse = await mockApi.get(KARYAWAN_API_URL);
      console.log("👥 Semua data karyawan:", karyawanResponse.data);

      let semuaKaryawan = [];
      if (karyawanResponse.data && karyawanResponse.data.data) {
        semuaKaryawan = Array.isArray(karyawanResponse.data.data)
          ? karyawanResponse.data.data
          : [karyawanResponse.data.data];
      } else if (Array.isArray(karyawanResponse.data)) {
        semuaKaryawan = karyawanResponse.data;
      }

      // Filter karyawan yang memiliki barang dipinjam
      const karyawanFiltered = semuaKaryawan.filter((karyawan) =>
        karyawanUnik.includes(karyawan.nama)
      );

      console.log(
        "✅ Karyawan dengan barang dipinjam (lengkap):",
        karyawanFiltered
      );
      setKaryawanList(karyawanFiltered);
    } catch (err) {
      console.error("Error fetching data:", err);
      setKaryawanList([]);
    } finally {
      setKaryawanLoading(false);
    }
  };

  // 🔹 FUNGSI YANG DIPERBAIKI: Mengambil barang yang dipinjam oleh karyawan tertentu
  const fetchBarangDipinjamByKaryawan = async (idKaryawan, namaKaryawan) => {
    if (!idKaryawan || !namaKaryawan) {
      setInventarisList([]);
      setFormData((prev) => ({ ...prev, id_inventaris: "" }));
      setSearchBarang("");
      return;
    }

    setInventarisLoading(true);
    try {
      console.log(
        `📦 Fetching barang untuk: ${namaKaryawan} (ID: ${idKaryawan})`
      );

      // Ambil semua data peminjaman
      const response = await mockApi.get(PEMINJAMAN_API_URL);
      let dataPeminjaman = [];

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        dataPeminjaman = response.data.data;
      }

      console.log("📦 Semua data peminjaman:", dataPeminjaman);

      // 🔹 PERBAIKAN: Filter barang yang dipinjam oleh karyawan ini
      const barangDipinjam = dataPeminjaman.filter((peminjaman) => {
        if (!peminjaman) return false;

        const status = peminjaman.status?.toString().trim();
        const namaKaryawanPeminjaman = peminjaman.nama_karyawan
          ?.toString()
          .trim();

        console.log(
          `🔍 Checking: ${namaKaryawanPeminjaman} vs ${namaKaryawan}, Status: ${status}`
        );

        return status === "Dipinjam" && namaKaryawanPeminjaman === namaKaryawan;
      });

      console.log(`📦 Barang dipinjam oleh ${namaKaryawan}:`, barangDipinjam);

      if (barangDipinjam.length === 0) {
        setInventarisList([]);
        console.warn(`⚠️ Tidak ada barang yang dipinjam oleh ${namaKaryawan}`);
        return;
      }

      // Ambil semua data inventaris untuk mapping
      const inventarisResponse = await mockApi.get(INVENTARIS_API_URL);
      const allInventaris = inventarisResponse.data.data || [];
      console.log("📦 Semua data inventaris:", allInventaris);

      // Mapping data barang dipinjam dengan data inventaris
      const inventarisWithDetails = barangDipinjam
        .map((peminjaman) => {
          // Cari inventaris dengan nama barang yang sama
          const inventarisDetail = allInventaris.find(
            (inv) =>
              inv.nama_barang?.toString().trim().toLowerCase() ===
              peminjaman.nama_barang?.toString().trim().toLowerCase()
          );

          console.log(
            `🔍 Mapping: ${peminjaman.nama_barang} ->`,
            inventarisDetail
          );

          if (!inventarisDetail) {
            console.warn(
              `⚠️ Inventaris tidak ditemukan untuk: ${peminjaman.nama_barang}`
            );
            return null;
          }

          return {
            id_inventaris: inventarisDetail.id_inventaris,
            nama_barang: peminjaman.nama_barang,
            id: inventarisDetail.id_inventaris, // Use id_inventaris as ID
            id_peminjaman: peminjaman.id_peminjaman,
            nama_karyawan: peminjaman.nama_karyawan,
            status: peminjaman.status,
            tanggal_peminjaman: peminjaman.tanggal_peminjaman,
            // Include inventaris detail for debugging
            inventaris_detail: inventarisDetail,
          };
        })
        .filter((item) => item !== null);

      console.log(
        "📦 Data barang akhir untuk dropdown:",
        inventarisWithDetails
      );
      setInventarisList(inventarisWithDetails);
    } catch (err) {
      console.error("❌ Error fetching barang dipinjam:", err);
      setInventarisList([]);
    } finally {
      setInventarisLoading(false);
    }
  };

  // 🔹 Filter data karyawan berdasarkan search
  const filteredKaryawan = karyawanList.filter((karyawan) =>
    karyawan.nama?.toLowerCase().includes(searchKaryawan.toLowerCase())
  );

  // 🔹 Filter data barang berdasarkan search
  const filteredBarang = inventarisList.filter((barang) =>
    barang.nama_barang?.toLowerCase().includes(searchBarang.toLowerCase())
  );

  // 🔹 Handle select karyawan dari dropdown custom
  const handleSelectKaryawan = async (id, nama) => {
    setFormData((prev) => ({
      ...prev,
      id_karyawan: id,
      id_inventaris: "", // Reset barang ketika ganti karyawan
    }));
    setSearchKaryawan(nama);
    setShowDropdownKaryawan(false);
    setSearchBarang(""); // Reset search barang

    // Clear error
    if (errors.id_karyawan) {
      setErrors((prev) => ({ ...prev, id_karyawan: "" }));
    }

    // Fetch barang yang dipinjam oleh karyawan ini
    if (id && nama) {
      await fetchBarangDipinjamByKaryawan(id, nama);
    } else {
      setInventarisList([]);
    }
  };

  // 🔹 Handle select barang dari dropdown custom
  const handleSelectBarang = (id, namaBarang) => {
    setFormData((prev) => ({ ...prev, id_inventaris: id }));
    setSearchBarang(namaBarang);
    setShowDropdownBarang(false);

    // Clear error
    if (errors.id_inventaris) {
      setErrors((prev) => ({ ...prev, id_inventaris: "" }));
    }
  };

  // 🔹 Handle search input change untuk karyawan
  const handleSearchKaryawanChange = (e) => {
    setSearchKaryawan(e.target.value);
    setShowDropdownKaryawan(true);
    if (!e.target.value) {
      setFormData((prev) => ({ ...prev, id_karyawan: "" }));
      setInventarisList([]);
      setSearchBarang("");
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

  // 🔹 Handle perubahan field lainnya
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 🔹 Validasi sebelum submit
  const validateForm = () => {
    const newErrors = {};

    if (!formData.id_karyawan) {
      newErrors.id_karyawan = ["Nama karyawan wajib dipilih"];
    }

    if (!formData.id_inventaris) {
      newErrors.id_inventaris = ["Nama barang wajib dipilih"];
    }

    if (!formData.tanggal_kendala) {
      newErrors.tanggal_kendala = ["Tanggal kendala wajib diisi"];
    }

    return newErrors;
  };

  // 🔹 Submit data ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validasi frontend
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Harap perbaiki error berikut sebelum menyimpan!",
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Mengerti",
      });
      return;
    }

    // 🔹 KONFIRMASI SEBELUM SIMPAN
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Simpan",
      text: "Apakah Anda yakin ingin menyimpan data kendala ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        id_karyawan: parseInt(formData.id_karyawan),
        id_inventaris: parseInt(formData.id_inventaris),
        deskripsi_kendala: formData.deskripsi_kendala || "",
        tanggal_kendala: formData.tanggal_kendala,
        status: "Open",
      };

      console.log("📤 Payload yang dikirim:", payload);

      const response = await mockApi.post(API_URL, payload);
      console.log("✅ Response sukses:", response.data);

      navigate("/app/kendala-barang", {
        state: {
          showSuccessAlert: true,
          successMessage: "Data kendala berhasil disimpan.",
        },
      });
    } catch (error) {
      console.error("❌ Gagal simpan data:", error);
      console.log("📋 Response error detail:", error.response);

      let errorMessage = "Terjadi kesalahan saat menyimpan data.";

      if (error.response?.status === 422) {
        const errorMessages = error.response.data.errors || {};
        setErrors(errorMessages);
        errorMessage =
          Object.values(errorMessages)[0]?.[0] || "Validasi data gagal.";

        Swal.fire({
          title: "Validasi Gagal!",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Mengerti",
        });
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Data tidak valid.";

        Swal.fire({
          title: "Gagal!",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Mengerti",
        });
      } else if (error.response?.data?.message) {
        // 🔥 TAMPILKAN PESAN ERROR DARI BACKEND DENGAN DETAIL
        errorMessage = error.response.data.message;

        Swal.fire({
          title: "Gagal Menyimpan!",
          html: `
          <div style="text-align: left;">
            <p><strong>Error:</strong> ${errorMessage}</p>
            ${
              error.response.data.error
                ? `<p><strong>Detail:</strong> ${error.response.data.error}</p>`
                : ""
            }
          </div>
        `,
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Mengerti",
        });
      } else if (error.response?.status === 500) {
        Swal.fire({
          title: "Error Server!",
          text: "Terjadi kesalahan di server. Silakan coba lagi atau hubungi administrator.",
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Mengerti",
        });
      } else {
        Swal.fire({
          title: "Kesalahan Jaringan!",
          text: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Mengerti",
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
            <h2>Tambah Data Kendala Barang</h2>

            {/* Section Informasi Kendala */}
            <div className="section-info">
              <h3>Informasi Kendala</h3>

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
                      disabled={karyawanLoading}
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
                          {karyawanLoading
                            ? "Memuat data..."
                            : "Tidak ada karyawan dengan barang dipinjam"}
                        </div>
                      </div>
                    )}
                  {errors.id_karyawan && (
                    <span className="error-text">{errors.id_karyawan[0]}</span>
                  )}
                  {karyawanLoading && (
                    <small style={{ color: "#666", fontSize: "12px" }}>
                      Memuat data karyawan...
                    </small>
                  )}
                </div>

                {/* Nama Barang dengan Search */}
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
                      placeholder={
                        !formData.id_karyawan
                          ? "Pilih karyawan terlebih dahulu"
                          : inventarisLoading
                          ? "Memuat barang..."
                          : "Cari nama barang..."
                      }
                      className={errors.id_inventaris ? "error-input" : ""}
                      disabled={!formData.id_karyawan || inventarisLoading}
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
                          {!formData.id_karyawan
                            ? "Pilih karyawan terlebih dahulu"
                            : inventarisLoading
                            ? "Memuat data barang..."
                            : "Tidak ada barang dipinjam"}
                        </div>
                      </div>
                    )}
                  {errors.id_inventaris && (
                    <span className="error-text">
                      {errors.id_inventaris[0]}
                    </span>
                  )}
                </div>

                {/* Tanggal Kendala */}
                <div className="form-group">
                  <label htmlFor="tanggal_kendala" className="required">
                    Tanggal Kendala
                  </label>
                  <input
                    id="tanggal_kendala"
                    type="date"
                    name="tanggal_kendala"
                    value={formData.tanggal_kendala}
                    onChange={handleInputChange}
                    required
                    className={errors.tanggal_kendala ? "error-input" : ""}
                  />
                  {errors.tanggal_kendala && (
                    <span className="error-text">
                      {errors.tanggal_kendala[0]}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="form-group">
                  <label htmlFor="status" className="required">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className={errors.status ? "error-input" : ""}
                    disabled
                  >
                    <option value="Open">Open</option>
                    <option value="In progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                  {errors.status && (
                    <span className="error-text">{errors.status[0]}</span>
                  )}
                </div>

                {/* Deskripsi Kendala */}
                <div className="form-group full-width">
                  <label htmlFor="deskripsi_kendala">Deskripsi</label>
                  <textarea
                    id="deskripsi_kendala"
                    name="deskripsi_kendala"
                    value={formData.deskripsi_kendala}
                    onChange={handleInputChange}
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

            {/* Tombol Aksi */}
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
                disabled={
                  loading || !formData.id_karyawan || !formData.id_inventaris
                }
                onClick={handleSubmit}
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

export default TambahKendalaBarang;
