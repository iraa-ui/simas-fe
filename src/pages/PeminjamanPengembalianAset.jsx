import { useEffect, useState, useRef } from "react";
import mockApi from "../api/mockApi";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaPlus,
  FaFilter,
  FaChevronDown,
  FaCalendarAlt,
  FaUser,
  FaBox,
  FaStickyNote,
  FaInfoCircle,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/PeminjamanPengembalianAset.css";
import Swal from "sweetalert2";
import dataTidakDitemukan from "../assets/data-tidak-ada.png";

function PeminjamanPengembalianAset() {
  const API_URL = "/pinjamkembalis";
  const navigate = useNavigate();
  const location = useLocation();

  const [dataPeminjaman, setDataPeminjaman] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 🔹 State untuk detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 🔹 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🔹 State untuk Filter Dropdown
  const [activeFilter, setActiveFilter] = useState("semua");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchData();

    // 🔹 CEK APAKAH ADA STATE SUCCESS DARI HALAMAN TAMBAH/EDIT
    if (location.state?.showSuccessAlert) {
      Swal.fire({
        title: "Berhasil!",
        text: location.state.successMessage || "Data berhasil disimpan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // 🔹 HAPUS STATE AGAR TIDAK MUNCUL LAGI SAAT REFRESH
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const fetchData = () => {
    setLoading(true);
    setError(false);

    mockApi
      .get(API_URL, { timeout: 5000 })
      .then((response) => {
        const hasil =
          response.data.data || response.data.peminjaman || response.data || [];

        setDataPeminjaman(Array.isArray(hasil) ? hasil : []);
        setAllData(Array.isArray(hasil) ? hasil : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(true);
        setDataPeminjaman([]);
        setAllData([]);
        setLoading(false);
      });
  };

  // 🔹 FUNGSI FILTER DATA
  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    setCurrentPage(1);
    setShowFilterDropdown(false);

    if (filterType === "semua") {
      setDataPeminjaman(allData);
      return;
    }

    const filteredData = allData.filter((item) => {
      const status = item.status?.toLowerCase() || "";

      switch (filterType) {
        case "dipinjam":
          return status === "dipinjam";
        case "dikembalikan":
          return status === "dikembalikan";
        case "sedang-diperbaiki":
          // 🔥 PERBAIKAN: Handle kedua kemungkinan penulisan
          return (
            status === "sedang diperbaiki" ||
            status === "sedang diperbaikan" ||
            status === "sedang-diperbaikan"
          );
        default:
          return true;
      }
    });

    setDataPeminjaman(filteredData);
  };

  // 🔹 FUNGSI PAGINATION
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // 🔹 Fungsi untuk mengubah jumlah item per halaman
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // 🔹 Fungsi untuk pencarian data OTOMATIS
  useEffect(() => {
    if (!searchQuery.trim()) {
      applyFilter(activeFilter);
      setCurrentPage(1);
      return;
    }

    const searchLower = searchQuery.toLowerCase();
    let hasil = allData.filter((item) => {
      const namaKaryawan = (
        item.nama_karyawan ||
        item.id_karyawan ||
        ""
      ).toLowerCase();
      const namaBarang = (
        item.nama_barang ||
        item.id_inventaris ||
        ""
      ).toLowerCase();

      return (
        namaKaryawan.includes(searchLower) || namaBarang.includes(searchLower)
      );
    });

    // Apply filter tambahan pada hasil search
    if (activeFilter !== "semua") {
      hasil = hasil.filter((item) => {
        const status = item.status?.toLowerCase() || "";

        switch (activeFilter) {
          case "dipinjam":
            return status === "dipinjam";
          case "dikembalikan":
            return status === "dikembalikan";
          case "sedang-diperbaikan":
            return (
              status === "sedang diperbaikan" || status === "sedang-diperbaikan"
            );
          default:
            return true;
        }
      });
    }

    setDataPeminjaman(hasil);
    setCurrentPage(1);
  }, [searchQuery, allData, activeFilter]);

  // 🔹 Fungsi untuk konfirmasi hapus data
  const confirmDelete = async (item) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Data ${
        item?.nama_karyawan || item?.id_karyawan
      } akan dihapus secara permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      setDeleteLoading(true);

      try {
        await mockApi.delete(`${API_URL}/${item.id_peminjaman || item.id}`);

        Swal.fire({
          title: "Berhasil!",
          text: "Data berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchData();
      } catch (error) {
        console.error("Gagal menghapus data:", error);

        let errorMessage = "Terjadi kesalahan saat menghapus data.";

        if (error.response?.status === 403) {
          errorMessage =
            error.response.data.message ||
            "Data peminjaman dengan status dipinjam/sedang diperbaikan tidak dapat dihapus.";
        } else if (error.response?.status === 404) {
          errorMessage = "Data peminjaman tidak ditemukan.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        Swal.fire({
          title: "Gagal!",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "Ok",
        });
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    applyFilter(activeFilter);
    setCurrentPage(1);
  };

  // 🔹 Fungsi untuk membuka detail modal
  const openDetailModal = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    document.body.style.overflow = "hidden";
  };

  // 🔹 Fungsi untuk menutup detail modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
    document.body.style.overflow = "auto";
  };

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

  // 🔹 Get display text untuk filter dropdown
  const getFilterDisplayText = () => {
    switch (activeFilter) {
      case "semua":
        return "Semua Status";
      case "dipinjam":
        return "Dipinjam";
      case "dikembalikan":
        return "Dikembalikan";
      case "sedang-diperbaikan":
        return "Sedang Diperbaiki";
      default:
        return "Semua Status";
    }
  };

  // 🔹 Pagination Calculations
  const totalPages = Math.ceil(dataPeminjaman.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = dataPeminjaman.slice(indexOfFirstItem, indexOfLastItem);

  // Buat array angka halaman [1, 2, 3, ...]
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Function untuk mendapatkan class status badge di tabel
  const getStatusBadge = (status) => {
    if (!status) return "pp-status-badge";

    const statusLower = status.toLowerCase();
    if (statusLower === "dipinjam") return "pp-status-badge dipinjam";
    if (statusLower === "dikembalikan") return "pp-status-badge dikembalikan";
    if (
      statusLower === "sedang diperbaiki" ||
      statusLower === "sedang diperbaikan"
    )
      return "pp-status-badge sedang-diperbaiki";

    return "pp-status-badge";
  };

  // Function untuk mendapatkan class status badge di modal detail
  const getDetailStatusBadge = (status) => {
    if (!status) return "detail-status-badge";

    const statusLower = status.toLowerCase();
    if (statusLower === "dipinjam")
      return "detail-status-badge status-dipinjam";
    if (statusLower === "dikembalikan")
      return "detail-status-badge status-dikembalikan";
    if (
      statusLower === "sedang diperbaiki" ||
      statusLower === "sedang diperbaikan"
    )
      return "detail-status-badge status-sedang-diperbaiki";

    return "detail-status-badge";
  };

  // 🔹 Fungsi untuk format tampilan status
  const formatStatusDisplay = (status) => {
    if (!status) return "-";

    const statusLower = status.toLowerCase();
    if (
      statusLower === "sedang diperbaikan" ||
      statusLower === "sedang-diperbaikan"
    ) {
      return "Sedang Diperbaiki";
    }

    // Untuk status lain, tampilkan seperti biasa
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // 🔹 Fungsi untuk menampilkan state kosong
  const renderEmptyState = () => {
    return (
      <div className="empty-state">
        <img
          src={dataTidakDitemukan}
          alt="Data tidak ditemukan"
          className="empty-state-image"
        />
        <p className="empty-state-text">
          {searchQuery ? "Data tidak ditemukan" : "Tidak ada data peminjaman"}
        </p>
      </div>
    );
  };

  return (
    <div
      className={`master-main-content-fixed ${
        showDetailModal ? "modal-open" : ""
      }`}
    >
      {/* Main content */}
      <main className="master-main-content-fixed">
        <div className="page-header">
          <h1>Peminjaman dan Pengembalian Aset</h1>
        </div>

        <section className="master-table-section-fixed">
          <div className="section-header">
            <div className="header-actions">
              {/* Search Form - OTOMATIS */}
              <div className="search-form-compact">
                <div className="search-input-group-compact">
                  <FaSearch className="search-icon-compact" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama karyawan atau nama barang..."
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

              {/* 🔹 FILTER DROPDOWN */}
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
                          activeFilter === "dipinjam" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("dipinjam")}
                      >
                        Dipinjam
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "dikembalikan" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("dikembalikan")}
                      >
                        Dikembalikan
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "sedang-diperbaikan" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("sedang-diperbaikan")}
                      >
                        Sedang Diperbaiki
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Tambah Data */}
              <button
                className="btn-tambah"
                onClick={() => navigate("/app/peminjaman-pengembalian/tambah")}
              >
                <FaPlus /> Tambah Data
              </button>
            </div>
          </div>

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
                    <th>Nama Karyawan</th>
                    <th>Nama Barang</th>
                    <th>Tanggal Peminjaman</th>
                    <th>Tanggal Pengembalian</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => (
                    <tr key={item.id_peminjaman || index}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>{item.nama_karyawan || item.id_karyawan || "-"}</td>
                      <td>{item.nama_barang || item.id_inventaris || "-"}</td>
                      <td>{formatDate(item.tanggal_peminjaman)}</td>
                      <td>{formatDate(item.tanggal_pengembalian)}</td>
                      <td>
                        <span className={getStatusBadge(item.status)}>
                          {formatStatusDisplay(item.status)}
                        </span>
                      </td>
                      <td>{item.keterangan || item.notes || "-"}</td>
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
                            onClick={() =>
                              navigate(
                                `/app/peminjaman-pengembalian/edit/${
                                  item.id_peminjaman || item.id
                                }`
                              )
                            }
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="aksi-btn delete"
                            title="Hapus"
                            onClick={() => confirmDelete(item)}
                            disabled={deleteLoading}
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

          {/* 🔹 PAGINATION BARU - Row Page di Kiri, Pagination di Kanan */}
          {!loading && dataPeminjaman.length > 0 && (
            <div className="pagination-container">
              {/* Row Page Selection - Kiri */}
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
                  {Math.min(indexOfLastItem, dataPeminjaman.length)} of{" "}
                  {dataPeminjaman.length} entries
                </span>
              </div>

              {/* Pagination Controls - Kanan */}
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

      {/* 🔹 Detail Modal Fullscreen - Sama seperti StokBarang */}
      {showDetailModal && selectedItem && (
        <div className="detail-fullscreen-overlay" onClick={closeDetailModal}>
          <div
            className="detail-fullscreen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-fullscreen-header">
              <h2>
                <FaBox /> Detail Peminjaman Aset
              </h2>
              <button className="close-btn" onClick={closeDetailModal}>
                <FaTimes />
              </button>
            </div>

            <div className="detail-fullscreen-content">
              <div className="detail-fullscreen-grid">
                {/* Informasi Utama Peminjaman */}
                <div className="detail-main-info">
                  <h3>Informasi Peminjaman</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <FaInfoCircle className="info-icon" />
                      <div className="info-content">
                        <label>Status</label>
                        <p>
                          <span
                            className={getDetailStatusBadge(
                              selectedItem.status
                            )}
                          >
                            {formatStatusDisplay(selectedItem.status)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaUser className="info-icon" />
                      <div className="info-content">
                        <label>Nama Karyawan</label>
                        <p>
                          {selectedItem.nama_karyawan ||
                            selectedItem.id_karyawan ||
                            "-"}
                        </p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaBox className="info-icon" />
                      <div className="info-content">
                        <label>Nama Barang</label>
                        <p>
                          {selectedItem.nama_barang ||
                            selectedItem.id_inventaris ||
                            "-"}
                        </p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaCalendarAlt className="info-icon" />
                      <div className="info-content">
                        <label>Tanggal Peminjaman</label>
                        <p>{formatDate(selectedItem.tanggal_peminjaman)}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaCalendarAlt className="info-icon" />
                      <div className="info-content">
                        <label>Tanggal Pengembalian</label>
                        <p>{formatDate(selectedItem.tanggal_pengembalian)}</p>
                      </div>
                    </div>

                    {selectedItem.keterangan && (
                      <div className="info-item full-width">
                        <FaStickyNote className="info-icon" />
                        <div className="info-content">
                          <label>Keterangan</label>
                          <p className="keterangan">
                            {selectedItem.keterangan ||
                              selectedItem.notes ||
                              "-"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PeminjamanPengembalianAset;
