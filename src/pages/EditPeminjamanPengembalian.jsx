import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import { FaChevronDown } from "react-icons/fa";
import "../styles/EditTambahPeminjamanPengembalian.css";
import Swal from "sweetalert2";

function EditPeminjamanPengembalian() {
  const navigate = useNavigate();
  const { id } = useParams();
  const BASE_URL = "/pinjamkembalis";

  // State untuk data input yang bisa diubah
  const [formData, setFormData] = useState({
    status: "Dipinjam",
    tanggal_peminjaman: "",
    notes: "",
  });

  // State untuk data referensi asli dari backend
  const [originalData, setOriginalData] = useState({
    nama_karyawan: "",
    nama_barang: "",
    tanggal_pengembalian: "",
    current_status: "",
    current_tanggal_peminjaman: "",
    current_notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSedangDiperbaiki, setIsSedangDiperbaiki] = useState(false);
  const [barangDipinjamOlehKaryawanLain, setBarangDipinjamOlehKaryawanLain] = useState(false);
  const [barangSedangDiperbaiki, setBarangSedangDiperbaiki] = useState(false);
  const [peminjamSaatIni, setPeminjamSaatIni] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Penentu apakah form harus dikunci (Read-only)
  const isDikembalikan = originalData.current_status === "Dikembalikan";
  const isDisabled = isSedangDiperbaiki || isDikembalikan;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);
        const response = await mockApi.get(`${BASE_URL}/${id}`);
        
        let data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) data = data[0];

        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        const currentStatus = data.status || "Dipinjam";
        const formattedTglPinjam = formatDateForInput(data.tanggal_peminjaman);
        const formattedTglKembali = formatDateForInput(data.tanggal_pengembalian);
        const currentNotes = data.notes || data.keterangan || "";

        setIsSedangDiperbaiki(currentStatus === "Sedang Diperbaiki");

        setOriginalData({
          nama_karyawan: data.nama_karyawan || "-",
          nama_barang: data.nama_barang || "-",
          tanggal_pengembalian: formattedTglKembali,
          current_status: currentStatus,
          current_tanggal_peminjaman: formattedTglPinjam,
          current_notes: currentNotes,
        });

        setFormData({
          status: currentStatus,
          tanggal_peminjaman: formattedTglPinjam,
          notes: currentNotes,
        });

        await checkStatusBarang(data.nama_barang, data.nama_karyawan);
      } catch (error) {
        console.error("❌ Gagal mengambil data:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Gagal memuat data untuk diedit!",
        });
        navigate("/app/peminjaman-pengembalian");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  // Mengecek apakah barang sedang digunakan oleh orang lain atau di bengkel
  const checkStatusBarang = async (namaBarang, namaKaryawanSaatIni) => {
    try {
      const response = await mockApi.get(BASE_URL);
      const allData = response.data.data || response.data;

      const unavailable = allData.find((item) => {
        const itemData = Array.isArray(item) ? item[0] : item;
        return (
          itemData.nama_barang === namaBarang &&
          itemData.nama_karyawan !== namaKaryawanSaatIni &&
          (itemData.status === "Dipinjam" || itemData.status === "Sedang Diperbaiki")
        );
      });

      if (unavailable) {
        if (unavailable.status === "Dipinjam") {
          setBarangDipinjamOlehKaryawanLain(true);
          setPeminjamSaatIni(unavailable.nama_karyawan);
        } else {
          setBarangSedangDiperbaiki(true);
        }
      }
    } catch (error) {
      console.error("❌ Gagal cek status:", error);
    }
  };

  const handleSelectStatus = (status) => {
    if (isDisabled) return;

    // Proteksi status khusus
    if (status === "Dipinjam" && (barangDipinjamOlehKaryawanLain || barangSedangDiperbaiki)) {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Barang masih digunakan oleh pihak lain atau dalam perbaikan.",
      });
      return;
    }

    setFormData((prev) => ({ ...prev, status }));
    setShowStatusDropdown(false);
  };

  const toggleStatusDropdown = () => {
    if (isDisabled) return;
    setShowStatusDropdown(!showStatusDropdown);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDisabled) return;

    // Cek jika tidak ada perubahan sama sekali
    if (
      formData.tanggal_peminjaman === originalData.current_tanggal_peminjaman &&
      formData.notes.trim() === originalData.current_notes &&
      formData.status === originalData.current_status
    ) {
      Swal.fire({ icon: "info", title: "Info", text: "Tidak ada perubahan data." });
      return;
    }

    const confirm = await Swal.fire({
      title: "Simpan Perubahan?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await mockApi.put(`${BASE_URL}/${id}`, formData);
      navigate("/app/peminjaman-pengembalian", {
        state: { showSuccessAlert: true, successMessage: "Data berhasil diperbarui." },
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Gagal", text: "Terjadi kesalahan saat menyimpan." });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="loading-state"><h3>Memuat data...</h3></div>;

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Edit Data Peminjaman</h2>
            <div className="section-info">
              <h3>Informasi Peminjaman</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Karyawan</label>
                  <input type="text" value={originalData.nama_karyawan} disabled className="readonly-input" />
                </div>

                <div className="form-group">
                  <label>Nama Barang</label>
                  <input type="text" value={originalData.nama_barang} disabled className="readonly-input" />
                </div>

                <div className="form-group">
                  <label className="required">Tanggal Peminjaman</label>
                  <input
                    type="date"
                    value={formData.tanggal_peminjaman}
                    onChange={(e) => setFormData({ ...formData, tanggal_peminjaman: e.target.value })}
                    disabled={isDisabled}
                    className={isDisabled ? "readonly-input" : ""}
                  />
                </div>

                <div className="form-group">
                  <label>Tanggal Pengembalian</label>
                  <input type="date" value={originalData.tanggal_pengembalian} disabled className="readonly-input" />
                  <small>Diatur otomatis oleh sistem saat dikembalikan</small>
                </div>

                <div className="form-group status-dropdown-container">
                  <label className="required">Status</label>
                  <div className="search-input-container">
                    <input
                      type="text"
                      value={formData.status}
                      readOnly
                      onClick={toggleStatusDropdown}
                      className={isDisabled ? "readonly-input" : "pointer"}
                    />
                    {!isDisabled && (
                      <div className="dropdown-icon" onClick={toggleStatusDropdown}>
                        <FaChevronDown className={showStatusDropdown ? "rotate" : ""} />
                      </div>
                    )}
                    {showStatusDropdown && (
                      <div className="dropdown-list">
                        {["Dipinjam", "Dikembalikan"].map((st) => (
                          <div key={st} className="dropdown-item" onClick={() => handleSelectStatus(st)}>
                            {st}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isDisabled && (
                    <small className="error-text">
                      {isSedangDiperbaiki ? "Barang dalam proses servis (Tim Servis)" : "Transaksi sudah selesai (Status Dikembalikan)"}
                    </small>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Keterangan</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isDisabled}
                    rows="3"
                    className={isDisabled ? "readonly-input" : ""}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate("/app/peminjaman-pengembalian")}>
                Batal
              </button>
              <button
                type="submit"
                className="btn-save"
                onClick={handleSubmit}
                disabled={loading || isDisabled}
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EditPeminjamanPengembalian;