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
  FaBox,
  FaCalendarAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaStickyNote,
} from "react-icons/fa";
import "../styles/KendalaBarang.css";
import dataTidakDitemukan from "../assets/data-tidak-ada.png";

function KendalaBarang() {
  const API_URL = "/kendala-barang";
  const navigate = useNavigate();
  const location = useLocation();

  const [dataKendala, setDataKendala] = useState([]);
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
        timer: 2000,
        showConfirmButton: false,
      });

      // 🔹 REFRESH DATA SETELAH TAMBAH/EDIT
      fetchData();

      // 🔹 HAPUS STATE AGAR TIDAK MUNCUL LAGI SAAT REFRESH
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  // 🔹 Fungsi untuk mengambil data kendala - DITAMBAH: SORT BY CREATED_AT
  const fetchData = () => {
    setLoading(true);
    setError(false);

    mockApi
      .get(API_URL, { timeout: 5000 })
      .then((response) => {
        let hasil = response.data.data || [];

        if (Array.isArray(hasil) && hasil.length > 0) {
          // 🔹 URUTKAN DATA BERDASARKAN CREATED_AT DESCENDING (DATA BARU DIATAS)
          hasil = hasil.sort((a, b) => {
            const dateA = new Date(a.created_at || a.tanggal_kendala || 0);
            const dateB = new Date(b.created_at || b.tanggal_kendala || 0);
            return dateB - dateA; // Descending: data baru di atas
          });

          setDataKendala(hasil);
          setAllData(hasil);
        } else {
          setDataKendala([]);
          setAllData([]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data kendala:", err);
        setError(true);
        setDataKendala([]);
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
      setDataKendala(allData);
      return;
    }

    const filteredData = allData.filter((item) => {
      const status = item.status?.toLowerCase() || "";

      switch (filterType) {
        case "open":
          return status === "open";
        case "in-progress":
          return status === "in progress" || status === "in-progress";
        case "closed":
          return status === "closed";
        default:
          return true;
      }
    });

    setDataKendala(filteredData);
  };

  // 🔹 Fungsi untuk mengubah jumlah item per halaman
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // 🔹 Fungsi untuk pencarian data kendala OTOMATIS
  useEffect(() => {
    if (!searchQuery.trim()) {
      applyFilter(activeFilter);
      setCurrentPage(1);
      return;
    }

    const searchLower = searchQuery.toLowerCase();
    let hasil = allData.filter((item) => {
      const namaKaryawan = (item.nama_karyawan || "").toLowerCase();
      const namaBarang = (item.nama_barang || "").toLowerCase();
      const deskripsiKendala = (item.deskripsi_kendala || "").toLowerCase();
      const status = (item.status || "").toLowerCase();

      return (
        namaKaryawan.includes(searchLower) ||
        namaBarang.includes(searchLower) ||
        deskripsiKendala.includes(searchLower) ||
        status.includes(searchLower)
      );
    });

    // Apply filter tambahan pada hasil search
    if (activeFilter !== "semua") {
      hasil = hasil.filter((item) => {
        const status = item.status?.toLowerCase() || "";

        switch (activeFilter) {
          case "open":
            return status === "open";
          case "in-progress":
            return status === "in progress" || status === "in-progress";
          case "closed":
            return status === "closed";
          default:
            return true;
        }
      });
    }

    setDataKendala(hasil);
    setCurrentPage(1);
  }, [searchQuery, allData, activeFilter]);

  // 🔹 Fungsi untuk reset pencarian
  const handleResetSearch = () => {
    setSearchQuery("");
    applyFilter(activeFilter);
    setCurrentPage(1);
  };

  // 🔹 FUNGSI KONFIRMASI HAPUS DENGAN SWEETALERT
  const confirmDelete = async (item) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Data kendala ${item.nama_barang} akan dihapus secara permanen!`,
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
        await mockApi.delete(`${API_URL}/${item.id}`);

        Swal.fire({
          title: "Berhasil!",
          text: "Data berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchData();
      } catch (error) {
        console.error("Gagal menghapus data kendala:", error);

        let errorMessage = "Gagal menghapus data kendala barang.";

        if (error.response?.status === 403) {
          errorMessage =
            error.response.data.message ||
            "Kendala barang dengan status Open atau In Progress tidak dapat dihapus karena masih dalam proses perbaikan.";
        } else if (error.response?.status === 404) {
          errorMessage = "Data kendala barang tidak ditemukan.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        Swal.fire({
          title: "Gagal!",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
        });
      } finally {
        setDeleteLoading(false);
      }
    }
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

  // 🔹 Format tanggal lengkap dengan waktu
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

  // 🔹 Navigasi ke halaman tambah
  const handleTambahData = () => {
    navigate("/app/kendala-barang/tambah");
  };

  // 🔹 Navigasi ke halaman edit
  const handleEdit = (id) => {
    navigate(`/app/kendala-barang/edit/${id}`);
  };

  // 🔹 Get display text untuk filter dropdown
  const getFilterDisplayText = () => {
    switch (activeFilter) {
      case "semua":
        return "Semua Status";
      case "open":
        return "Open";
      case "in-progress":
        return "In Progress";
      case "closed":
        return "Closed";
      default:
        return "Semua Status";
    }
  };

  // 🔹 Pagination Calculations
  const totalPages = Math.ceil(dataKendala.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = dataKendala.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Buat array angka halaman [1, 2, 3, ...]
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Function untuk mendapatkan class status badge khusus kendala
  const getStatusBadge = (status) => {
    if (!status) return "kendala-status-badge";

    const statusLower = status.toLowerCase();
    if (statusLower === "open") return "kendala-status-badge open";
    if (statusLower === "in progress" || statusLower === "in-progress")
      return "kendala-status-badge in-progress";
    if (statusLower === "closed") return "kendala-status-badge closed";

    return "kendala-status-badge";
  };

  // Function untuk mendapatkan class status badge di modal detail
  const getDetailStatusBadge = (status) => {
    if (!status) return "detail-status-badge";

    const statusLower = status.toLowerCase();
    if (statusLower === "open") return "detail-status-badge status-open";
    if (statusLower === "in progress" || statusLower === "in-progress")
      return "detail-status-badge status-in-progress";
    if (statusLower === "closed") return "detail-status-badge status-closed";

    return "detail-status-badge";
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
          {searchQuery ? "Data tidak ditemukan" : "Tidak ada data kendala"}
        </p>
      </div>
    );
  };

  return (
    <div className={`master-main-content-fixed ${showDetailModal ? "modal-open" : ""}`}>
      {/* Judul Halaman */}
      <div className="page-header">
        <h1>Kendala Barang</h1>
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
                  placeholder="Cari berdasarkan nama karyawan atau nama barang"
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
                        activeFilter === "open" ? "active" : ""
                      }`}
                      onClick={() => applyFilter("open")}
                    >
                      Open
                    </button>
                    <button
                      className={`filter-dropdown-item ${
                        activeFilter === "in-progress" ? "active" : ""
                      }`}
                      onClick={() => applyFilter("in-progress")}
                    >
                      In Progress
                    </button>
                    <button
                      className={`filter-dropdown-item ${
                        activeFilter === "closed" ? "active" : ""
                      }`}
                      onClick={() => applyFilter("closed")}
                    >
                      Closed
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Tambah Data */}
            <button className="btn-tambah" onClick={handleTambahData}>
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
                  <th>Tanggal Kendala</th>
                  <th>Status</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{item.nama_karyawan || "-"}</td>
                    <td>{item.nama_barang || "-"}</td>
                    <td>{formatDate(item.tanggal_kendala)}</td>
                    <td>
                      <span className={getStatusBadge(item.status)}>
                        {item.status || "-"}
                      </span>
                    </td>
                    <td>{item.deskripsi_kendala || "-"}</td>
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
        {!loading && dataKendala.length > 0 && (
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
                {Math.min(indexOfLastItem, dataKendala.length)} of{" "}
                {dataKendala.length} entries
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

      {/* 🔹 Detail Modal Fullscreen - Sama seperti komponen lain */}
      {showDetailModal && selectedItem && (
        <div className="detail-fullscreen-overlay" onClick={closeDetailModal}>
          <div
            className="detail-fullscreen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-fullscreen-header">
              <h2>
                <FaExclamationTriangle /> Detail Kendala Barang
              </h2>
              <button className="close-btn" onClick={closeDetailModal}>
                <FaTimes />
              </button>
            </div>

            <div className="detail-fullscreen-content">
              <div className="detail-fullscreen-grid">
                {/* Informasi Utama Kendala */}
                <div className="detail-main-info">
                  <h3>Informasi Kendala</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <FaInfoCircle className="info-icon" />
                      <div className="info-content">
                        <label>Status</label>
                        <p>
                          <span className={getDetailStatusBadge(selectedItem.status)}>
                            {selectedItem.status || "-"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaUser className="info-icon" />
                      <div className="info-content">
                        <label>Nama Karyawan</label>
                        <p>{selectedItem.nama_karyawan || "-"}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaBox className="info-icon" />
                      <div className="info-content">
                        <label>Nama Barang</label>
                        <p>{selectedItem.nama_barang || "-"}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaCalendarAlt className="info-icon" />
                      <div className="info-content">
                        <label>Tanggal Kendala</label>
                        <p>{formatDate(selectedItem.tanggal_kendala)}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaCalendarAlt className="info-icon" />
                      <div className="info-content">
                        <label>Tanggal Dibuat</label>
                        <p>{formatDateTime(selectedItem.created_at)}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaCalendarAlt className="info-icon" />
                      <div className="info-content">
                        <label>Tanggal Diupdate</label>
                        <p>{formatDateTime(selectedItem.updated_at)}</p>
                      </div>
                    </div>

                    {selectedItem.deskripsi_kendala && (
                      <div className="info-item full-width">
                        <FaStickyNote className="info-icon" />
                        <div className="info-content">
                          <label>Deskripsi Kendala</label>
                          <p className="keterangan">{selectedItem.deskripsi_kendala}</p>
                        </div>
                      </div>
                    )}

                    {selectedItem.keterangan && (
                      <div className="info-item full-width">
                        <FaInfoCircle className="info-icon" />
                        <div className="info-content">
                          <label>Keterangan Tambahan</label>
                          <p className="keterangan">{selectedItem.keterangan}</p>
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

export default KendalaBarang;