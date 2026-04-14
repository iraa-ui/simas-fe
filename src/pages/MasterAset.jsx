import React, { useEffect, useState, useRef } from "react";
import mockApi from "../api/mockApi";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaQrcode,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/MasterAset.css";
import "../styles/fix-master-tables.css";
import simasLogo from "../assets/topbar-logo.png";
import dataTidakDitemukan from "../assets/data-tidak-ada.png";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";

function MasterAset() {
  const QR_BASE_URL = `https://simas-dev.cloudias79.com`;
  const API_URL = "/inventaris";
  const [inventaris, setInventaris] = useState([]);
  const [filteredInventaris, setFilteredInventaris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 STATE BARU UNTUK FILTER DROPDOWN
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Semua Status");

  // 🔹 STATE PAGINATION BARU
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [activePopup, setActivePopup] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [detailItem, setDetailItem] = useState(null);
  const [qrItem, setQrItem] = useState(null);

  const [showQrDesign, setShowQrDesign] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const popupRef = useRef(null);
  const navigate = useNavigate();

  // 🔹 FUNGSI UNTUK FILTER DROPDOWN
  const getFilterDisplayText = () => {
    return activeFilter;
  };

  const applyFilter = (filterValue) => {
    setActiveFilter(filterValue);
    setStatusFilter(
      filterValue === "Semua Status" ? "Semua Status" : filterValue
    );
    setShowFilterDropdown(false);
  };

  // 🔹 HANDLE CLICK OUTSIDE UNTUK DROPDOWN
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

  // 🔹 FUNGSI BARU: Membersihkan URL dari escape characters dengan berbagai approach
  const cleanUrl = (url) => {
    if (!url) return null;

    // Approach 1: Remove escape slashes
    let cleaned = url.replace(/\\\//g, "/");

    // Approach 2: Use URL constructor if valid URL
    try {
      cleaned = new URL(cleaned).toString();
    } catch (e) {
      console.warn("Invalid URL, using cleaned version:", cleaned);
    }

    // Approach 3: Decode URI components
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch (e) {
      // If decoding fails, use the cleaned version
    }

    console.log("URL Cleaning:", { original: url, cleaned });
    return cleaned;
  };

  // 🔹 FUNCTION BARU: Download QR dengan desain menarik - PERBAIKAN LOGO
  const downloadStyledQR = (asset) => {
    // Buat canvas untuk desain
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Ukuran canvas - DIPERBESAR untuk kualitas lebih baik
    canvas.width = 600;
    canvas.height = 700;

    // Background gradient
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");

    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header background
    ctx.fillStyle = "white";
    ctx.fillRect(30, 30, canvas.width - 60, 80);
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SIMAS - Aset", canvas.width / 2, 60);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#666";
    ctx.fillText(asset.no_inventaris, canvas.width / 2, 85);

    // QR Code area background
    ctx.fillStyle = "white";
    ctx.fillRect(75, 130, 450, 450);

    // Buat QR code menggunakan element yang sudah ada di DOM
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);

    const qrCode = new QRCodeCanvas({
      value: `${QR_BASE_URL}/aset/${asset.id_inventaris}`,
      size: 360, // DIPERBESAR
      bgColor: "#ffffff",
      fgColor: "#2c3e50",
      includeMargin: false,
      level: "H",
    });

    // Render QR code ke element sementara
    tempDiv.appendChild(qrCode);

    // Tunggu sebentar untuk render, lalu capture sebagai image
    setTimeout(() => {
      const qrCanvas = tempDiv.querySelector("canvas");
      if (qrCanvas) {
        const qrImage = new Image();
        qrImage.onload = function () {
          // Draw QR code ke canvas utama - DIPERBESAR
          ctx.drawImage(qrImage, 120, 175, 360, 360);

          // Footer background
          ctx.fillStyle = "white";
          ctx.fillRect(30, 560, canvas.width - 60, 80);

          // Asset name
          ctx.fillStyle = "#2c3e50";
          ctx.font = "bold 18px Arial";
          ctx.textAlign = "center";

          // Potong teks jika terlalu panjang
          let assetName = asset.nama_barang;
          if (assetName.length > 30) {
            assetName = assetName.substring(0, 30) + "...";
          }
          ctx.fillText(assetName, canvas.width / 2, 590);

          // Instruction
          ctx.font = "14px Arial";
          ctx.fillStyle = "#666";
          ctx.fillText("Scan untuk detail aset", canvas.width / 2, 615);

          // Download image
          const url = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `QR-${asset.nama_barang}-${asset.no_inventaris}.png`;
          link.href = url;
          link.click();

          // Cleanup
          document.body.removeChild(tempDiv);

          // Show success message - ALERT DIKECILKAN
          Swal.fire({
            title: "Berhasil!",
            text: "QR Code berhasil didownload",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
            width: 300,
            customClass: {
              popup: "swal-toast-custom",
              container: "swal-container-custom",
            },
          });
        };

        qrImage.src = qrCanvas.toDataURL("image/png");
      }
    }, 100);
  };

  // 🔥 FUNGSI BARU: Helper untuk styling kondisi
  const getKondisiStyle = (kondisi) => {
    switch (kondisi?.toLowerCase()) {
      case "baik":
        return "kondisi-badge kondisi-baik";
      case "rusak":
        return "kondisi-badge kondisi-rusak";
      default:
        return "kondisi-badge kondisi-baik";
    }
  };

  // 🔥 FUNGSI BARU: Helper untuk styling status
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "tersedia":
        return "status-badge status-tersedia";
      case "tidak tersedia":
        return "status-badge status-tidak-tersedia";
      case "dipinjam":
        return "status-badge status-dipinjam";
      case "terjual":
        return "status-badge status-terjual";
      case "belum lunas":
        return "status-badge status-belum-lunas";
      case "permintaan perbaikan":
        return "status-badge status-permintaan-perbaikan";
      case "dalam perbaikan":
        return "status-badge status-dalam-perbaikan";
      case "sudah diperbaiki":
        return "status-badge status-sudah-diperbaiki";
      default:
        return "status-badge status-tersedia";
    }
  };

  // Tambahkan state baru
  const [historiData, setHistoriData] = useState([]);
  const [historiPerPage] = useState(5);
  const [currentHistoriPage, setCurrentHistoriPage] = useState(1);
  const [loadingHistori, setLoadingHistori] = useState(false);

  // 🔥 PERBAIKAN: Fungsi fetchHistori yang sesuai dengan struktur backend
  const fetchHistori = async (idInventaris, page = 1) => {
    setLoadingHistori(true);
    try {
      const response = await mockApi.get(
        `${API_URL}/${idInventaris}/histori?page=${page}&per_page=5`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      console.log("🔍 DEBUG Response Structure:", response.data);

      // 🔥 STRUKTUR BACKEND:
      // response.data.data adalah paginator Laravel (berisi data, current_page, last_page, dll)
      // response.data.message adalah pesan
      // response.data.inventaris adalah info inventaris

      const paginator = response.data.data;

      if (paginator && paginator.data) {
        // Struktur Laravel paginator standard
        setHistoriData({
          data: paginator.data || [],
          current_page: paginator.current_page || 1,
          last_page: paginator.last_page || 1,
          per_page: paginator.per_page || 5,
          total: paginator.total || 0,
          from: paginator.from || 0,
          to: paginator.to || 0,
        });
      } else {
        // Fallback jika struktur tidak sesuai
        console.warn("⚠️ Struktur tidak sesuai, menggunakan data langsung");
        setHistoriData({
          data: response.data.data || [],
          current_page: 1,
          last_page: 1,
          per_page: 5,
          total: (response.data.data || []).length,
          from: 1,
          to: (response.data.data || []).length,
        });
      }

      setCurrentHistoriPage(page);
    } catch (error) {
      console.error("❌ Error fetching histori:", error);
      setHistoriData({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 5,
        total: 0,
        from: 0,
        to: 0,
      });
    } finally {
      setLoadingHistori(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await mockApi.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        timeout: 8000,
      });

      if (response.data.data?.length > 0) {
        const dataArray = response.data.data;

        // 🔥 PERBAIKAN: Sort by created_at DESC (data baru di atas)
        // Tapi edit tidak akan mengubah urutan karena created_at tetap
        const sortedData = dataArray.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          // Fallback: ID descending (data baru di atas)
          return (b.id_inventaris || b.id) - (a.id_inventaris || a.id);
        });

        setInventaris(sortedData);
        setFilteredInventaris(sortedData);
      } else {
        setInventaris([]);
        setFilteredInventaris([]);
      }
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
      setError(true);
      setInventaris([]);
      setFilteredInventaris([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 EFFECT BARU: Filter data berdasarkan status dan search
  useEffect(() => {
    let filtered = inventaris;

    // Filter berdasarkan search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.nama_barang?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter berdasarkan status
    if (statusFilter !== "Semua Status") {
      filtered = filtered.filter(
        (item) => item.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredInventaris(filtered); // 🔥 GUNAKAN filtered LANGSUNG
    setCurrentPage(1); // Reset ke halaman pertama ketika filter berubah
  }, [statusFilter, searchQuery, inventaris]);

  // 🔹 EFFECT BARU: Debug data inventaris
  useEffect(() => {
    if (inventaris.length > 0) {
      console.log("Inventaris data:", inventaris);
      inventaris.forEach((item, index) => {
        console.log(`Item ${index} foto_url:`, item.foto_url);
        console.log(`Item ${index} cleaned URL:`, cleanUrl(item.foto_url));
      });
    }
  }, [inventaris]);

  // 🔹 EFFECT BARU: Untuk menampilkan alert success setelah redirect dari tambah/edit
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");

    if (action === "created") {
      Swal.fire({
        title: "Berhasil!",
        text: "Data aset berhasil disimpan.",
        icon: "success",
        showConfirmButton: false, // 🔥 HILANGKAN TOMBOL OK
        timer: 1500, // 🔥 AUTO CLOSE SETELAH 1.5 DETIK
      });
      // Hapus parameter dari URL
      window.history.replaceState({}, "", "/app/master-aset");
    } else if (action === "updated") {
      Swal.fire({
        title: "Berhasil!",
        text: "Data aset berhasil diperbarui.",
        icon: "success",
        showConfirmButton: false, // 🔥 HILANGKAN TOMBOL OK
        timer: 1500, // 🔥 AUTO CLOSE SETELAH 1.5 DETIK
      });
      // Hapus parameter dari URL
      window.history.replaceState({}, "", "/app/master-aset");
    }
  }, []);

  // 🔹 Klik luar untuk menutup popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setActivePopup(null);
        setDetailItem(null);
        setQrItem(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 PAGINATION CALCULATIONS
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredInventaris.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredInventaris.length / rowsPerPage);

  // 🔹 CHANGE PAGE
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // 🔹 CHANGE ROWS PER PAGE
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset ke halaman pertama ketika rows per page berubah
  };

  // 🔹 NEXT PAGE
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 🔹 PREV PAGE
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 🔹 Popup titik tiga
  const togglePopup = (e, id) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    setPopupPosition({ x: rect.right + 10, y: rect.top });
    setActivePopup(activePopup === id ? null : id);
    setDetailItem(null);
    setQrItem(null);
  };

  // 🔹 Detail
  const handleDetail = async (item) => {
    setDetailItem(item);
    setActivePopup(null);
    setQrItem(null);
    await fetchHistori(item.id_inventaris);
  };

  const closeDetail = () => setDetailItem(null);

  // 🔹 Edit
  const handleEdit = (id) => navigate(`/app/master-aset/edit/${id}`);

  // 🔹 Delete
  const handleDelete = (id) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data aset ini akan dihapus secara permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await mockApi.delete(`${API_URL}/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          });

          // 🔥 PERBAIKAN: Ganti alert delete success
          Swal.fire({
            title: "Berhasil!",
            text: "Data berhasil dihapus!",
            icon: "success",
            showConfirmButton: false, // 🔥 HILANGKAN TOMBOL OK
            timer: 1500, // 🔥 AUTO CLOSE SETELAH 1.5 DETIK
          });

          fetchData();
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus",
            text:
              err.response?.data?.message ||
              "Terjadi kesalahan saat menghapus aset.",
          });
        }
      }
    });
  };

  // 🔹 QR
  const handleQR = (id) => {
    const item = inventaris.find((i) => i.id_inventaris === id);
    setQrItem(item);
    setActivePopup(null);
    setDetailItem(null);
  };

  // 🔹 GENERATE PAGE NUMBERS
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="master-main-content-fixed">
      {/* 🔥 OVERLAY BLUR - HANYA BACKGROUND YANG BUREM */}
      {(detailItem || qrItem) && <div className="blur-overlay"></div>}

      <main className="master-main-content-fixed">
        {/* Judul Halaman */}
        <div className="page-header">
          <h1>Master Aset</h1>
        </div>

        <section className="master-table-section-fixed">
          <div className="section-header">
            <div className="header-actions">
              <div className="search-form-compact">
                <div className="search-input-group-compact">
                  <FaSearch className="search-icon-compact" />
                  <input
                    type="text"
                    placeholder="Cari nama barang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-compact"
                  />
                </div>
              </div>

              {/* 🔹 FILTER DROPDOWN CUSTOM DAN TOMBOL TAMBAH - DI KANAN */}
              <div className="button-group">
                {/* 🔹 FILTER DROPDOWN CUSTOM - GANTI SELECT BIASA */}
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
                            activeFilter === "Semua Status" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("Semua Status")}
                        >
                          Semua Status
                        </button>
                        <button
                          className={`filter-dropdown-item ${
                            activeFilter === "Tersedia" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("Tersedia")}
                        >
                          Tersedia
                        </button>
                        <button
                          className={`filter-dropdown-item ${
                            activeFilter === "Tidak Tersedia" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("Tidak Tersedia")}
                        >
                          Tidak Tersedia
                        </button>
                        <button
                          className={`filter-dropdown-item ${
                            activeFilter === "Dipinjam" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("Dipinjam")}
                        >
                          Dipinjam
                        </button>
                        <button
                          className={`filter-dropdown-item ${
                            activeFilter === "Terjual" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("Terjual")}
                        >
                          Terjual
                        </button>
                        <button
                          className={`filter-dropdown-item ${
                            activeFilter === "Belum Lunas" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("Belum Lunas")}
                        >
                          Belum Lunas
                        </button>
                        <button
                          className={`filter-dropdown-item ${
                            activeFilter === "Permintaan Perbaikan"
                              ? "active"
                              : ""
                          }`}
                          onClick={() => applyFilter("Permintaan Perbaikan")}
                        >
                          Permintaan Perbaikan
                        </button>
                        <button
                          className={`filter-dropdown-item ${
                            activeFilter === "Dalam Perbaikan" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("Dalam Perbaikan")}
                        >
                          Dalam Perbaikan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="btn-tambah"
                  onClick={() => navigate("/app/master-aset/tambah")}
                >
                  + Tambah Aset
                </button>
              </div>
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
                <p className="empty-state-text">
                  Terjadi kesalahan saat memuat data.
                </p>
              </div>
            ) : filteredInventaris.length === 0 ? (
              <div className="empty-state">
                <img
                  src={dataTidakDitemukan}
                  alt="Data tidak ditemukan"
                  className="empty-state-image"
                />
                <p className="empty-state-text">
                  {searchQuery || statusFilter !== "Semua Status"
                    ? "Data tidak ditemukan."
                    : "Data tidak ditemukan."}
                </p>
              </div>
            ) : (
              <>
                <table className="table-fixed">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Foto</th>
                      <th>Nama Barang</th>
                      <th>Tipe</th>
                      <th>Kondisi</th>
                      <th>Status</th>
                      <th>Harga</th>
                      <th>Spesifikasi</th>
                      <th>Keterangan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((item, index) => (
                      <tr key={item.id_inventaris}>
                        <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        <td>
                          {item.foto_url ? (
                            <img
                              src={cleanUrl(item.foto_url)}
                              alt={item.nama_barang}
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "transform 0.2s",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.transform = "scale(1.1)")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                              }
                              onClick={() =>
                                window.open(cleanUrl(item.foto_url), "_blank")
                              }
                              onError={(e) => {
                                console.error(
                                  "Error loading image:",
                                  item.foto_url
                                );
                                e.target.src =
                                  "https://placehold.co/60x60?text=no+image";
                              }}
                            />
                          ) : (
                            <span style={{ color: "#999", fontSize: "12px" }}>
                              Tidak ada foto
                            </span>
                          )}
                        </td>
                        <td>{item.nama_barang}</td>
                        <td>{item.tipe}</td>
                        <td>
                          <span className={getKondisiStyle(item.kondisi)}>
                            {item.kondisi || "Baik"}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusStyle(item.status)}>
                            {item.status || "Tersedia"}
                          </span>
                        </td>
                        <td>{item.formatted_harga}</td>
                        <td>{item.spesifikasi_barang}</td>
                        <td>{item.keterangan}</td>
                        <td className="aksi-cell">
                          <span
                            className="aksi-trigger"
                            onClick={(e) => togglePopup(e, item.id_inventaris)}
                          >
                            ⋮
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 🔥 PAGINATION COMPONENT - ROW PAGE DI KIRI, PAGINATION DI KANAN */}
                <div className="pagination-container">
                  {/* Row Page Selection - KIRI */}
                  <div className="row-page-selection">
                    <span className="row-page-label">Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      className="row-page-select"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="row-page-info">
                      Showing {indexOfFirstRow + 1} to{" "}
                      {Math.min(indexOfLastRow, filteredInventaris.length)} of{" "}
                      {filteredInventaris.length} entries
                    </span>
                  </div>

                  {/* Pagination Controls - KANAN */}
                  <div className="pagination-controls">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      <FaChevronLeft />
                    </button>

                    {getPageNumbers().map((number) => (
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
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Popup Aksi */}
        {activePopup && !qrItem && !detailItem && (
          <div
            ref={popupRef}
            className="popup-actions floating"
            style={{
              position: "fixed",
              top: popupPosition.y,
              left: popupPosition.x,
              zIndex: 9999,
            }}
          >
            <button
              onClick={() =>
                handleDetail(
                  inventaris.find((i) => i.id_inventaris === activePopup)
                )
              }
            >
              <FaEye /> Detail
            </button>
            <button onClick={() => handleEdit(activePopup)}>
              <FaEdit /> Edit
            </button>
            <button onClick={() => handleDelete(activePopup)}>
              <FaTrash /> Hapus
            </button>
            <button onClick={() => handleQR(activePopup)}>
              <FaQrcode /> QR
            </button>
          </div>
        )}

        {/* Detail Drawer */}
        {detailItem && (
          <>
            <div className="blur-overlay"></div>
            <div className="detail-modal-fullscreen">
              <div className="detail-modal-header">
                <h2>Detail Aset - {detailItem.nama_barang}</h2>
                <button className="close-btn" onClick={closeDetail}>
                  ✖
                </button>
              </div>

              <div className="detail-modal-content-improved">
                {/* 🔥 PERBAIKAN: Sisi Kiri - Informasi Aset */}
                <div className="detail-info-side">
                  <div className="detail-info-card">
                    <h3>📋 Informasi Aset</h3>

                    <div className="detail-photo-section">
                      <img
                        src={
                          cleanUrl(detailItem.foto_url) ||
                          "https://placehold.co/200x200?text=No+Image"
                        }
                        alt={detailItem.nama_barang}
                        className="detail-photo-improved"
                      />
                    </div>

                    <div className="detail-basic-info">
                      <div className="detail-name-section">
                        <h4 className="detail-name-improved">
                          {detailItem.nama_barang}
                        </h4>
                        <div className="detail-no-inventaris-improved">
                          <span className="no-inventaris-badge">
                            🏷️ {detailItem.no_inventaris}
                          </span>
                        </div>
                      </div>

                      <div className="status-kondisi-container">
                        <div className="status-section">
                          <label>Status:</label>
                          <span className={getStatusStyle(detailItem.status)}>
                            {detailItem.status || "Tersedia"}
                          </span>
                        </div>
                        <div className="kondisi-section">
                          <label>Kondisi:</label>
                          <span className={getKondisiStyle(detailItem.kondisi)}>
                            {detailItem.kondisi || "Baik"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-info-grid">
                      <div className="info-item">
                        <span className="info-label">Tipe:</span>
                        <span className="info-value">
                          {detailItem.tipe || "-"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Harga:</span>
                        <span className="info-value">
                          {detailItem.formatted_harga_rp ||
                            detailItem.harga ||
                            "-"}
                        </span>
                      </div>
                      <div className="info-item full-width">
                        <span className="info-label">Spesifikasi:</span>
                        <span className="info-value">
                          {detailItem.spesifikasi_barang || "-"}
                        </span>
                      </div>
                      <div className="info-item full-width">
                        <span className="info-label">Keterangan:</span>
                        <span className="info-value">
                          {detailItem.keterangan || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔥 PERBAIKAN: Sisi Kanan - Histori Inventaris */}
                <div className="histori-side">
                  <div className="histori-card">
                    <h3>📊 Histori Inventaris</h3>

                    {loadingHistori ? (
                      <div className="loading-histori">
                        <p>Memuat data histori...</p>
                      </div>
                    ) : historiData.data && historiData.data.length > 0 ? (
                      <>
                        <div className="histori-table-container-fixed">
                          <table className="histori-table-improved">
                            <thead>
                              <tr>
                                <th>No</th>
                                <th>Karyawan</th>
                                <th>Status</th>
                                <th>Tanggal</th>
                                <th>Keterangan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historiData.data.map((histori, index) => (
                                <tr key={histori.id_histori}>
                                  <td className="text-center">
                                    {(currentHistoriPage - 1) *
                                      historiData.per_page +
                                      index +
                                      1}
                                  </td>
                                  <td>{histori.nama_karyawan || "-"}</td>
                                  <td>
                                    {histori.status_sesudah && (
                                      <span
                                        className={getStatusStyle(
                                          histori.status_sesudah
                                        )}
                                      >
                                        {histori.status_sesudah}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {new Date(
                                      histori.created_at
                                    ).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="keterangan-cell">
                                    {histori.keterangan || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* 🔥 PERBAIKAN: Pagination Histori - Struktur yang benar */}
                        {historiData.last_page > 1 ? (
                          <div className="pagination-histori-container-improved">
                            <div className="pagination-histori-info">
                              Menampilkan {historiData.from || 1} -{" "}
                              {historiData.to || historiData.data.length} dari{" "}
                              {historiData.total} data histori
                            </div>

                            <div className="pagination-histori-controls">
                              <button
                                onClick={() =>
                                  fetchHistori(
                                    detailItem.id_inventaris,
                                    currentHistoriPage - 1
                                  )
                                }
                                disabled={currentHistoriPage === 1}
                                className="pagination-histori-btn"
                              >
                                <FaChevronLeft />
                              </button>

                              {/* Generate page numbers yang lebih sederhana */}
                              {(() => {
                                const pageNumbers = [];
                                const totalPages = historiData.last_page;
                                const maxVisiblePages = 5;

                                let startPage = Math.max(
                                  1,
                                  currentHistoriPage - 2
                                );
                                let endPage = Math.min(
                                  totalPages,
                                  startPage + maxVisiblePages - 1
                                );

                                // Adjust jika di akhir
                                if (
                                  endPage - startPage + 1 < maxVisiblePages &&
                                  startPage > 1
                                ) {
                                  startPage = Math.max(
                                    1,
                                    endPage - maxVisiblePages + 1
                                  );
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                  pageNumbers.push(
                                    <button
                                      key={i}
                                      onClick={() =>
                                        fetchHistori(
                                          detailItem.id_inventaris,
                                          i
                                        )
                                      }
                                      className={`pagination-histori-btn ${
                                        currentHistoriPage === i ? "active" : ""
                                      }`}
                                    >
                                      {i}
                                    </button>
                                  );
                                }

                                return pageNumbers;
                              })()}

                              <button
                                onClick={() =>
                                  fetchHistori(
                                    detailItem.id_inventaris,
                                    currentHistoriPage + 1
                                  )
                                }
                                disabled={
                                  currentHistoriPage === historiData.last_page
                                }
                                className="pagination-histori-btn"
                              >
                                <FaChevronRight />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Tampilkan info jika hanya 1 halaman tetapi ada data
                          historiData.total > 0 &&
                          historiData.total <= historiData.per_page && (
                            <div
                              className="pagination-histori-info"
                              style={{
                                textAlign: "center",
                                padding: "15px 0",
                                borderTop: "1px solid #e9ecef",
                                marginTop: "auto",
                              }}
                            >
                              Menampilkan semua {historiData.total} data histori
                            </div>
                          )
                        )}
                      </>
                    ) : (
                      <div className="empty-histori">
                        <p>📝 Tidak ada histori untuk aset ini.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* QR Modal */}
        {qrItem && (
          <>
            <div
              className="detail-overlay"
              onClick={() => setQrItem(null)}
            ></div>
            <div className="qr-modal">
              <button className="close-btn" onClick={() => setQrItem(null)}>
                ✖
              </button>
              <h3>QR Code Aset</h3>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                {qrItem.nama_barang}
              </p>

              {/* ✅ NO INVENTARIS DI QR MODAL */}
              <div
                style={{
                  marginBottom: "15px",
                  textAlign: "center",
                }}
              >
                <strong
                  style={{
                    color: "#1a73e8",
                    fontFamily: "monospace",
                    fontSize: "16px",
                    backgroundColor: "#f0f7ff",
                    padding: "6px 10px",
                    borderRadius: "4px",
                  }}
                >
                  🏷️ {qrItem.no_inventaris}
                </strong>
              </div>

              <div className="qr-code-container">
                <QRCodeCanvas
                  value={`${QR_BASE_URL}/aset/${qrItem.id_inventaris}`}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  includeMargin={true}
                  level="H"
                />
              </div>

              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <p>
                  <strong>ID:</strong> {qrItem.id_inventaris}
                </p>
                <p>
                  <strong>No. Inventaris:</strong>{" "}
                  <span style={{ color: "#1a73e8" }}>
                    {qrItem.no_inventaris}
                  </span>
                </p>
              </div>

              <div className="qr-actions" style={{ marginTop: "20px" }}>
                <button
                  className="btn-download-qr"
                  onClick={() => {
                    Swal.close();

                    // Ambil QR code yang sudah ada di modal
                    const qrCanvas = document.querySelector(
                      ".qr-code-container canvas"
                    );

                    // Buat canvas baru untuk desain
                    const designCanvas = document.createElement("canvas");
                    const ctx = designCanvas.getContext("2d");

                    // Ukuran canvas diperbesar untuk kualitas lebih baik
                    designCanvas.width = 600;
                    designCanvas.height = 250;

                    // Background putih bersih dengan shadow effect
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, designCanvas.width, designCanvas.height);

                    // Border outline dengan shadow
                    ctx.strokeStyle = "#1a73e8";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                      2,
                      2,
                      designCanvas.width - 4,
                      designCanvas.height - 4
                    );

                    // Load dan draw logo SIMAS
                    const logo = new Image();
                    logo.onload = function () {
                      // Aspect ratio yang benar untuk logo
                      const originalAspectRatio = logo.width / logo.height;

                      // Ukuran yang proporsional
                      const logoWidth = 160;
                      const logoHeight = logoWidth / originalAspectRatio;

                      // Posisi logo
                      const logoX = 20;
                      const logoY = 10;

                      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

                      // 🔥 PERBAIKAN: Garis pemisah - JARAK DIPERDEKAT
                      const separatorY = logoY + logoHeight + 8; // 🔥 DARI 15 JADI 8
                      ctx.strokeStyle = "#e0e0e0";
                      ctx.lineWidth = 2;
                      ctx.beginPath();
                      ctx.moveTo(20, separatorY);
                      ctx.lineTo(designCanvas.width - 20, separatorY);
                      ctx.stroke();

                      // QR Code posisi disesuaikan dengan garis pemisah yang lebih dekat
                      const qrY = separatorY + 8; // 🔥 DARI 10 JADI 8
                      ctx.drawImage(qrCanvas, 30, qrY, 120, 120);

                      const infoX = 170;

                      // Posisi teks disesuaikan
                      const textStartY = qrY + 20;
                      ctx.fillStyle = "#1a73e8";
                      ctx.font = "bold 16px Arial";
                      ctx.fillText("Nama Barang:", infoX, textStartY);
                      ctx.fillStyle = "#2c3e50";
                      ctx.font = "bold 16px Arial";

                      let assetName = qrItem.nama_barang;
                      if (assetName.length > 25) {
                        assetName = assetName.substring(0, 25) + "...";
                      }
                      ctx.fillText(assetName, infoX + 120, textStartY);

                      // 🔥 PERBAIKAN: Ganti "No. Inventaris" menjadi "Nomer Barang"
                      ctx.fillStyle = "#1a73e8";
                      ctx.font = "bold 16px Arial";
                      ctx.fillText("Nomer Barang:", infoX, textStartY + 30); // 🔥 "No. Inventaris:" -> "Nomer Barang:"
                      ctx.fillStyle = "#2c3e50";
                      ctx.font = "bold 16px Arial";
                      ctx.fillText(
                        qrItem.no_inventaris,
                        infoX + 120,
                        textStartY + 30
                      );

                      // 🔥 PERBAIKAN: HAPUS STATUS - dihapus seluruh bagian status

                      // Instruction text
                      ctx.fillStyle = "#666";
                      ctx.font = "italic 12px Arial";
                      ctx.textAlign = "center";
                      ctx.fillText(
                        "Scan QR Code untuk melihat detail aset lengkap",
                        designCanvas.width / 2,
                        230
                      );

                      const url = designCanvas.toDataURL("image/png");
                      const link = document.createElement("a");
                      link.download = `QR-${qrItem.nama_barang}-${qrItem.no_inventaris}.png`;
                      link.href = url;
                      link.click();

                      // Alert success
                      Swal.fire({
                        icon: "success",
                        title: "QR Code berhasil didownload",
                        showConfirmButton: false,
                        timer: 2000,
                        width: 300,
                        toast: true,
                        position: "top-end",
                        customClass: {
                          popup: "swal-toast-custom",
                          container: "swal-container-custom",
                        },
                      });
                    };

                    // Handle error loading logo
                    logo.onerror = function () {
                      console.log(
                        "Logo tidak ditemukan, menggunakan fallback text"
                      );

                      // Fallback text dengan aspect ratio yang baik
                      ctx.fillStyle = "#1a73e8";
                      ctx.font = "bold 24px Arial";
                      ctx.textAlign = "left";

                      // Fallback logo text
                      const fallbackLogoWidth = 160;
                      const fallbackLogoHeight = 50;
                      const fallbackLogoX = 20;
                      const fallbackLogoY = 15;

                      // Background untuk fallback text
                      ctx.fillStyle = "#f0f7ff";
                      ctx.fillRect(
                        fallbackLogoX,
                        fallbackLogoY,
                        fallbackLogoWidth,
                        fallbackLogoHeight
                      );

                      // Text fallback
                      ctx.fillStyle = "#1a73e8";
                      ctx.font = "bold 20px Arial";
                      ctx.fillText(
                        "SIMAS",
                        fallbackLogoX + 15,
                        fallbackLogoY + 20
                      );

                      // 🔥 PERBAIKAN: Garis pemisah - JARAK DIPERDEKAT (fallback juga)
                      const separatorY = fallbackLogoY + fallbackLogoHeight + 8; // 🔥 DARI 10 JADI 8
                      ctx.strokeStyle = "#e0e0e0";
                      ctx.lineWidth = 2;
                      ctx.beginPath();
                      ctx.moveTo(20, separatorY);
                      ctx.lineTo(designCanvas.width - 20, separatorY);
                      ctx.stroke();

                      // QR Code - posisi disesuaikan
                      const qrY = separatorY + 8; // 🔥 DARI 10 JADI 8
                      ctx.drawImage(qrCanvas, 30, qrY, 120, 120);

                      const infoX = 170;
                      const textStartY = qrY + 20;

                      // Informasi aset
                      ctx.fillStyle = "#1a73e8";
                      ctx.font = "bold 16px Arial";
                      ctx.fillText("Nama Barang:", infoX, textStartY);
                      ctx.fillStyle = "#2c3e50";
                      ctx.font = "bold 16px Arial";

                      let assetName = qrItem.nama_barang;
                      if (assetName.length > 25) {
                        assetName = assetName.substring(0, 25) + "...";
                      }
                      ctx.fillText(assetName, infoX + 120, textStartY);

                      // 🔥 PERBAIKAN: Ganti "No. Inventaris" menjadi "Nomer Barang" (fallback juga)
                      ctx.fillStyle = "#1a73e8";
                      ctx.font = "bold 16px Arial";
                      ctx.fillText("Nomer Barang:", infoX, textStartY + 30); // 🔥 "No. Inventaris:" -> "Nomer Barang:"
                      ctx.fillStyle = "#2c3e50";
                      ctx.font = "bold 16px Arial";
                      ctx.fillText(
                        qrItem.no_inventaris,
                        infoX + 120,
                        textStartY + 30
                      );

                      // 🔥 PERBAIKAN: HAPUS STATUS - dihapus (fallback juga)

                      // Instruction
                      ctx.fillStyle = "#666";
                      ctx.font = "italic 12px Arial";
                      ctx.textAlign = "center";
                      ctx.fillText(
                        "Scan QR Code untuk melihat detail aset lengkap",
                        designCanvas.width / 2,
                        230
                      );

                      const url = designCanvas.toDataURL("image/png");
                      const link = document.createElement("a");
                      link.download = `QR-${qrItem.nama_barang}-${qrItem.no_inventaris}.png`;
                      link.href = url;
                      link.click();

                      Swal.fire({
                        icon: "success",
                        title: "QR Code berhasil didownload",
                        showConfirmButton: false,
                        timer: 2000,
                        width: 300,
                        toast: true,
                        position: "top-end",
                        customClass: {
                          popup: "swal-toast-custom",
                          container: "swal-container-custom",
                        },
                      });
                    };

                    // ✅ GUNAKAN IMPORTED LOGO - PATH YANG BENAR
                    logo.src = simasLogo;
                  }}
                  style={{
                    background: "#1a73e8",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "background 0.2s ease",
                  }}
                >
                  🎨 Download QR Design
                </button>
              </div>

              {/* ✅ DEBUG URL YANG DIPERBAIKI */}
              <p
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "15px",
                  wordBreak: "break-all",
                  backgroundColor: "#f5f5f5",
                  padding: "8px",
                  borderRadius: "4px",
                }}
              >
                🔗 URL: {`${QR_BASE_URL}/aset/${qrItem.id_inventaris}`}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default MasterAset;
