import React, { useEffect, useState, useRef } from "react";
import mockApi from "../api/mockApi";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationTriangle,
  FaBox,
  FaDollarSign,
  FaCalendar,
  FaUser,
  FaStickyNote,
  FaHistory,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
  FaSearch,
  FaPlus,
  FaFilter,
  FaChevronDown,
} from "react-icons/fa";
import "../styles/StokBarang.css";
import dataTidakDitemukan from "../assets/data-tidak-ada.png";

function StokBarang() {
  // --- KONSTANTA & HOOKS ---
  const API_URL = "/stok_barang";
  const HISTORY_API_URL = "/histori-stok";
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE MANAGEMENT ---
  const [stocks, setStocks] = useState([]); // Data utama stok barang
  const [history, setHistory] = useState([]); // Data riwayat aktivitas umum
  const [loading, setLoading] = useState(true); // Loading state tabel utama
  const [historyLoading, setHistoryLoading] = useState(true); // Loading state tabel history
  const [error, setError] = useState(false); // State jika terjadi error fetch
  const [deleteItem, setDeleteItem] = useState(null); // Item yang akan dihapus
  const [deleteLoading, setDeleteLoading] = useState(false); // Loading saat proses delete
  const [showDetail, setShowDetail] = useState(false); // Toggle modal detail
  const [selectedItem, setSelectedItem] = useState(null); // Data item yang dipilih untuk detail
  const [historiBarang, setHistoriBarang] = useState([]); // Riwayat spesifik per barang
  const [loadingHistori, setLoadingHistori] = useState(false); // Loading riwayat spesifik
  const [searchQuery, setSearchQuery] = useState("");
  
  // State untuk filter kategori dan tipe
  const [tipeFilter, setTipeFilter] = useState("semua");
  const [searchStock, setSearchStock] = useState("");
  const [currentPageStock, setCurrentPageStock] = useState(1);
  const [itemsPerPageStock, setItemsPerPageStock] = useState(10);
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState("semua");

  // Tracking untuk item yang baru saja ditambahkan/diubah
  const [updatedItemId, setUpdatedItemId] = useState(null);

  // --- HELPER FUNCTIONS ---
  // Mendapatkan label teks untuk dropdown filter
  const getFilterDisplayText = () => {
    switch (activeFilter) {
      case "semua": return "Semua Kategori";
      case "ATK": return "ATK";
      case "Pantry": return "Pantry";
      case "Kebersihan": return "Kebersihan";
      case "Elektronik": return "Elektronik";
      case "Konsumable": return "Konsumable";
      case "Lainnya": return "Lainnya";
      default: return "Semua Kategori";
    }
  };

  // Menjalankan filter kategori
  const applyFilter = (filterValue) => {
    setActiveFilter(filterValue);
    setKategoriFilter(filterValue === "semua" ? "" : filterValue);
    setShowFilterDropdown(false);
    setCurrentPageStock(1); // Reset ke halaman 1
  };

  // --- EFFECTS ---
  // Menutup dropdown filter jika klik di luar elemen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".filter-dropdown-container")) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Membersihkan localStorage saat komponen pertama kali dibuka
  useEffect(() => {
    const cleanLocalStorage = () => {
      localStorage.removeItem("stokHistory");
      localStorage.removeItem("lastUpdatedItemId");
    };
    cleanLocalStorage();
  }, []);

  // Mengecek parameter URL untuk notifikasi sukses (setelah redirect dari tambah/edit)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get("action");
    const itemId = urlParams.get("itemId");

    if (action === "created" || action === "updated") {
      Swal.fire({
        title: "Berhasil!",
        text: action === "created" ? "Data barang berhasil disimpan." : "Data barang berhasil diperbarui.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      if (itemId) {
        setUpdatedItemId(itemId);
      }

      setTimeout(() => {
        fetchStocks();
        fetchHistory();
      }, 1000);

      navigate("/app/stokbarang", { replace: true });
    } else {
      fetchStocks();
      fetchHistory();
    }
  }, [location.search, navigate]);

  // --- API CALLS ---
  // Mengambil semua data stok barang
  const fetchStocks = () => {
    console.log("Fetching stocks...");
    setLoading(true);
    setError(false);
    mockApi
      .get(API_URL, { timeout: 5000 })
      .then((response) => {
        if (response.data.data && response.data.data.length > 0) {
          const sortedStocks = sortStocksByRecent(response.data.data);
          setStocks(sortedStocks);
        } else {
          setStocks([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(true);
        setStocks([]);
        setLoading(false);
      });
  };

  // Mengambil data history transaksi
  const fetchHistory = () => {
    console.log("Fetching history...");
    setHistoryLoading(true);
    mockApi
      .get(HISTORY_API_URL, { timeout: 5000 })
      .then((response) => {
        let historyData = [];
        if (response.data && Array.isArray(response.data.data)) {
          historyData = response.data.data;
        } else if (Array.isArray(response.data)) {
          historyData = response.data;
        }

        const sortedHistory = [...historyData].sort((a, b) => {
          const dateA = new Date(a.tanggal_kejadian || a.created_at || a.updated_at);
          const dateB = new Date(b.tanggal_kejadian || b.created_at || b.updated_at);
          return dateB - dateA;
        });

        setHistory(sortedHistory);
        setHistoryLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        setHistory([]);
        setHistoryLoading(false);
      });
  };

  // Mengurutkan stok agar yang baru diupdate muncul paling atas
  const sortStocksByRecent = (stocksArray) => {
    return [...stocksArray].sort((a, b) => {
      const itemIdA = a.id_barang || a.id;
      const itemIdB = b.id_barang || b.id;

      if (updatedItemId && itemIdA == updatedItemId) return -1;
      if (updatedItemId && itemIdB == updatedItemId) return 1;

      const dateA = new Date(a.tanggal_transaksi || a.created_at || a.updated_at);
      const dateB = new Date(b.tanggal_transaksi || b.created_at || b.updated_at);
      return dateB - dateA;
    });
  };

  // Mengambil riwayat spesifik untuk satu barang tertentu
  const fetchHistoriByBarang = async (idBarang) => {
    setLoadingHistori(true);
    try {
      let response;
      try {
        response = await mockApi.get(`${HISTORY_API_URL}/${idBarang}`);
      } catch (error1) {
        response = await mockApi.get(`${HISTORY_API_URL}?id_barang=${idBarang}`);
      }

      let historiData = [];
      if (response.data && Array.isArray(response.data.data)) {
        historiData = response.data.data;
      } else if (Array.isArray(response.data)) {
        historiData = response.data;
      } else {
        historiData = history.filter(
          (item) => item.id_barang == idBarang || item.barang_id == idBarang
        );
      }
      setHistoriBarang(historiData);
    } catch (error) {
      const filteredHistory = history.filter(
        (item) => item.id_barang == idBarang || item.barang_id == idBarang
      );
      setHistoriBarang(filteredHistory);
    } finally {
      setLoadingHistori(false);
    }
  };

  // --- EVENT HANDLERS ---
  // Menampilkan modal detail
  const handleViewDetail = async (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    document.body.style.overflow = "hidden";
    await fetchHistoriByBarang(item.id_barang || item.id);
  };

  // Menutup modal detail
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedItem(null);
    setHistoriBarang([]);
    document.body.style.overflow = "auto";
  };

  // Navigasi ke form tambah
  const handleTambah = () => {
    navigate("/app/stokbarang/tambah");
  };

  // Navigasi ke form edit
  const handleEdit = (id) => {
    navigate(`/app/stokbarang/edit/${id}`);
  };

  // Inisiasi proses hapus data
  const handleDeleteClick = (item) => {
    Swal.fire({
      title: "Apakah anda yakin?",
      html: `Data stok <strong>${item.nama_barang}</strong> akan dihapus secara permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteConfirm(item.id_barang || item.id, item.nama_barang);
      }
    });
  };

  // Eksekusi hapus data ke API
  const handleDeleteConfirm = async (id, namaBarang) => {
    setDeleteLoading(true);
    try {
      await mockApi.delete(`${API_URL}/${id}`);
      fetchStocks();
      fetchHistory();
      Swal.fire({
        title: "Berhasil!",
        text: "Data berhasil dihapus.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setDeleteItem(null);
    } catch (error) {
      Swal.fire({
        title: "Gagal!",
        text: "Gagal menghapus data: " + (error.response?.data?.message || "Network error"),
        icon: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- FORMATTERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatHistoryDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).replace(",", "").replace(/\./g, ":");
    } catch (error) {
      return "-";
    }
  };

  const formatCurrencyDisplay = (amount) => {
    if (!amount) return "0.00";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTipe = (tipe) => {
    if (!tipe) return "Tidak Diketahui";
    if (tipe === "masuk") return "Barang Masuk";
    if (tipe === "keluar") return "Barang Keluar";
    return tipe;
  };

  // Mendapatkan badge CSS berdasarkan tipe transaksi
  const getTipeBadge = (tipe) => {
    if (!tipe) return "badge badge-secondary";
    if (tipe === "Barang Masuk" || tipe === "masuk") return "badge badge-success";
    if (tipe === "Barang Keluar" || tipe === "keluar") return "badge badge-danger";
    if (tipe === "Barang Dihapus") return "badge badge-deleted";
    return "badge badge-secondary";
  };

  const getTipeIcon = (tipe) => {
    if (tipe === "Barang Masuk" || tipe === "masuk") return <FaArrowUp style={{ color: "#27ae60", marginRight: "5px" }} />;
    if (tipe === "Barang Keluar" || tipe === "keluar") return <FaArrowDown style={{ color: "#e74c3c", marginRight: "5px" }} />;
    return null;
  };

  const getNamaBarang = (idBarang) => {
    if (!idBarang) return "Barang Tidak Diketahui";
    const barang = stocks.find((item) => item.id_barang == idBarang);
    return barang ? barang.nama_barang : `Barang #${idBarang}`;
  };

  const getLatestHistory = () => {
    return history.slice(0, 5);
  };

  // --- LOGIC SEARCH & PAGINATION ---
  const filteredStocks = stocks.filter((item) => {
    if (!searchStock.trim() && !kategoriFilter) return true;
    const searchLower = searchStock.toLowerCase();
    const matchSearch = searchStock.trim() ? item.nama_barang?.toLowerCase().includes(searchLower) || item.harga?.toString().includes(searchStock) : true;
    const matchKategori = kategoriFilter ? item.kategori === kategoriFilter : true;
    return matchSearch && matchKategori;
  });

  const paginateStock = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPagesStock) return;
    setCurrentPageStock(pageNumber);
  };

  const handleItemsPerPageChangeStock = (value) => {
    setItemsPerPageStock(parseInt(value));
    setCurrentPageStock(1);
  };

  const totalPagesStock = Math.ceil(filteredStocks.length / itemsPerPageStock);
  const indexOfLastItemStock = currentPageStock * itemsPerPageStock;
  const indexOfFirstItemStock = indexOfLastItemStock - itemsPerPageStock;
  const currentStocks = filteredStocks.slice(indexOfFirstItemStock, indexOfLastItemStock);

  const pageNumbersStock = [];
  for (let i = 1; i <= totalPagesStock; i++) {
    pageNumbersStock.push(i);
  }

  // --- RENDER HELPERS (EMPTY STATES) ---
  const renderEmptyStateStok = () => (
    <div className="empty-state">
      <img src={dataTidakDitemukan} alt="Data tidak ditemukan" className="empty-state-image" />
      <p className="empty-state-text">{(searchStock || kategoriFilter) ? "Data tidak ditemukan" : "Tidak ada data stok barang"}</p>
    </div>
  );

  const renderEmptyStateHistory = () => (
    <div className="empty-state">
      <img src={dataTidakDitemukan} alt="Belum ada data history" className="empty-state-image" />
      <h4 className="empty-state-title">Belum Ada Data History</h4>
      <p className="empty-state-subtitle">Data history akan muncul setelah ada perubahan stok</p>
    </div>
  );

  const displayedHistory = getLatestHistory();

  // --- JSX RENDER ---
  return (
    <div className={`master-main-content-fixed ${showDetail || deleteItem ? "modal-open" : ""}`}>
      {/* HEADER HALAMAN */}
      <div className="page-header">
        <h1>Stok Barang</h1>
      </div>

      {/* TABEL UTAMA STOK BARANG */}
      <section className="master-table-section-fixed">
        <div className="section-header">
          <div className="header-actions">
            <div className="filter-controls">
              {/* Search Input */}
              <div className="search-form-compact">
                <div className="search-input-group-compact">
                  <FaSearch className="search-icon-compact" />
                  <input
                    type="text"
                    placeholder="Cari nama barang atau harga..."
                    value={searchStock}
                    onChange={(e) => setSearchStock(e.target.value)}
                    className="search-input-compact"
                  />
                  {searchStock && <button onClick={() => setSearchStock("")} className="btn-reset-compact">✕</button>}
                </div>
              </div>

              {/* Custom Kategori Dropdown */}
              <div className="filter-dropdown-container">
                <div className="filter-dropdown">
                  <button className="filter-dropdown-toggle" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                    <span>{getFilterDisplayText()}</span>
                    <FaChevronDown className={`dropdown-arrow ${showFilterDropdown ? "rotate" : ""}`} />
                  </button>
                  {showFilterDropdown && (
                    <div className="filter-dropdown-menu">
                      {["semua", "ATK", "Pantry", "Kebersihan", "Elektronik", "Konsumable", "Lainnya"].map(cat => (
                        <button key={cat} className={`filter-dropdown-item ${activeFilter === cat ? "active" : ""}`} onClick={() => applyFilter(cat)}>
                          {cat === "semua" ? "Semua Kategori" : cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button className="btn-tambah" onClick={handleTambah}><FaPlus /> Tambah Data</button>
          </div>
        </div>

        <div className="table-container-fixed">
          {loading ? (
            <div className="loading-state"><p>Loading data...</p></div>
          ) : error ? (
            <div className="error-state">
              <img src={dataTidakDitemukan} className="empty-state-image" alt="error" />
              <p className="empty-state-text">Data tidak ditemukan</p>
            </div>
          ) : currentStocks.length === 0 ? renderEmptyStateStok() : (
            <table className="table-fixed">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>Kuantitas</th>
                  <th>Harga</th>
                  <th>Tanggal Transaksi</th>
                  <th>Dibayar Oleh</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentStocks.map((item, index) => (
                  <tr key={item.id_barang || item.id} className={updatedItemId && (item.id_barang == updatedItemId || item.id == updatedItemId) ? "recently-updated" : ""}>
                    <td>{indexOfFirstItemStock + index + 1}</td>
                    <td>{item.nama_barang}</td>
                    <td>{item.kategori}</td>
                    <td>{item.kuantitas}</td>
                    <td>Rp {formatCurrencyDisplay(item.total_harga)}</td>
                    <td>{new Date(item.tanggal_transaksi).toLocaleDateString("id-ID")}</td>
                    <td>{item.dibayar_oleh}</td>
                    <td>{item.notes || "-"}</td>
                    <td>
                      <div className="aksi-cell">
                        <button className="aksi-btn view" onClick={() => handleViewDetail(item)}><FaEye /></button>
                        <button className="aksi-btn edit" onClick={() => handleEdit(item.id_barang || item.id)}><FaEdit /></button>
                        <button className="aksi-btn delete" onClick={() => handleDeleteClick(item)}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredStocks.length > 0 && (
          <div className="pagination-container">
            <div className="row-page-selection">
              <span className="row-page-label">Rows per page:</span>
              <select value={itemsPerPageStock} onChange={(e) => handleItemsPerPageChangeStock(e.target.value)} className="row-page-select">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="row-page-info">Showing {indexOfFirstItemStock + 1} to {Math.min(indexOfLastItemStock, filteredStocks.length)} of {filteredStocks.length} entries</span>
            </div>
            <div className="pagination-controls">
              <button onClick={() => paginateStock(currentPageStock - 1)} disabled={currentPageStock === 1} className="pagination-btn">&lt;</button>
              {pageNumbersStock.map(number => (
                <button key={number} onClick={() => paginateStock(number)} className={`pagination-btn ${currentPageStock === number ? "active" : ""}`}>{number}</button>
              ))}
              <button onClick={() => paginateStock(currentPageStock + 1)} disabled={currentPageStock === totalPagesStock} className="pagination-btn">&gt;</button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION HISTORY TERBARU */}
      <section className="master-table-section-fixed history-section-with-bg">
        <div className="section-header">
          <h2><FaHistory style={{ marginRight: "10px" }} /> History Stok Barang (5 Aktivitas Terbaru)</h2>
          <div className="header-actions">
            <button className="btn-refresh" onClick={fetchHistory} disabled={historyLoading}>{historyLoading ? "Refreshing..." : "Refresh"}</button>
          </div>
        </div>
        <div className="table-container-fixed with-bg">
          {historyLoading ? (
            <div className="loading-state"><p>Loading history...</p></div>
          ) : displayedHistory.length === 0 ? renderEmptyStateHistory() : (
            <table className="table-fixed">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal & Waktu</th>
                  <th>Nama Barang</th>
                  <th>Tipe</th>
                  <th>Jumlah</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{index + 1}</td>
                    <td>{formatHistoryDate(item.tanggal_kejadian)}</td>
                    <td>{getNamaBarang(item.id_barang)}</td>
                    <td><span className={getTipeBadge(item.tipe)}>{getTipeIcon(item.tipe)}{formatTipe(item.tipe)}</span></td>
                    <td>{item.jumlah || 0}</td>
                    <td>{item.keterangan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* MODAL DETAIL BARANG & RIWAYAT PERUBAHAN */}
      {showDetail && selectedItem && (
        <>
          <div className="blur-overlay"></div>
          <div className="detail-modal-fullscreen">
            <div className="detail-modal-header">
              <h2>Detail Stok Barang - {selectedItem?.nama_barang || "Barang"}</h2>
              <button className="close-btn" onClick={handleCloseDetail}>✖</button>
            </div>
            <div className="detail-modal-content-improved">
              {/* Info Barang Panel */}
              <div className="detail-info-side">
                <div className="detail-info-card">
                  <h3>📋 Informasi Barang</h3>
                  <div className="detail-basic-info">
                    <div className="detail-name-section">
                      <h4 className="detail-name-improved">{selectedItem?.nama_barang || "-"}</h4>
                      <div className="detail-no-inventaris-improved">
                        <span className="no-inventaris-badge">🏷️ Stok #{selectedItem?.id_barang || selectedItem?.id || "-"}</span>
                      </div>
                    </div>
                    <div className="status-kondisi-container">
                      <div className="kondisi-section"><label>Kategori:</label><span className="kategori-badge">{selectedItem?.kategori || "-"}</span></div>
                      <div className="kondisi-section"><label>Tanggal:</label><span className="info-value">{formatDate(selectedItem?.tanggal_transaksi)}</span></div>
                    </div>
                  </div>
                  <div className="detail-info-grid">
                    <div className="info-item"><span className="info-label">Nama Barang:</span><span className="info-value">{selectedItem?.nama_barang || "-"}</span></div>
                    <div className="info-item"><span className="info-label">Kuantitas:</span><span className="info-value">{selectedItem?.kuantitas || 0}</span></div>
                    <div className="info-item"><span className="info-label">Kategori:</span><span className="info-value">{selectedItem?.kategori || "-"}</span></div>
                    <div className="info-item"><span className="info-label">Harga:</span><span className="info-value price">{formatCurrency(selectedItem?.harga || 0)}</span></div>
                    <div className="info-item"><span className="info-label">Total Harga:</span><span className="info-value price">Rp {formatCurrencyDisplay(selectedItem?.total_harga || 0)}</span></div>
                    <div className="info-item"><span className="info-label">Tipe Transaksi:</span><span className="info-value"><span className={getTipeBadge(selectedItem?.tipe)}>{getTipeIcon(selectedItem?.tipe)}{formatTipe(selectedItem?.tipe)}</span></span></div>
                    <div className="info-item"><span className="info-label">Tanggal Transaksi:</span><span className="info-value">{formatDate(selectedItem?.tanggal_transaksi)}</span></div>
                    <div className="info-item"><span className="info-label">Dibayar Oleh:</span><span className="info-value">{selectedItem?.dibayar_oleh || "-"}</span></div>
                    <div className="info-item full-width"><span className="info-label">Keterangan:</span><span className="info-value">{selectedItem?.notes || "-"}</span></div>
                  </div>
                </div>
              </div>

              {/* Riwayat Perubahan Panel */}
              <div className="histori-side">
                <div className="histori-card">
                  <h3>📊 Histori Perubahan Stok</h3>
                  {loadingHistori ? (
                    <div className="loading-histori"><p>Memuat data histori...</p></div>
                  ) : historiBarang && historiBarang.length > 0 ? (
                    <>
                      <div className="histori-table-container-fixed">
                        <table className="histori-table-improved">
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>Tanggal</th>
                              <th>Tipe</th>
                              <th>Jumlah</th>
                              <th>Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historiBarang.map((histori, index) => (
                              <tr key={histori.id || index}>
                                <td className="text-center">{index + 1}</td>
                                <td>{formatHistoryDate(histori.tanggal_kejadian)}</td>
                                <td><span className={getTipeBadge(histori.tipe)}>{getTipeIcon(histori.tipe)}{formatTipe(histori.tipe)}</span></td>
                                <td><strong>{histori.jumlah || 0}</strong></td>
                                <td className="keterangan-cell">{histori.keterangan || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="pagination-histori-info" style={{ textAlign: "center", padding: "15px 0", borderTop: "1px solid #e9ecef", marginTop: "auto", fontWeight: "500", color: "#666" }}>
                        <span>Total {historiBarang.length} data histori perubahan</span>
                      </div>
                    </>
                  ) : (
                    <div className="empty-histori"><p>📝 Tidak ada histori perubahan untuk barang ini.</p></div>
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

export default StokBarang;