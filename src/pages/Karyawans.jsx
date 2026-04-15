import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import mockApi from "../api/mockApi";
import Swal from "sweetalert2";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaPlus,
  FaFilter,
  FaChevronDown,
  FaUser,
  FaIdCard,
  FaCalendarAlt,
  FaInfoCircle,
} from "react-icons/fa";
import "../styles/Karyawans.css";
import dataTidakDitemukan from "../assets/data-tidak-ada.png";

function Karyawans() {
  // 🔹 Inisialisasi API URL dan Hooks Navigasi
  const API_URL = "/karyawans";
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 State Utama untuk Data dan Status Loading
  const [dataKaryawan, setDataKaryawan] = useState([]);
  const [allData, setAllData] = useState([]); // Master data untuk filter/search lokal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");

  // 🔹 State untuk Modal Detail Karyawan
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 🔹 State untuk Kontrol Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🔹 State untuk Kontrol Filter Status
  const [activeFilter, setActiveFilter] = useState("semua");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // 🔹 Side Effect: Fetch data saat komponen load atau ada notifikasi sukses dari page lain
  useEffect(() => {
    fetchData();

    // Cek notifikasi sukses (setelah redirect dari Tambah/Edit)
    if (location.state?.showSuccessAlert) {
      Swal.fire({
        title: "Berhasil!",
        text: location.state.successMessage || "Data berhasil disimpan.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchData();

      // Reset state navigasi agar alert tidak muncul berulang kali
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  // 🔹 Fungsi Fetching Data dari Mock API
  const fetchData = () => {
    setLoading(true);
    setError(false);
    setSearchError("");

    mockApi
      .get(API_URL, { timeout: 5000 })
      .then((response) => {
        let hasil =
          response.data.data || response.data.karyawan || response.data || [];

        if (Array.isArray(hasil) && hasil.length > 0) {
          // Sortir berdasarkan created_at (Terbaru di atas)
          hasil = hasil.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
          });

          setDataKaryawan(hasil);
          setAllData(hasil);
        } else {
          setDataKaryawan([]);
          setAllData([]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data karyawan:", err);
        setError(true);
        setDataKaryawan([]);
        setAllData([]);
        setLoading(false);
      });
  };

  // 🔹 Fungsi Logika Filter Berdasarkan Status (Active/Inactive)
  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    setCurrentPage(1);
    setShowFilterDropdown(false);

    if (filterType === "semua") {
      setDataKaryawan(allData);
      return;
    }

    const filteredData = allData.filter((item) => {
      const status = item.status?.toLowerCase() || "";

      switch (filterType) {
        case "active":
          return status === "active";
        case "inactive":
          return status === "inactive";
        default:
          return true;
      }
    });

    setDataKaryawan(filteredData);
  };

  // 🔹 Fungsi Navigasi Halaman Table
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // 🔹 Fungsi Mengubah Limit Data per Halaman
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // 🔹 Side Effect: Pencarian Otomatis saat user mengetik
  useEffect(() => {
    if (!searchQuery.trim()) {
      applyFilter(activeFilter);
      setCurrentPage(1);
      setSearchError("");
      return;
    }

    const searchLower = searchQuery.toLowerCase();
    let hasil = allData.filter((item) => {
      const nama = (item.nama || "").toLowerCase();
      return nama.includes(searchLower);
    });

    // Gabungkan dengan filter status yang sedang aktif
    if (activeFilter !== "semua") {
      hasil = hasil.filter((item) => {
        const status = item.status?.toLowerCase() || "";

        switch (activeFilter) {
          case "active":
            return status === "active";
          case "inactive":
            return status === "inactive";
          default:
            return true;
        }
      });
    }

    setDataKaryawan(hasil);

    if (hasil.length > 0) {
      setDataKaryawan(hasil);
      setSearchError("");
    } else {
      setDataKaryawan([]);
      setSearchError("Data tidak ditemukan");
    }

    setCurrentPage(1);
  }, [searchQuery, allData, activeFilter]);

  // 🔹 Fungsi Reset Input Pencarian
  const handleResetSearch = () => {
    setSearchQuery("");
    setSearchError("");
    applyFilter(activeFilter);
    setCurrentPage(1);
  };

  // 🔹 Fungsi Aksi Hapus Data dengan Konfirmasi SweetAlert
  const handleDeleteClick = (item) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Data Karyawan ${item.nama} akan dihapus secara permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        mockApi
          .delete(`${API_URL}/${item.id}`)
          .then(() => {
            Swal.fire({
              title: "Berhasil!",
              text: "Data berhasil dihapus.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });
            fetchData(); // Refresh data table
          })
          .catch((error) => {
            console.error("Gagal menghapus data karyawan:", error);
            let errorMessage = "Gagal menghapus data karyawan.";
            if (error.response?.status === 403) {
              errorMessage =
                error.response.data.message ||
                "Karyawan ini sedang dalam aktivitas, tidak dapat dihapus.";
            } else if (error.response?.status === 404) {
              errorMessage = "Data karyawan tidak ditemukan.";
            }

            Swal.fire({
              title: "Gagal!",
              text: `${errorMessage}`,
              icon: "error",
            });
          });
      }
    });
  };

  // 🔹 Fungsi Membuka Modal dan Mengambil Detail Lengkap (termasuk Histori)
  const openDetailModal = async (item) => {
    setDetailLoading(true);
    setSelectedItem(item);
    setShowDetailModal(true);
    document.body.style.overflow = "hidden"; // Mencegah scroll pada background

    try {
      const response = await mockApi.get(`${API_URL}/${item.id}`);
      const data = response.data.data || response.data;
      if (data) {
        setSelectedItem({
          ...data,
          histori_karyawan: data.histori_karyawan || [],
        });
      }
    } catch (error) {
      console.error("Gagal mengambil detail karyawan:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 🔹 Fungsi Menutup Modal Detail
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
    document.body.style.overflow = "auto";
  };

  // 🔹 Fungsi Navigasi Tambah & Edit
  const handleTambahData = () => {
    navigate("/app/karyawans/tambah");
  };

  const handleEdit = (id) => {
    navigate(`/app/karyawans/edit/${id}`);
  };

  // 🔹 Helper untuk UI Text Dropdown Filter
  const getFilterDisplayText = () => {
    switch (activeFilter) {
      case "semua":
        return "Semua Status";
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      default:
        return "Semua Status";
    }
  };

  // 🔹 Helper untuk Styling Badge Status Table
  const getStatusBadge = (status) => {
    if (!status) return "karyawan-status-badge";

    const statusLower = status.toLowerCase();
    if (statusLower === "active") return "karyawan-status-badge active";
    if (statusLower === "inactive") return "karyawan-status-badge inactive";

    return "karyawan-status-badge";
  };

  // 🔹 Helper untuk Styling Badge Status Modal
  const getDetailStatusBadge = (status) => {
    if (!status) return "detail-status-badge";

    const statusLower = status.toLowerCase();
    if (statusLower === "active") return "detail-status-badge status-active";
    if (statusLower === "inactive")
      return "detail-status-badge status-inactive";

    return "detail-status-badge";
  };

  // 🔹 Helper Format Tanggal (Lengkap: Tanggal & Waktu)
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  // 🔹 Helper Format Tanggal (Hanya Tanggal)
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  // 🔹 Kalkulasi Logika Pagination Table
  const totalPages = Math.ceil(dataKaryawan.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = dataKaryawan.slice(indexOfFirstItem, indexOfLastItem);

  // Membuat list angka halaman untuk pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // 🔹 Komponen Render: Tampilan saat data kosong atau error
  const renderEmptyState = () => {
    return (
      <div className="empty-state">
        <img
          src={dataTidakDitemukan}
          alt="Data tidak ditemukan"
          className="empty-state-image"
        />
        <p className="empty-state-text">
          {searchQuery ? "Data tidak ditemukan" : "Tidak ada data karyawan"}
        </p>
      </div>
    );
  };

  // 🔹 Komponen Render: Tabel Histori di dalam Modal Detail
  const renderHistoriKaryawan = () => {
    if (
      !selectedItem?.histori_karyawan ||
      selectedItem.histori_karyawan.length === 0
    ) {
      return (
        <div className="empty-histori">
          <p>📝 Tidak ada histori peminjaman untuk karyawan ini.</p>
        </div>
      );
    }

    // Sortir histori terbaru
    const sortedHistori = [...selectedItem.histori_karyawan].sort((a, b) => {
      return (
        new Date(b.tanggal_dipinjam || b.created_at) -
        new Date(a.tanggal_dipinjam || a.created_at)
      );
    });

    // Batasi penampilan data histori (limit 5)
    const itemsPerPage = 5;
    const startIndex = 0;
    const endIndex = itemsPerPage;
    const currentHistoriData = sortedHistori.slice(startIndex, endIndex);

    return (
      <div className="histori-table-container-fixed">
        <table className="histori-table-improved">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Barang</th>
              <th>Tanggal Dipinjam</th>
              <th>Tanggal Dikembalikan</th>
              <th>Status</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {currentHistoriData.map((histori, index) => (
              <tr key={index}>
                <td className="text-center">{startIndex + index + 1}</td>
                <td>{histori.nama_barang || "-"}</td>
                <td>{formatDate(histori.tanggal_dipinjam)}</td>
                <td>{formatDate(histori.tanggal_dikembalikan)}</td>
                <td>
                  <span className={`histori-status-badge ${histori.status}`}>
                    {histori.status === "dipinjam"
                      ? "Dipinjam"
                      : "Dikembalikan"}
                  </span>
                </td>
                <td className="keterangan-cell">{histori.keterangan || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Info jika data histori melebihi limit tampilan */}
        {sortedHistori.length > itemsPerPage && (
          <div className="pagination-histori-info-improved">
            <p>
              Menampilkan {startIndex + 1} -{" "}
              {Math.min(endIndex, sortedHistori.length)} dari{" "}
              {sortedHistori.length} data histori
            </p>
            <p className="pagination-note">
              *Klik tombol pagination untuk melihat data selanjutnya
            </p>
          </div>
        )}
      </div>
    );
  };

  // 🔹 RENDER UTAMA KOMPONEN
  return (
    <div
      className={`master-main-content-fixed ${
        showDetailModal ? "modal-open" : ""
      }`}
    >
      <main className="master-main-content-fixed">
        {/* Header Bagian Judul */}
        <div className="page-header">
          <h1>Data Karyawan</h1>
        </div>

        {/* Section Kontrol: Search, Filter, dan Tambah Data */}
        <section className="master-table-section-fixed">
          <div className="section-header">
            <div className="header-actions">
              {/* Grup Pencarian */}
              <div className="search-form-compact">
                <div className="search-input-group-compact">
                  <FaSearch className="search-icon-compact" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama karyawan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-compact"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="btn-reset-compact"
                      title="Reset Pencarian"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Grup Dropdown Filter */}
              <div className="filter-dropdown-container">
                <div className="filter-dropdown">
                  <button
                    className="filter-dropdown-toggle"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <span>{getFilterDisplayText()}</span>
                    <FaChevronDown
                      className={`dropdown-arrow ${
                        showFilterDropdown ? "rotate" : ""
                      }`}
                    />
                  </button>

                  {showFilterDropdown && (
                    <div className="filter-dropdown-menu">
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "semua" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("semua")}
                      >
                        Semua Status
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "active" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("active")}
                      >
                        Active
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "inactive" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("inactive")}
                      >
                        Inactive
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button className="btn-tambah" onClick={handleTambahData}>
                <FaPlus /> Tambah Data
              </button>
            </div>
          </div>

          {/* Bagian Tabel Data */}
          <div className="table-container-fixed">
            {loading ? (
              <div className="loading-state">
                <p>Loading data...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <img
                  src={dataTidakDitemukan}
                  alt="Error"
                  className="empty-state-image"
                />
                <p className="empty-state-text">Data tidak ditemukan</p>
              </div>
            ) : currentData.length === 0 ? (
              renderEmptyState()
            ) : (
              <table className="table-fixed">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>NIP</th>
                    <th>Nama Karyawan</th>
                    <th>Aktivitas</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>{item.nip || "-"}</td>
                      <td>{item.nama || "-"}</td>
                      <td>
                        <span className={getStatusBadge(item.status)}>
                          {item.status || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="aksi-cell">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="aksi-btn view"
                            title="Detail"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="aksi-btn edit"
                            title="Edit"
                            onClick={() => handleEdit(item.id)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="aksi-btn delete"
                            title="Hapus"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Baris Kontrol Pagination Bawah */}
          {!loading && dataKaryawan.length > 0 && (
            <div className="pagination-container">
              {/* Seleksi Jumlah Row (Kiri) */}
              <div className="row-page-selection">
                <span className="row-page-label">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="row-page-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="row-page-info">
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, dataKaryawan.length)} of{" "}
                  {dataKaryawan.length} entries
                </span>
              </div>

              {/* Navigasi Halaman (Kanan) */}
              <div className="pagination-controls">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  &lt;
                </button>

                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination-btn ${
                      currentPage === number ? "active" : ""
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Bagian MODAL DETAIL FULLSCREEN */}
      {showDetailModal && selectedItem && (
        <>
          <div className="blur-overlay"></div>
          <div className="detail-modal-fullscreen">
            <div className="detail-modal-header">
              <h2>Detail Karyawan - {selectedItem.nama}</h2>
              <button className="close-btn" onClick={closeDetailModal}>
                ✖
              </button>
            </div>

            <div className="detail-modal-content-improved">
              {/* Kolom Informasi Data Diri */}
              <div className="detail-info-side">
                <div className="detail-info-card">
                  <h3>👤 Informasi Karyawan</h3>

                  <div className="detail-basic-info">
                    <div className="detail-name-section">
                      <div className="status-kondisi-container">
                        <div className="status-section">
                          <label>Status:</label>
                          <span
                            className={getDetailStatusBadge(
                              selectedItem.status
                            )}
                          >
                            {selectedItem.status || "-"}
                          </span>
                        </div>
                      </div>

                      <h4 className="detail-name-improved">
                        {selectedItem.nama || "-"}
                      </h4>

                      <div className="detail-no-inventaris-improved">
                        <span className="no-inventaris-badge">
                          🏷️ {selectedItem.nip || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-info-grid">
                    <div className="info-item">
                      <span className="info-label">NIP:</span>
                      <span className="info-value">
                        {selectedItem.nip || "-"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Nama:</span>
                      <span className="info-value">
                        {selectedItem.nama || "-"}
                      </span>
                    </div>

                    {selectedItem.email && (
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">
                          {selectedItem.email || "-"}
                        </span>
                      </div>
                    )}

                    {selectedItem.telepon && (
                      <div className="info-item">
                        <span className="info-label">Telepon:</span>
                        <span className="info-value">
                          {selectedItem.telepon || "-"}
                        </span>
                      </div>
                    )}

                    <div className="info-item">
                      <span className="info-label">Tanggal Dibuat:</span>
                      <span className="info-value">
                        {formatDateTime(selectedItem.created_at)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Tanggal Diupdate:</span>
                      <span className="info-value">
                        {formatDateTime(selectedItem.updated_at)}
                      </span>
                    </div>

                    {selectedItem.alamat && (
                      <div className="info-item full-width">
                        <span className="info-label">Alamat:</span>
                        <span className="info-value keterangan-cell">
                          {selectedItem.alamat || "-"}
                        </span>
                      </div>
                    )}

                    {selectedItem.keterangan && (
                      <div className="info-item full-width">
                        <span className="info-label">Keterangan:</span>
                        <span className="info-value keterangan-cell">
                          {selectedItem.keterangan || "-"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Kolom Histori Transaksi Karyawan */}
              <div className="histori-side">
                <div className="histori-card">
                  <h3>📊 Histori Karyawan</h3>

                  {detailLoading ? (
                    <div className="loading-histori">
                      <p>Memuat data histori...</p>
                    </div>
                  ) : (
                    renderHistoriKaryawan()
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Karyawans;