// src/pages/PenjualanAset.jsx
import React, { useEffect, useState } from "react";
import mockApi from "../api/mockApi";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaTimes,
  FaTag,
  FaMoneyBillWave,
  FaCalendar,
  FaStickyNote,
  FaExclamationTriangle,
  FaHistory,
  FaReceipt,
  FaChevronDown,
  FaPlus,
  FaUser,
  FaMoneyBill,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/PenjualanAset.css";
import dataTidakDitemukan from "../assets/data-tidak-ada.png";

function PenjualanAset() {
  // --- KONFIGURASI DAN STATE AWAL ---
  const API_URL = "/penjualan_asset";
  const navigate = useNavigate();
  const location = useLocation();

  // State Utama untuk menyimpan data dari API
  const [dataPenjualan, setDataPenjualan] = useState([]); // Data yang ditampilkan (bisa terfilter)
  const [allData, setAllData] = useState([]);             // Backup data asli untuk pencarian/filter
  const [loading, setLoading] = useState(true);           // Status loading proses fetch
  const [error, setError] = useState(false);               // Status jika fetch gagal
  const [searchQuery, setSearchQuery] = useState("");     // Input pencarian

  // State untuk kontrol Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State untuk kontrol Filter Status (Dropdown)
  const [activeFilter, setActiveFilter] = useState("semua");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // State untuk kontrol Modal Detail dan Histori
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [historiPembayaran, setHistoriPembayaran] = useState([]);
  const [loadingHistori, setLoadingHistori] = useState(false);

  // --- EFFECT: HANDLING NOTIFIKASI DARI HALAMAN LAIN ---
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get("action");

    // Menampilkan Alert Sukses berdasarkan parameter URL (setelah redirect dari Tambah/Edit)
    if (action === "created") {
      Swal.fire({
        title: "Berhasil!",
        text: "Data penjualan berhasil disimpan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData();
      navigate("/app/penjualan-aset", { replace: true }); // Bersihkan parameter URL
    } else if (action === "updated") {
      Swal.fire({
        title: "Berhasil!",
        text: "Data penjualan berhasil diperbarui.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData();
      navigate("/app/penjualan-aset", { replace: true });
    } else {
      fetchData(); // Load data biasa jika tidak ada aksi khusus
    }
  }, [location.search, navigate]);

  // --- FUNGSI AMBIL DATA (FETCHING) ---
  const fetchData = () => {
    setLoading(true);
    setError(false);

    mockApi
      .get(API_URL)
      .then((res) => {
        const hasil = res.data.data || res.data || [];
        const dataArray = Array.isArray(hasil) ? hasil : [];

        // Logika Pengurutan: Data terbaru diletakkan paling atas
        const sortedData = dataArray.sort((a, b) => {
          if (a.updated_at && b.updated_at) {
            return new Date(b.updated_at) - new Date(a.updated_at);
          }
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return (b.id_penjualan || b.id) - (a.id_penjualan || a.id);
        });

        setDataPenjualan(sortedData);
        setAllData(sortedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal ambil data:", err);
        setError(true);
        setLoading(false);
      });
  };

  // --- FUNGSI FILTER STATUS ---
  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    setCurrentPage(1);
    setShowFilterDropdown(false);

    if (filterType === "semua") {
      setDataPenjualan(allData);
      return;
    }

    const filteredData = allData.filter((item) => {
      const status = item.status?.toLowerCase() || "";
      switch (filterType) {
        case "lunas": return status === "lunas";
        case "belum lunas": return status === "belum lunas";
        case "dibatalkan": return status === "dibatalkan";
        default: return true;
      }
    });

    // Urutkan kembali hasil filter
    const sortedFilteredData = filteredData.sort((a, b) => {
      if (a.updated_at && b.updated_at) return new Date(b.updated_at) - new Date(a.updated_at);
      if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
      return (b.id_penjualan || b.id) - (a.id_penjualan || a.id);
    });

    setDataPenjualan(sortedFilteredData);
  };

  // --- FUNGSI PAGINATION ---
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // --- EFFECT: PENCARIAN OTOMATIS (SEARCH) ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      applyFilter(activeFilter);
      setCurrentPage(1);
      return;
    }

    const searchLower = searchQuery.toLowerCase();
    let hasil = allData.filter((item) => {
      const namaBarang = (item.inventaris?.nama_barang || "").toLowerCase();
      const namaKaryawan = (item.karyawan?.nama || "").toLowerCase();
      return namaBarang.includes(searchLower) || namaKaryawan.includes(searchLower);
    });

    // Sinkronisasi hasil pencarian dengan filter status yang aktif
    if (activeFilter !== "semua") {
      hasil = hasil.filter((item) => {
        const status = item.status?.toLowerCase() || "";
        switch (activeFilter) {
          case "lunas": return status === "lunas";
          case "belum lunas": return status === "belum lunas";
          case "dibatalkan": return status === "dibatalkan";
          default: return true;
        }
      });
    }

    setDataPenjualan(hasil);
    setCurrentPage(1);
  }, [searchQuery, allData, activeFilter]);

  const handleResetSearch = () => {
    setSearchQuery("");
    applyFilter(activeFilter);
    setCurrentPage(1);
  };

  // --- FUNGSI AMBIL HISTORI PEMBAYARAN (DETAIL) ---
  const fetchHistoriPembayaran = async (idPenjualan) => {
    setLoadingHistori(true);
    try {
      const response = await mockApi.get(`${API_URL}/${idPenjualan}/histori`);
      setHistoriPembayaran(response.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil histori pembayaran:", error);
      setHistoriPembayaran([]);
    } finally {
      setLoadingHistori(false);
    }
  };

  // --- HELPER FORMATTING ---
  const formatDate = (tanggal) => {
    if (!tanggal) return "-";
    const date = new Date(tanggal);
    return date.toLocaleDateString("id-ID");
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return `Rp ${parseInt(amount).toLocaleString("id-ID")}`;
  };

  const getStatusBadge = (status) => {
    if (!status) return "pa-status-badge";
    const statusLower = status.toLowerCase();
    if (statusLower === "lunas") return "pa-status-badge lunas";
    if (statusLower === "belum lunas") return "pa-status-badge belum-lunas";
    if (statusLower === "dibatalkan") return "pa-status-badge dibatalkan";
    return "pa-status-badge";
  };

  // --- FUNGSI MODAL DETAIL ---
  const handleViewDetail = async (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    document.body.style.overflow = "hidden"; // Mencegah scroll pada background
    await fetchHistoriPembayaran(item.id_penjualan);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setHistoriPembayaran([]);
    document.body.style.overflow = "auto";
  };

  // --- FUNGSI DELETE DATA ---
  const handleDelete = async (item) => {
    const namaBarang = item.inventaris?.nama_barang || "Data Penjualan";

    const confirmResult = await Swal.fire({
      title: "Apakah Anda yakin?",
      html: `Data ${namaBarang} akan dihapus secara permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      // Validasi bisnis: Status belum lunas tidak boleh dihapus
      if (item.status?.toLowerCase() === "belum lunas") {
        Swal.fire({
          title: "Gagal!",
          text: "Data dengan status belum lunas tidak dapat dihapus.",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

      await mockApi.delete(`${API_URL}/${item.id_penjualan}`);
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
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus!",
        text: "Gagal menghapus data: " + (error.response?.data?.message || error.message),
        confirmButtonText: "OK",
      });
    }
  };

  // Label untuk tampilan filter
  const getFilterDisplayText = () => {
    switch (activeFilter) {
      case "semua": return "Semua Status";
      case "lunas": return "Lunas";
      case "belum lunas": return "Belum Lunas";
      case "dibatalkan": return "Dibatalkan";
      default: return "Semua Status";
    }
  };

  // Kalkulasi data untuk pagination (Slicing array)
  const totalPages = Math.ceil(dataPenjualan.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = dataPenjualan.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // --- RENDER COMPONENT: EMPTY STATE ---
  const renderEmptyState = () => {
    return (
      <div className="empty-state">
        <img src={dataTidakDitemukan} alt="Data tidak ditemukan" className="empty-state-image" />
        <p className="empty-state-text">
          {searchQuery ? "Data tidak ditemukan" : "Tidak ada data penjualan aset"}
        </p>
      </div>
    );
  };

  // --- RETURN UI (JSX) ---
  return (
    <div className={`master-main-content-fixed ${showDetail ? "modal-open" : ""}`}>
      <main className="master-main-content-fixed">
        <div className="page-header">
          <h1>Penjualan Aset</h1>
        </div>

        <section className="master-table-section-fixed">
          <div className="section-header">
            <div className="header-actions">
              {/* Form Pencarian */}
              <div className="search-form-compact">
                <div className="search-input-group-compact">
                  <FaSearch className="search-icon-compact" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama barang atau nama karyawan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-compact"
                  />
                  {searchQuery && (
                    <button type="button" onClick={handleResetSearch} className="btn-reset-compact">✕</button>
                  )}
                </div>
              </div>

              {/* Tombol Filter Dropdown */}
              <div className="filter-dropdown-container">
                <div className="filter-dropdown">
                  <button className="filter-dropdown-toggle" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                    <span>{getFilterDisplayText()}</span>
                    <FaChevronDown className={`dropdown-arrow ${showFilterDropdown ? "rotate" : ""}`} />
                  </button>
                  {showFilterDropdown && (
                    <div className="filter-dropdown-menu">
                      <button className={`filter-dropdown-item ${activeFilter === "semua" ? "active" : ""}`} onClick={() => applyFilter("semua")}>Semua Status</button>
                      <button className={`filter-dropdown-item ${activeFilter === "lunas" ? "active" : ""}`} onClick={() => applyFilter("lunas")}>Lunas</button>
                      <button className={`filter-dropdown-item ${activeFilter === "belum lunas" ? "active" : ""}`} onClick={() => applyFilter("belum lunas")}>Belum Lunas</button>
                      <button className={`filter-dropdown-item ${activeFilter === "dibatalkan" ? "active" : ""}`} onClick={() => applyFilter("dibatalkan")}>Dibatalkan</button>
                    </div>
                  )}
                </div>
              </div>

              <button className="btn-tambah" onClick={() => navigate("/app/penjualan-aset/tambah")}>
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
                <p className="empty-state-text">Gagal memuat data dari server</p>
              </div>
            ) : currentData.length === 0 ? (
              renderEmptyState()
            ) : (
              /* --- TABEL DATA PENJUALAN --- */
              <table className="table-fixed">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Barang</th>
                    <th>Nama Karyawan</th>
                    <th>Metode Pembayaran</th>
                    <th>Jumlah Bayar</th>
                    <th>Total</th>
                    <th>Sisa</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => (
                    <tr key={item.id_penjualan || index}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>{item.inventaris?.nama_barang || "-"}</td>
                      <td>{item.karyawan?.nama || "-"}</td>
                      <td>{item.metode_pembayaran || "-"}</td>
                      <td>{formatCurrency(item.jumlah_terbayar)}</td>
                      <td>{formatCurrency(item.harga_jual)}</td>
                      <td>{formatCurrency(item.sisa)}</td>
                      <td>
                        <span className={getStatusBadge(item.status)}>{item.status || "-"}</span>
                      </td>
                      <td>{formatDate(item.tanggal)}</td>
                      <td>
                        <div className="aksi-cell">
                          <button className="aksi-btn view" title="Lihat Detail" onClick={() => handleViewDetail(item)}><FaEye /></button>
                          <button className="aksi-btn edit" title="Edit" onClick={() => navigate(`/app/penjualan-aset/edit/${item.id_penjualan}`)}><FaEdit /></button>
                          <button className="aksi-btn delete" title="Hapus" onClick={() => handleDelete(item)}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* --- PAGINATION UI --- */}
          {!loading && dataPenjualan.length > 0 && (
            <div className="pagination-container">
              <div className="row-page-selection">
                <span className="row-page-label">Rows per page:</span>
                <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(e.target.value)} className="row-page-select">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="row-page-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, dataPenjualan.length)} of {dataPenjualan.length} entries
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
      </main>

      {/* --- MODAL DETAIL DAN HISTORI PEMBAYARAN --- */}
      {showDetail && (
        <>
          <div className="blur-overlay"></div>
          <div className="detail-modal-fullscreen">
            <div className="detail-modal-header">
              <h2>Detail Penjualan Aset - {selectedItem?.inventaris?.nama_barang || "Penjualan"}</h2>
              <button className="close-btn" onClick={handleCloseDetail}>✖</button>
            </div>

            <div className="detail-modal-content-improved">
              {/* Sisi Kiri: Detail Data */}
              <div className="detail-info-side">
                <div className="detail-info-card">
                  <h3>📋 Informasi Penjualan</h3>
                  <div className="detail-basic-info">
                    <div className="detail-name-section">
                      <h4 className="detail-name-improved">{selectedItem?.inventaris?.nama_barang || "-"}</h4>
                      <div className="detail-no-inventaris-improved">
                        <span className="no-inventaris-badge">🏷️ Penjualan #{selectedItem?.id_penjualan || "-"}</span>
                      </div>
                    </div>
                    <div className="status-kondisi-container">
                      <div className="status-section">
                        <label>Status:</label>
                        <span className={getStatusBadge(selectedItem?.status)}>{selectedItem?.status || "-"}</span>
                      </div>
                      <div className="kondisi-section">
                        <label>Tanggal:</label>
                        <span className="info-value">{formatDate(selectedItem?.tanggal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-info-grid">
                    <div className="info-item"><span className="info-label">Nama Barang:</span><span className="info-value">{selectedItem?.inventaris?.nama_barang || "-"}</span></div>
                    <div className="info-item"><span className="info-label">Nama Karyawan:</span><span className="info-value">{selectedItem?.karyawan?.nama || "-"}</span></div>
                    <div className="info-item"><span className="info-label">Metode Pembayaran:</span><span className="info-value">{selectedItem?.metode_pembayaran || "-"}</span></div>
                    <div className="info-item"><span className="info-label">Harga Jual:</span><span className="info-value price">{formatCurrency(selectedItem?.harga_jual)}</span></div>
                    <div className="info-item"><span className="info-label">Jumlah Terbayar:</span><span className="info-value price">{formatCurrency(selectedItem?.jumlah_terbayar)}</span></div>
                    <div className="info-item"><span className="info-label">Sisa:</span><span className="info-value price">{formatCurrency(selectedItem?.sisa)}</span></div>
                    <div className="info-item full-width"><span className="info-label">Keterangan:</span><span className="info-value">{selectedItem?.keterangan || "-"}</span></div>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: Tabel Histori Pembayaran */}
              <div className="histori-side">
                <div className="histori-card">
                  <h3>📊 Histori Pembayaran</h3>
                  {loadingHistori ? (
                    <div className="loading-histori"><p>Memuat data histori...</p></div>
                  ) : historiPembayaran && historiPembayaran.length > 0 ? (
                    <>
                      <div className="histori-table-container-fixed">
                        <table className="histori-table-improved">
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>Tanggal Bayar</th>
                              <th>Jumlah Bayar</th>
                              <th>Metode</th>
                              <th>Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historiPembayaran.map((histori, index) => (
                              <tr key={histori.id_histori || index}>
                                <td className="text-center">{index + 1}</td>
                                <td>{formatDate(histori.tanggal_bayar)}</td>
                                <td className="price">{formatCurrency(histori.jumlah_bayar)}</td>
                                <td><span className="metode-badge">{histori.metode_pembayaran}</span></td>
                                <td className="keterangan-cell">{histori.keterangan || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="pagination-histori-info" style={{ textAlign: "center", padding: "15px 0", borderTop: "1px solid #e9ecef", marginTop: "auto", fontWeight: "600", color: "#1e63b4" }}>
                        <span>Total Dibayar: </span>
                        <span className="total-price">
                          {formatCurrency(historiPembayaran.reduce((total, histori) => total + parseFloat(histori.jumlah_bayar || 0), 0))}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="empty-histori"><p>📝 Tidak ada histori pembayaran untuk penjualan ini.</p></div>
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

export default PenjualanAset;