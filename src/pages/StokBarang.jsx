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
  const API_URL = "/stok_barang";
  const HISTORY_API_URL =
    "/histori-stok";
  const navigate = useNavigate();
  const location = useLocation();

  const [stocks, setStocks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historiBarang, setHistoriBarang] = useState([]);
  const [loadingHistori, setLoadingHistori] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // STATE BARU: Filter berdasarkan tipe
  const [tipeFilter, setTipeFilter] = useState("semua");

  // State untuk fitur pencarian dan pagination STOK BARANG
  const [searchStock, setSearchStock] = useState("");
  const [currentPageStock, setCurrentPageStock] = useState(1);
  const [itemsPerPageStock, setItemsPerPageStock] = useState(10);

  // STATE BARU: Filter berdasarkan kategori dengan dropdown custom
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState("semua");

  // 🔥 STATE BARU: Untuk track item yang baru diupdate
  const [updatedItemId, setUpdatedItemId] = useState(null);

  // Fungsi untuk mendapatkan teks display filter
  const getFilterDisplayText = () => {
    switch (activeFilter) {
      case "semua":
        return "Semua Kategori";
      case "ATK":
        return "ATK";
      case "Pantry":
        return "Pantry";
      case "Kebersihan":
        return "Kebersihan";
      case "Elektronik":
        return "Elektronik";
      case "Konsumable":
        return "Konsumable";
      case "Lainnya":
        return "Lainnya";
      default:
        return "Semua Kategori";
    }
  };

  // Fungsi untuk apply filter
  const applyFilter = (filterValue) => {
    setActiveFilter(filterValue);
    setKategoriFilter(filterValue === "semua" ? "" : filterValue);
    setShowFilterDropdown(false);
    setCurrentPageStock(1); // Reset ke halaman pertama saat filter berubah
  };

  // Handle click outside untuk menutup dropdown
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

  useEffect(() => {
    // 🔥 BERSIHKAN localStorage saat component mount
    const cleanLocalStorage = () => {
      localStorage.removeItem("stokHistory");
      localStorage.removeItem("lastUpdatedItemId");
    };

    cleanLocalStorage();
  }, []);

  // EFFECT: Cek jika ada action success dari halaman tambah/edit
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get("action");
    const itemId = urlParams.get("itemId");

    if (action === "created" || action === "updated") {
      // TAMPILKAN ALERT
      Swal.fire({
        title: "Berhasil!",
        text:
          action === "created"
            ? "Data barang berhasil disimpan."
            : "Data barang berhasil diperbarui.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      if (itemId) {
        setUpdatedItemId(itemId); // 🔥 SET STATE SAJA
      }

      // Refresh data dengan delay untuk pastikan API sudah update
      setTimeout(() => {
        fetchStocks();
        fetchHistory(); // 🔥 PASTIKAN HISTORY DI-REFRESH
      }, 1000);

      // Hapus parameter dari URL
      navigate("/app/stokbarang", { replace: true });
    } else {
      // Normal load data
      fetchStocks();
      fetchHistory();
    }
  }, [location.search, navigate]);

  const fetchStocks = () => {
    console.log("Fetching stocks...");
    setLoading(true);
    setError(false);
    mockApi
      .get(API_URL, { timeout: 5000 })
      .then((response) => {
        console.log("Stocks fetched:", response.data.data?.length);
        if (response.data.data && response.data.data.length > 0) {
          // 🔥 SORT: Barang terbaru/terupdate di atas
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

  const fetchHistory = () => {
    console.log("Fetching history...");
    setHistoryLoading(true);
    mockApi
      .get(HISTORY_API_URL, { timeout: 5000 })
      .then((response) => {
        console.log("History data received:", response.data);

        let historyData = [];
        if (response.data && Array.isArray(response.data.data)) {
          historyData = response.data.data;
        } else if (Array.isArray(response.data)) {
          historyData = response.data;
        } else {
          console.warn("Unexpected history response structure:", response.data);
          historyData = [];
        }

        const sortedHistory = [...historyData].sort((a, b) => {
          const dateA = new Date(
            a.tanggal_kejadian || a.created_at || a.updated_at
          );
          const dateB = new Date(
            b.tanggal_kejadian || b.created_at || b.updated_at
          );
          return dateB - dateA;
        });

        console.log("Sorted history (first 3):", sortedHistory.slice(0, 3));

        setHistory(sortedHistory);
        setHistoryLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching history:", err);

        setHistory([]); // 🔥 SET LANGSUNG KOSONG
        setHistoryLoading(false);
      });
  };

  // 🔥 PERBAIKAN: Ganti 'lastUpdatedId' dengan 'updatedItemId'
  const sortStocksByRecent = (stocksArray) => {
    return [...stocksArray].sort((a, b) => {
      const itemIdA = a.id_barang || a.id;
      const itemIdB = b.id_barang || b.id;

      // 🔥 PERBAIKAN: Gunakan 'updatedItemId' yang sudah didefinisikan di state
      if (updatedItemId && itemIdA == updatedItemId) return -1;
      if (updatedItemId && itemIdB == updatedItemId) return 1;

      // Default: sort by tanggal transaksi terbaru atau created_at
      const dateA = new Date(
        a.tanggal_transaksi || a.created_at || a.updated_at
      );
      const dateB = new Date(
        b.tanggal_transaksi || b.created_at || b.updated_at
      );
      return dateB - dateA;
    });
  };

  // FUNGSI BARU: Ambil histori berdasarkan ID barang - DIPERBAIKI
  const fetchHistoriByBarang = async (idBarang) => {
    setLoadingHistori(true);
    try {
      console.log(`Fetching history for barang ID: ${idBarang}`);

      // Coba beberapa endpoint yang mungkin
      let response;
      try {
        // Endpoint 1: Mungkin menggunakan format yang berbeda
        response = await mockApi.get(`${HISTORY_API_URL}/${idBarang}`);
        console.log("History API Response (endpoint 1):", response.data);
      } catch (error1) {
        console.log("Endpoint 1 failed, trying endpoint 2...");
        // Endpoint 2: Format lain
        response = await mockApi.get(`${HISTORY_API_URL}?id_barang=${idBarang}`);
        console.log("History API Response (endpoint 2):", response.data);
      }

      let historiData = [];

      // Cek berbagai kemungkinan struktur response
      if (response.data && Array.isArray(response.data.data)) {
        historiData = response.data.data;
      } else if (Array.isArray(response.data)) {
        historiData = response.data;
      } else if (response.data && response.data.histori) {
        historiData = response.data.histori;
      } else {
        console.warn("Unexpected history structure:", response.data);
        // Fallback: filter dari history yang sudah ada
        historiData = history.filter(
          (item) => item.id_barang == idBarang || item.barang_id == idBarang
        );
      }

      console.log(
        `Found ${historiData.length} history records for barang ${idBarang}`
      );
      setHistoriBarang(historiData);
    } catch (error) {
      console.error("Gagal mengambil histori barang:", error);
      console.error("Error details:", error.response?.data || error.message);

      // Fallback: filter dari history yang sudah di-load
      const filteredHistory = history.filter(
        (item) => item.id_barang == idBarang || item.barang_id == idBarang
      );
      console.log(
        `Using fallback: ${filteredHistory.length} records from cached history`
      );
      setHistoriBarang(filteredHistory);
    } finally {
      setLoadingHistori(false);
    }
  };

  // PERBAIKAN: Fungsi buka detail dengan histori
  const handleViewDetail = async (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    document.body.style.overflow = "hidden";

    // Ambil histori khusus untuk barang ini
    await fetchHistoriByBarang(item.id_barang || item.id);
  };

  const handleCloseDetail = () => {
    console.log("Close detail");
    setShowDetail(false);
    setSelectedItem(null);
    setHistoriBarang([]);
    document.body.style.overflow = "auto";
  };

  const getNamaBarang = (idBarang) => {
    if (!idBarang) return "Barang Tidak Diketahui";

    const barang = stocks.find((item) => item.id_barang == idBarang);

    if (!barang) {
      return `Barang #${idBarang}`;
    }

    return barang.nama_barang;
  };

  const getTipeBadge = (tipe) => {
    if (!tipe) return "badge badge-secondary";

    if (tipe === "Barang Masuk" || tipe === "masuk") {
      return "badge badge-success";
    } else if (tipe === "Barang Keluar" || tipe === "keluar") {
      return "badge badge-danger";
    } else if (tipe === "Barang Dihapus") {
      return "badge badge-deleted";
    }
    return "badge badge-secondary";
  };

  const getTipeIcon = (tipe) => {
    if (!tipe) return null;
    if (tipe === "Barang Masuk" || tipe === "masuk") {
      return <FaArrowUp style={{ color: "#27ae60", marginRight: "5px" }} />;
    } else if (tipe === "Barang Keluar" || tipe === "keluar") {
      return <FaArrowDown style={{ color: "#e74c3c", marginRight: "5px" }} />;
    }
    return null;
  };

  const formatTipe = (tipe) => {
    if (!tipe) return "Tidak Diketahui";
    if (tipe === "masuk") return "Barang Masuk";
    if (tipe === "keluar") return "Barang Keluar";
    return tipe;
  };

  const formatHistoryDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString)
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(",", "")
        .replace(/\./g, ":"); // Format: 28/11/2025 21:33
    } catch (error) {
      return "-";
    }
  };

  const getLatestHistory = () => {
    const historyData = history;

    if (historyData.length === 0) return [];

    console.log("Displaying latest 5 history:", historyData.slice(0, 5));

    return historyData.slice(0, 5);
  };

  const handleTambah = () => {
    navigate("/app/stokbarang/tambah");
  };

  const handleEdit = (id) => {
    console.log("Edit clicked for ID:", id);
    navigate(`/app/stokbarang/edit/${id}`);
  };

  const handleDeleteClick = (item) => {
    console.log("Delete clicked for:", item);

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

  const handleDeleteConfirm = async (id, namaBarang) => {
    console.log("Starting delete confirmation for ID:", id);
    setDeleteLoading(true);
    try {
      const response = await mockApi.delete(`${API_URL}/${id}`);
      console.log("Delete successful:", response.data);

      // Refresh stocks
      fetchStocks();
      fetchHistory();

      // ALERT DELETE
      Swal.fire({
        title: "Berhasil!",
        text: "Data berhasil dihapus.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setDeleteItem(null);
    } catch (error) {
      console.error("Delete failed:", error);
      console.error("Error response:", error.response);

      Swal.fire({
        title: "Gagal!",
        text:
          "Gagal menghapus data: " +
          (error.response?.data?.message || "Network error"),
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // UPDATE: Filter untuk stok barang dengan pencarian dan kategori
  const filteredStocks = stocks.filter((item) => {
    if (!searchStock.trim() && !kategoriFilter) return true;

    const searchLower = searchStock.toLowerCase();
    const matchSearch = searchStock.trim()
      ? item.nama_barang?.toLowerCase().includes(searchLower) ||
        item.harga?.toString().includes(searchStock)
      : true;

    const matchKategori = kategoriFilter
      ? item.kategori === kategoriFilter
      : true;

    return matchSearch && matchKategori;
  });

  // UPDATE: Data history yang ditampilkan (hanya 5 terbaru, tanpa pagination)
  const displayedHistory = getLatestHistory();

  // FUNGSI PAGINATION UNTUK STOK BARANG
  const paginateStock = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPagesStock) return;
    setCurrentPageStock(pageNumber);
  };

  const handleItemsPerPageChangeStock = (value) => {
    setItemsPerPageStock(parseInt(value));
    setCurrentPageStock(1);
  };

  // PAGINATION CALCULATIONS UNTUK STOK BARANG
  const totalPagesStock = Math.ceil(filteredStocks.length / itemsPerPageStock);
  const indexOfLastItemStock = currentPageStock * itemsPerPageStock;
  const indexOfFirstItemStock = indexOfLastItemStock - itemsPerPageStock;
  const currentStocks = filteredStocks.slice(
    indexOfFirstItemStock,
    indexOfLastItemStock
  );

  // Buat array angka halaman untuk stok barang
  const pageNumbersStock = [];
  for (let i = 1; i <= totalPagesStock; i++) {
    pageNumbersStock.push(i);
  }

  // RENDER EMPTY STATE UNTUK STOK BARANG
  const renderEmptyStateStok = () => {
    return (
      <div className="empty-state">
        <img
          src={dataTidakDitemukan}
          alt="Data tidak ditemukan"
          className="empty-state-image"
        />
        <p className="empty-state-text">
          {searchStock || kategoriFilter
            ? "Data tidak ditemukan"
            : "Tidak ada data stok barang"}
        </p>
      </div>
    );
  };

  // Format currency untuk display di list table (dengan 2 digit desimal)
  const formatCurrencyDisplay = (amount) => {
    if (!amount) return "0.00";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // RENDER EMPTY STATE UNTUK HISTORY
  const renderEmptyStateHistory = () => {
    return (
      <div className="empty-state">
        <img
          src={dataTidakDitemukan}
          alt="Belum ada data history"
          className="empty-state-image"
        />
        <h4 className="empty-state-title">Belum Ada Data History</h4>
        <p className="empty-state-subtitle">
          Data history akan muncul setelah ada perubahan stok
        </p>
      </div>
    );
  };

  return (
    <div
      className={`master-main-content-fixed ${
        showDetail || deleteItem ? "modal-open" : ""
      }`}
    >
      {/* Judul Halaman */}
      <div className="page-header">
        <h1>Stok Barang</h1>
      </div>

      {/* SECTION STOK BARANG */}
      <section className="master-table-section-fixed">
        <div className="section-header">
          <div className="header-actions">
            <div className="filter-controls">
              {/* Search Form */}
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
                  {searchStock && (
                    <button
                      type="button"
                      onClick={() => setSearchStock("")}
                      className="btn-reset-compact"
                      title="Reset Pencarian"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 🔹 FILTER DROPDOWN CUSTOM */}
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
                        Semua Kategori
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "ATK" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("ATK")}
                      >
                        ATK
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "Pantry" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("Pantry")}
                      >
                        Pantry
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "Kebersihan" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("Kebersihan")}
                      >
                        Kebersihan
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "Elektronik" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("Elektronik")}
                      >
                        Elektronik
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "Konsumable" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("Konsumable")}
                      >
                        Konsumable
                      </button>
                      <button
                        className={`filter-dropdown-item ${
                          activeFilter === "Lainnya" ? "active" : ""
                        }`}
                        onClick={() => applyFilter("Lainnya")}
                      >
                        Lainnya
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Tambah Data */}
            <button className="btn-tambah" onClick={handleTambah}>
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
          ) : currentStocks.length === 0 ? (
            renderEmptyStateStok()
          ) : (
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
                  <tr
                    key={item.id_barang || item.id}
                    className={
                      updatedItemId &&
                      (item.id_barang == updatedItemId ||
                        item.id == updatedItemId)
                        ? "recently-updated"
                        : ""
                    }
                  >
                    <td>{indexOfFirstItemStock + index + 1}</td>
                    <td>{item.nama_barang}</td>
                    <td>{item.kategori}</td>
                    <td>{item.kuantitas}</td>
                    <td>Rp {formatCurrencyDisplay(item.total_harga)}</td>
                    <td>
                      {new Date(item.tanggal_transaksi).toLocaleDateString(
                        "id-ID"
                      )}
                    </td>
                    <td>{item.dibayar_oleh}</td>
                    <td>{item.notes || "-"}</td>
                    <td>
                      <div className="aksi-cell">
                        <button
                          className="aksi-btn view"
                          title="Lihat Detail"
                          onClick={() => handleViewDetail(item)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="aksi-btn edit"
                          title="Edit"
                          onClick={() => handleEdit(item.id_barang || item.id)}
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

        {/* PAGINATION UNTUK STOK BARANG */}
        {!loading && filteredStocks.length > 0 && (
          <div className="pagination-container">
            {/* Row Page Selection - Kiri */}
            <div className="row-page-selection">
              <span className="row-page-label">Rows per page:</span>
              <select
                value={itemsPerPageStock}
                onChange={(e) => handleItemsPerPageChangeStock(e.target.value)}
                className="row-page-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="row-page-info">
                Showing {indexOfFirstItemStock + 1} to{" "}
                {Math.min(indexOfLastItemStock, filteredStocks.length)} of{" "}
                {filteredStocks.length} entries
              </span>
            </div>

            {/* Pagination Controls - Kanan */}
            <div className="pagination-controls">
              <button
                onClick={() => paginateStock(currentPageStock - 1)}
                disabled={currentPageStock === 1}
                className="pagination-btn"
              >
                &lt;
              </button>

              {pageNumbersStock.map((number) => (
                <button
                  key={number}
                  onClick={() => paginateStock(number)}
                  className={`pagination-btn ${
                    currentPageStock === number ? "active" : ""
                  }`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => paginateStock(currentPageStock + 1)}
                disabled={currentPageStock === totalPagesStock}
                className="pagination-btn"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION HISTORY STOCK - DENGAN LATAR PUTIH */}
      <section className="master-table-section-fixed history-section-with-bg">
        <div className="section-header">
          <h2>
            <FaHistory style={{ marginRight: "10px" }} />
            History Stok Barang (5 Aktivitas Terbaru)
          </h2>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={fetchHistory}
              disabled={historyLoading}
            >
              {historyLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="table-container-fixed with-bg">
          {historyLoading ? (
            <div className="loading-state">
              <p>Loading history...</p>
            </div>
          ) : displayedHistory.length === 0 ? (
            renderEmptyStateHistory()
          ) : (
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
                    <td>
                      <span className={getTipeBadge(item.tipe)}>
                        {getTipeIcon(item.tipe)}
                        {formatTipe(item.tipe)}
                      </span>
                    </td>
                    <td>{item.jumlah || 0}</td>
                    <td>{item.keterangan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Detail Panel Sidebar */}
      {/* Detail Modal - Styling sama dengan Inventaris */}
      {showDetail && selectedItem && (
        <>
          <div className="blur-overlay"></div>
          <div className="detail-modal-fullscreen">
            <div className="detail-modal-header">
              <h2>
                Detail Stok Barang - {selectedItem?.nama_barang || "Barang"}
              </h2>
              <button className="close-btn" onClick={handleCloseDetail}>
                ✖
              </button>
            </div>

            <div className="detail-modal-content-improved">
              {/* 🔥 Sisi Kiri - Informasi Barang */}
              <div className="detail-info-side">
                <div className="detail-info-card">
                  <h3>📋 Informasi Barang</h3>

                  <div className="detail-basic-info">
                    <div className="detail-name-section">
                      <h4 className="detail-name-improved">
                        {selectedItem?.nama_barang || "-"}
                      </h4>
                      <div className="detail-no-inventaris-improved">
                        <span className="no-inventaris-badge">
                          🏷️ Stok #
                          {selectedItem?.id_barang || selectedItem?.id || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="status-kondisi-container">
                      <div className="kondisi-section">
                        <label>Kategori:</label>
                        <span className="kategori-badge">
                          {selectedItem?.kategori || "-"}
                        </span>
                      </div>
                      <div className="kondisi-section">
                        <label>Tanggal:</label>
                        <span className="info-value">
                          {formatDate(selectedItem?.tanggal_transaksi)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-info-grid">
                    <div className="info-item">
                      <span className="info-label">Nama Barang:</span>
                      <span className="info-value">
                        {selectedItem?.nama_barang || "-"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Kuantitas:</span>
                      <span className="info-value">
                        {selectedItem?.kuantitas || 0}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Kategori:</span>
                      <span className="info-value">
                        {selectedItem?.kategori || "-"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Harga:</span>
                      <span className="info-value price">
                        {formatCurrency(selectedItem?.harga || 0)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total Harga:</span>
                      <span className="info-value price">
                        Rp{" "}
                        {formatCurrencyDisplay(selectedItem?.total_harga || 0)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Tipe Transaksi:</span>
                      <span className="info-value">
                        <span className={getTipeBadge(selectedItem?.tipe)}>
                          {getTipeIcon(selectedItem?.tipe)}
                          {formatTipe(selectedItem?.tipe)}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Tanggal Transaksi:</span>
                      <span className="info-value">
                        {formatDate(selectedItem?.tanggal_transaksi)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dibayar Oleh:</span>
                      <span className="info-value">
                        {selectedItem?.dibayar_oleh || "-"}
                      </span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Keterangan:</span>
                      <span className="info-value">
                        {selectedItem?.notes || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔥 Sisi Kanan - Histori Perubahan Stok */}
              <div className="histori-side">
                <div className="histori-card">
                  <h3>📊 Histori Perubahan Stok</h3>

                  {loadingHistori ? (
                    <div className="loading-histori">
                      <p>Memuat data histori...</p>
                    </div>
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
                                <td>
                                  {formatHistoryDate(histori.tanggal_kejadian)}
                                </td>
                                <td>
                                  <span className={getTipeBadge(histori.tipe)}>
                                    {getTipeIcon(histori.tipe)}
                                    {formatTipe(histori.tipe)}
                                  </span>
                                </td>
                                <td>
                                  <strong>{histori.jumlah || 0}</strong>
                                </td>
                                <td className="keterangan-cell">
                                  {histori.keterangan || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Info Jumlah Data */}
                      <div
                        className="pagination-histori-info"
                        style={{
                          textAlign: "center",
                          padding: "15px 0",
                          borderTop: "1px solid #e9ecef",
                          marginTop: "auto",
                          fontWeight: "500",
                          color: "#666",
                        }}
                      >
                        <span>
                          Total {historiBarang.length} data histori perubahan
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="empty-histori">
                      <p>📝 Tidak ada histori perubahan untuk barang ini.</p>
                    </div>
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
