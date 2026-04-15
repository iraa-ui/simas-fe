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

  // --- STATE MANAGEMENT ---
  const [dataKendala, setDataKendala] = useState([]); // Data yang ditampilkan (setelah filter/search)
  const [allData, setAllData] = useState([]);         // Source of truth (seluruh data dari API)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- MODAL & UI STATE ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- FILTER STATE ---
  const [activeFilter, setActiveFilter] = useState("semua");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /**
   * Hook untuk inisialisasi data dan menangani alert sukses 
   * kiriman dari navigasi (Tambah/Edit)
   */
  useEffect(() => {
    fetchData();

    if (location.state?.showSuccessAlert) {
      Swal.fire({
        title: "Berhasil!",
        text: location.state.successMessage || "Data berhasil disimpan.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchData();
      // Bersihkan state navigasi agar alert tidak muncul berulang saat refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  /**
   * Mengambil data dari API dan melakukan pengurutan otomatis
   * berdasarkan waktu pembuatan terbaru (descending)
   */
  const fetchData = () => {
    setLoading(true);
    setError(false);

    mockApi
      .get(API_URL, { timeout: 5000 })
      .then((response) => {
        let hasil = response.data.data || [];

        if (Array.isArray(hasil) && hasil.length > 0) {
          // LOGIKA SORTING: Mengurutkan data berdasarkan created_at atau tanggal_kendala
          hasil = hasil.sort((a, b) => {
            const dateA = new Date(a.created_at || a.tanggal_kendala || 0);
            const dateB = new Date(b.created_at || b.tanggal_kendala || 0);
            return dateB - dateA; 
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
        setLoading(false);
      });
  };

  /**
   * Mengolah filter berdasarkan status (Open, In-Progress, Closed)
   */
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
        case "open": return status === "open";
        case "in-progress": return status === "in progress" || status === "in-progress";
        case "closed": return status === "closed";
        default: return true;
      }
    });

    setDataKendala(filteredData);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  /**
   * SEARCH LOGIC: Menjalankan pencarian otomatis setiap kali 
   * searchQuery atau activeFilter berubah
   */
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

    // Tetap sinkronkan hasil cari dengan filter status yang aktif
    if (activeFilter !== "semua") {
      hasil = hasil.filter((item) => {
        const status = item.status?.toLowerCase() || "";
        switch (activeFilter) {
          case "open": return status === "open";
          case "in-progress": return status === "in progress" || status === "in-progress";
          case "closed": return status === "closed";
          default: return true;
        }
      });
    }

    setDataKendala(hasil);
    setCurrentPage(1);
  }, [searchQuery, allData, activeFilter]);

  const handleResetSearch = () => {
    setSearchQuery("");
    applyFilter(activeFilter);
    setCurrentPage(1);
  };

  /**
   * Menghapus data dengan validasi status dari API
   */
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
        // Handling error spesifik (misal: status 403 jika data tidak boleh dihapus)
        let errorMessage = "Gagal menghapus data kendala barang.";
        if (error.response?.status === 403) {
          errorMessage = error.response.data.message || "Data dalam proses tidak dapat dihapus.";
        }
        Swal.fire({ title: "Gagal!", text: errorMessage, icon: "error" });
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // --- MODAL CONTROL ---
  const openDetailModal = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    document.body.style.overflow = "hidden"; // Mencegah scrolling background
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
    document.body.style.overflow = "auto";
  };

  // --- FORMATTERS ---
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  // --- NAVIGATION ---
  const handleTambahData = () => navigate("/app/kendala-barang/tambah");
  const handleEdit = (id) => navigate(`/app/kendala-barang/edit/${id}`);

  const getFilterDisplayText = () => {
    const map = { "semua": "Semua Status", "open": "Open", "in-progress": "In Progress", "closed": "Closed" };
    return map[activeFilter] || "Semua Status";
  };

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(dataKendala.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = dataKendala.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // --- DYNAMIC STYLING ---
  const getStatusBadge = (status) => `kendala-status-badge ${(status || "").toLowerCase().replace(" ", "-")}`;
  const getDetailStatusBadge = (status) => `detail-status-badge status-${(status || "").toLowerCase().replace(" ", "-")}`;

  const renderEmptyState = () => (
    <div className="empty-state">
      <img src={dataTidakDitemukan} alt="Data tidak ditemukan" className="empty-state-image" />
      <p className="empty-state-text">{searchQuery ? "Data tidak ditemukan" : "Tidak ada data kendala"}</p>
    </div>
  );

  return (
    <div className={`master-main-content-fixed ${showDetailModal ? "modal-open" : ""}`}>
      <div className="page-header">
        <h1>Kendala Barang</h1>
      </div>

      <section className="master-table-section-fixed">
        <div className="section-header">
          <div className="header-actions">
            {/* SEARCH INPUT */}
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
                  <button type="button" onClick={handleResetSearch} className="btn-reset-compact">✕</button>
                )}
              </div>
            </div>

            {/* FILTER DROPDOWN */}
            <div className="filter-dropdown-container">
              <div className="filter-dropdown">
                <button className="filter-dropdown-toggle" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                  <span>{getFilterDisplayText()}</span>
                  <FaChevronDown className={`dropdown-arrow ${showFilterDropdown ? "rotate" : ""}`} />
                </button>
                {showFilterDropdown && (
                  <div className="filter-dropdown-menu">
                    {["semua", "open", "in-progress", "closed"].map((f) => (
                      <button
                        key={f}
                        className={`filter-dropdown-item ${activeFilter === f ? "active" : ""}`}
                        onClick={() => applyFilter(f)}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className="btn-tambah" onClick={handleTambahData}>
              <FaPlus /> Tambah Data
            </button>
          </div>
        </div>

        <div className="table-container-fixed">
          {loading ? (
            <div className="loading-state"><p>Loading data...</p></div>
          ) : error ? (
            <div className="error-state">
                <img src={dataTidakDitemukan} alt="Error" className="empty-state-image" />
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
                      <span className={getStatusBadge(item.status)}>{item.status || "-"}</span>
                    </td>
                    <td>{item.deskripsi_kendala || "-"}</td>
                    <td>
                      <div className="aksi-cell">
                        <button onClick={() => openDetailModal(item)} className="aksi-btn view" title="Detail"><FaEye /></button>
                        <button onClick={() => handleEdit(item.id)} className="aksi-btn edit" title="Edit"><FaEdit /></button>
                        <button onClick={() => confirmDelete(item)} className="aksi-btn delete" disabled={deleteLoading} title="Hapus"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION INFO & CONTROLS */}
        {!loading && dataKendala.length > 0 && (
          <div className="pagination-container">
            <div className="row-page-selection">
              <span className="row-page-label">Rows per page:</span>
              <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(e.target.value)} className="row-page-select">
                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span className="row-page-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, dataKendala.length)} of {dataKendala.length} entries
              </span>
            </div>

            <div className="pagination-controls">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">&lt;</button>
              {pageNumbers.map((number) => (
                <button key={number} onClick={() => paginate(number)} className={`pagination-btn ${currentPage === number ? "active" : ""}`}>{number}</button>
              ))}
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn">&gt;</button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL DETAIL FULLSCREEN */}
      {showDetailModal && selectedItem && (
        <div className="detail-fullscreen-overlay" onClick={closeDetailModal}>
          <div className="detail-fullscreen" onClick={(e) => e.stopPropagation()}>
            <div className="detail-fullscreen-header">
              <h2><FaExclamationTriangle /> Detail Kendala Barang</h2>
              <button className="close-btn" onClick={closeDetailModal}><FaTimes /></button>
            </div>

            <div className="detail-fullscreen-content">
              <div className="detail-fullscreen-grid">
                <div className="detail-main-info">
                  <h3>Informasi Kendala</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <FaInfoCircle className="info-icon" />
                      <div className="info-content">
                        <label>Status</label>
                        <p><span className={getDetailStatusBadge(selectedItem.status)}>{selectedItem.status || "-"}</span></p>
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
                    {/* Footprint Timestamps */}
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
                    {/* Text Area Contents */}
                    <div className="info-item full-width">
                      <FaStickyNote className="info-icon" />
                      <div className="info-content">
                        <label>Deskripsi Kendala</label>
                        <p className="keterangan">{selectedItem.deskripsi_kendala || "-"}</p>
                      </div>
                    </div>
                    <div className="info-item full-width">
                      <FaInfoCircle className="info-icon" />
                      <div className="info-content">
                        <label>Keterangan Tambahan</label>
                        <p className="keterangan">{selectedItem.keterangan || "-"}</p>
                      </div>
                    </div>
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