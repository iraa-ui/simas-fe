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

  const [formData, setFormData] = useState({
    status: "Dipinjam",
    tanggal_peminjaman: "",
    notes: "",
  });

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

  // Tentukan apakah data harus dinonaktifkan berdasarkan status
  const isDikembalikan = originalData.current_status === "Dikembalikan";
  const isDisabled = isSedangDiperbaiki || isDikembalikan;

  // Ambil data berdasarkan ID untuk di-edit
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const response = await mockApi.get(`${BASE_URL}/${id}`);
        console.log("📦 Response data edit:", response.data);

        let data = response.data.data || response.data;

        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        console.log("📝 Data yang akan di-edit:", data);

        // Format tanggal untuk input type="date" (YYYY-MM-DD)
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        // Cek status untuk menentukan apakah data bisa diedit
        const sedangDiperbaiki = data.status === "Sedang Diperbaiki";
        const dikembalikan = data.status === "Dikembalikan";
        
        setIsSedangDiperbaiki(sedangDiperbaiki);

        const formattedTanggalPeminjaman = formatDateForInput(
          data.tanggal_peminjaman
        );
        const formattedTanggalPengembalian = formatDateForInput(
          data.tanggal_pengembalian
        );
        const currentNotes = data.notes || data.keterangan || "";
        const currentStatus = data.status || "Dipinjam";

        // Simpan data original untuk ditampilkan dan komparasi
        setOriginalData({
          nama_karyawan: data.nama_karyawan || "-",
          nama_barang: data.nama_barang || "-",
          tanggal_pengembalian: formattedTanggalPengembalian,
          current_status: currentStatus,
          current_tanggal_peminjaman: formattedTanggalPeminjaman,
          current_notes: currentNotes,
        });

        // Set data yang sesuai dengan validasi BE
        setFormData({
          status: currentStatus,
          tanggal_peminjaman: formattedTanggalPeminjaman,
          notes: currentNotes,
        });

        // CEK STATUS BARANG (DIPINJAM ATAU SEDANG DIPERBAIKI OLEH KARYAWAN LAIN)
        await checkStatusBarang(data.nama_barang, data.nama_karyawan);
      } catch (error) {
        console.error("❌ Gagal mengambil data:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Gagal memuat data untuk diedit!",
          confirmButtonColor: "#3085d6",
        });
        navigate("/app/peminjaman-pengembalian");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  // FUNGSI UNTUK CEK STATUS BARANG (DIPINJAM ATAU SEDANG DIPERBAIKI)
  const checkStatusBarang = async (namaBarang, namaKaryawanSaatIni) => {
    try {
      console.log(
        `🔍 Mengecek status barang: ${namaBarang} untuk karyawan: ${namaKaryawanSaatIni}`
      );

      const response = await mockApi.get(BASE_URL);
      const allData = response.data.data || response.data;

      // Cari data terbaru untuk barang ini dengan status "Dipinjam" ATAU "Sedang Diperbaiki"
      const barangTidakTersedia = allData
        .filter((item) => {
          const itemData = Array.isArray(item) ? item[0] : item;
          const isSameBarang = itemData.nama_barang === namaBarang;
          const isDifferentKaryawan =
            itemData.nama_karyawan !== namaKaryawanSaatIni;
          const isNotAvailable =
            itemData.status === "Dipinjam" ||
            itemData.status === "Sedang Diperbaiki";

          return isSameBarang && isDifferentKaryawan && isNotAvailable;
        })
        .sort((a, b) => {
          const aData = Array.isArray(a) ? a[0] : a;
          const bData = Array.isArray(b) ? b[0] : b;
          return (
            new Date(bData.tanggal_peminjaman) -
            new Date(aData.tanggal_peminjaman)
          );
        });

      if (barangTidakTersedia.length > 0) {
        const dataTerbaru = Array.isArray(barangTidakTersedia[0])
          ? barangTidakTersedia[0][0]
          : barangTidakTersedia[0];
        console.log("🚫 Barang tidak tersedia:", dataTerbaru);

        if (dataTerbaru.status === "Dipinjam") {
          setBarangDipinjamOlehKaryawanLain(true);
          setBarangSedangDiperbaiki(false);
          setPeminjamSaatIni(dataTerbaru.nama_karyawan);
          console.log(
            `🚫 Barang sedang dipinjam oleh: ${dataTerbaru.nama_karyawan}`
          );
        } else if (dataTerbaru.status === "Sedang Diperbaiki") {
          setBarangDipinjamOlehKaryawanLain(false);
          setBarangSedangDiperbaiki(true);
          setPeminjamSaatIni(dataTerbaru.nama_karyawan);
          console.log(
            `🔧 Barang sedang diperbaiki oleh: ${dataTerbaru.nama_karyawan}`
          );
        }
      } else {
        console.log("✅ Barang tersedia untuk dipinjam");
        setBarangDipinjamOlehKaryawanLain(false);
        setBarangSedangDiperbaiki(false);
        setPeminjamSaatIni("");
      }
    } catch (error) {
      console.error("❌ Gagal mengecek status barang:", error);
    }
  };

  // Handle select status dari dropdown custom
  const handleSelectStatus = (status) => {
    if (isDisabled) {
      return;
    }

    // Validasi untuk status "Sedang Diperbaiki"
    if (originalData.current_status === "Sedang Diperbaiki") {
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Mengubah Status",
        text: "Status dengan sedang diperbaiki tidak dapat diubah karena sedang dalam proses perbaikan oleh tim servis",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Validasi untuk status "Dikembalikan"
    if (originalData.current_status === "Dikembalikan") {
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Mengubah Status",
        text: "Data dengan status dikembalikan tidak dapat diubah karena sudah menjadi transaksi mati",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (
      status === "Dipinjam" &&
      (barangDipinjamOlehKaryawanLain || barangSedangDiperbaiki)
    ) {
      let message = "";
      if (barangDipinjamOlehKaryawanLain) {
        message = `Barang ${originalData.nama_barang} sedang dipinjam oleh ${peminjamSaatIni}. Anda tidak dapat mengubah status menjadi "Dipinjam" selama barang masih dipinjam.`;
      } else if (barangSedangDiperbaiki) {
        message = `Barang ${originalData.nama_barang} sedang diperbaiki oleh tim servis. Anda tidak dapat mengubah status menjadi "Dipinjam" selama barang dalam perbaikan.`;
      }

      Swal.fire({
        icon: "warning",
        title: "Tidak Dapat Mengubah Status",
        html: message,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setFormData((prev) => ({ ...prev, status }));
    setShowStatusDropdown(false);
  };

  // Toggle dropdown status
  const toggleStatusDropdown = () => {
    if (isDisabled) return;
    
    // Validasi untuk status "Sedang Diperbaiki"
    if (originalData.current_status === "Sedang Diperbaiki") {
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Mengubah Status",
        text: "Status dengan sedang diperbaiki tidak dapat diubah karena sedang dalam proses perbaikan oleh tim servis",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Validasi untuk status "Dikembalikan"
    if (originalData.current_status === "Dikembalikan") {
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Mengubah Status",
        text: "Data dengan status dikembalikan tidak dapat diubah karena sudah menjadi transaksi mati",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (
      (barangDipinjamOlehKaryawanLain || barangSedangDiperbaiki) &&
      formData.status !== "Dipinjam"
    )
      return;

    setShowStatusDropdown(!showStatusDropdown);
  };

  // Handle perubahan tanggal peminjaman dan notes
  const handleTanggalPeminjamanChange = (e) => {
    if (isDisabled) {
      // Tampilkan pesan error sesuai status
      if (originalData.current_status === "Sedang Diperbaiki") {
        Swal.fire({
          icon: "error",
          title: "Tidak Dapat Mengubah Data",
          text: "Status dengan sedang diperbaiki tidak dapat diubah karena sedang dalam proses perbaikan oleh tim servis",
          confirmButtonColor: "#3085d6",
        });
      } else if (originalData.current_status === "Dikembalikan") {
        Swal.fire({
          icon: "error",
          title: "Tidak Dapat Mengubah Data",
          text: "Data dengan status dikembalikan tidak dapat diubah karena sudah menjadi transaksi mati",
          confirmButtonColor: "#3085d6",
        });
      }
      return;
    }
    setFormData((prev) => ({ ...prev, tanggal_peminjaman: e.target.value }));
  };

  const handleNotesChange = (e) => {
    if (isDisabled) {
      // Tampilkan pesan error sesuai status
      if (originalData.current_status === "Sedang Diperbaiki") {
        Swal.fire({
          icon: "error",
          title: "Tidak Dapat Mengubah Data",
          text: "Status dengan sedang diperbaiki tidak dapat diubah karena sedang dalam proses perbaikan oleh tim servis",
          confirmButtonColor: "#3085d6",
        });
      } else if (originalData.current_status === "Dikembalikan") {
        Swal.fire({
          icon: "error",
          title: "Tidak Dapat Mengubah Data",
          text: "Data dengan status dikembalikan tidak dapat diubah karena sudah menjadi transaksi mati",
          confirmButtonColor: "#3085d6",
        });
      }
      return;
    }
    setFormData((prev) => ({ ...prev, notes: e.target.value }));
  };

  // Handle click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".status-dropdown-container")) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update data ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDASI: Cek status "Sedang Diperbaiki"
    if (originalData.current_status === "Sedang Diperbaiki") {
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Mengubah Data",
        text: "Status dengan sedang diperbaiki tidak dapat diubah karena sedang dalam proses perbaikan oleh tim servis",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // VALIDASI: Cek status "Dikembalikan"
    if (originalData.current_status === "Dikembalikan") {
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Mengubah Data",
        text: "Data dengan status dikembalikan tidak dapat diubah karena sudah menjadi transaksi mati",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (formData.status === "Sedang Diperbaiki") {
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Mengubah Status",
        text: "Status 'Sedang Diperbaiki' hanya dapat diatur melalui kendala barang.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // VALIDASI: Cegah submit jika data dinonaktifkan
    if (isDisabled) {
      let message = "";
      if (isSedangDiperbaiki) {
        message = "Status dengan sedang diperbaiki tidak dapat diubah karena sedang dalam proses perbaikan oleh tim servis";
      } else if (isDikembalikan) {
        message = "Data dengan status dikembalikan tidak dapat diubah karena sudah menjadi transaksi mati";
      }

      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Menyimpan Perubahan",
        text: message,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (
      formData.status === "Dipinjam" &&
      (barangDipinjamOlehKaryawanLain || barangSedangDiperbaiki)
    ) {
      let message = "";
      if (barangDipinjamOlehKaryawanLain) {
        message = `Barang ${originalData.nama_barang} sedang dipinjam oleh ${peminjamSaatIni}. Anda tidak dapat mengubah status menjadi "Dipinjam" selama barang masih dipinjam.`;
      } else if (barangSedangDiperbaiki) {
        message = `Barang ${originalData.nama_barang} sedang diperbaiki oleh tim servis. Anda tidak dapat mengubah status menjadi "Dipinjam" selama barang dalam perbaikan.`;
      }

      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Menyimpan Perubahan",
        html: message,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Cek jika tidak ada perubahan
    if (
      formData.tanggal_peminjaman === originalData.current_tanggal_peminjaman &&
      formData.notes.trim() === originalData.current_notes &&
      formData.status === originalData.current_status
    ) {
      Swal.fire({
        icon: "info",
        title: "Tidak Ada Perubahan",
        text: "Tidak ada perubahan data yang disimpan.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // KONFIRMASI SEBELUM UPDATE
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Perubahan",
      text: "Apakah Anda yakin ingin mengubah data peminjaman ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan Perubahan",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("🔄 Mengupdate data dengan ID:", id);
      console.log("📝 Data yang dikirim:", formData);

      const payload = {
        status: formData.status,
        tanggal_peminjaman: formData.tanggal_peminjaman,
        notes: formData.notes,
      };

      console.log("📤 Payload sesuai validasi BE:", payload);

      await mockApi.put(`${BASE_URL}/${id}`, payload);

      navigate("/app/peminjaman-pengembalian", {
        state: {
          showSuccessAlert: true,
          successMessage: "Data peminjaman berhasil diperbarui.",
        },
      });
    } catch (error) {
      console.error("❌ Gagal update data:", error);
      console.log("📋 Response error:", error.response?.data);

      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
        const errorMessages = error.response.data.errors;
        let errorText = "Validasi gagal:\n";
        Object.keys(errorMessages).forEach((key) => {
          errorText += `- ${errorMessages[key][0]}\n`;
        });
        Swal.fire({
          icon: "error",
          title: "Validasi Gagal",
          text: errorText,
          confirmButtonColor: "#3085d6",
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Data Tidak Ditemukan",
          text: "Data tidak ditemukan!",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Kesalahan",
          text: "Terjadi kesalahan server atau jaringan!",
          confirmButtonColor: "#3085d6",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan loading saat mengambil data
  if (fetchLoading) {
    return (
      <div className="master-main-content-fixed">
        <main className="master-main-content-fixed">
          <section className="form-section">
            <div className="form-container">
              <div style={{ textAlign: "center", padding: "50px" }}>
                <h3>Memuat data...</h3>
                <p>Sedang mengambil data peminjaman</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="master-main-content-fixed">
      <main className="master-main-content-fixed">
        <section className="form-section">
          <div className="form-container">
            <h2>Edit Data Peminjaman</h2>

            <div className="section-info">
              <h3>Informasi Peminjaman</h3>
              <div className="form-grid">
                {/* Nama Karyawan (Read-only) */}
                <div className="form-group">
                  <label htmlFor="nama_karyawan" className="required">
                    Nama Karyawan
                  </label>
                  <input
                    id="nama_karyawan"
                    type="text"
                    value={originalData.nama_karyawan}
                    disabled
                    className="readonly-input"
                  />
                </div>

                {/* Nama Barang (Read-only) */}
                <div className="form-group">
                  <label htmlFor="nama_barang" className="required">
                    Nama Barang
                  </label>
                  <input
                    id="nama_barang"
                    type="text"
                    value={originalData.nama_barang}
                    disabled
                    className="readonly-input"
                  />
                </div>

                {/* Tanggal Peminjaman */}
                <div className="form-group">
                  <label htmlFor="tanggal_peminjaman" className="required">
                    Tanggal Peminjaman
                  </label>
                  <input
                    id="tanggal_peminjaman"
                    type="date"
                    name="tanggal_peminjaman"
                    value={formData.tanggal_peminjaman}
                    onChange={handleTanggalPeminjamanChange}
                    required
                    className={`${
                      errors.tanggal_peminjaman ? "error-input" : ""
                    } ${isDisabled ? "readonly-input" : ""}`}
                    disabled={isDisabled}
                  />
                  {errors.tanggal_peminjaman && (
                    <span className="error-text">
                      {errors.tanggal_peminjaman[0]}
                    </span>
                  )}
                </div>

                {/* Tanggal Pengembalian (Read-only) */}
                <div className="form-group">
                  <label htmlFor="tanggal_pengembalian" className="required">
                    Tanggal Pengembalian
                  </label>
                  <input
                    id="tanggal_pengembalian"
                    type="date"
                    value={originalData.tanggal_pengembalian}
                    disabled
                    className="readonly-input"
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Tanggal pengembalian akan diatur otomatis oleh sistem
                  </small>
                </div>

                {/* Status dengan Dropdown Custom */}
                <div className="form-group status-dropdown-container">
                  <label htmlFor="status" className="required">
                    Status
                  </label>
                  {isDisabled ? (
                    <div>
                      <input
                        id="status"
                        type="text"
                        value={formData.status}
                        disabled
                        className="readonly-input"
                      />
                      <small
                        style={{
                          color: "#dc3545",
                          fontSize: "12px",
                          display: "block",
                          marginTop: "4px",
                        }}
                      >
                        {originalData.current_status === "Sedang Diperbaiki"
                          ? "Status dengan sedang diperbaiki tidak dapat diubah karena sedang dalam proses perbaikan oleh tim servis"
                          : "Data dengan status dikembalikan tidak dapat diubah karena sudah menjadi transaksi mati"}
                      </small>
                    </div>
                  ) : (
                    <div className="search-input-container">
                      <input
                        type="text"
                        id="status"
                        value={formData.status}
                        readOnly
                        onClick={toggleStatusDropdown}
                        placeholder="Pilih status"
                        className={`${errors.status ? "error-input" : ""} ${
                          (barangDipinjamOlehKaryawanLain ||
                            barangSedangDiperbaiki) &&
                          formData.status !== "Dipinjam"
                            ? "disabled-input"
                            : ""
                        }`}
                        style={{
                          cursor:
                            (barangDipinjamOlehKaryawanLain ||
                              barangSedangDiperbaiki) &&
                            formData.status !== "Dipinjam"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      />
                      <div
                        className="dropdown-icon"
                        onClick={toggleStatusDropdown}
                        style={{
                          cursor:
                            (barangDipinjamOlehKaryawanLain ||
                              barangSedangDiperbaiki) &&
                            formData.status !== "Dipinjam"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <FaChevronDown
                          className={`dropdown-arrow ${
                            showStatusDropdown ? "rotate" : ""
                          }`}
                        />
                      </div>

                      {showStatusDropdown && (
                        <div className="dropdown-list">
                          <div
                            className={`dropdown-item ${
                              formData.status === "Dipinjam" ? "active" : ""
                            }`}
                            onClick={() => handleSelectStatus("Dipinjam")}
                          >
                            Dipinjam
                          </div>
                          <div
                            className={`dropdown-item ${
                              formData.status === "Dikembalikan" ? "active" : ""
                            }`}
                            onClick={() => handleSelectStatus("Dikembalikan")}
                          >
                            Dikembalikan
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {errors.status && (
                    <span className="error-text">{errors.status[0]}</span>
                  )}
                  {barangDipinjamOlehKaryawanLain && !isDisabled && (
                    <small
                      style={{
                        color: "#dc3545",
                        fontSize: "12px",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      Status tidak dapat diubah ke Dipinjam karena barang{" "}
                      <strong>{originalData.nama_barang}</strong> sedang
                      dipinjam oleh <strong>{peminjamSaatIni}</strong>
                    </small>
                  )}
                  {barangSedangDiperbaiki && !isDisabled && (
                    <small
                      style={{
                        color: "#dc3545",
                        fontSize: "12px",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      Status tidak dapat diubah ke Dipinjam karena barang{" "}
                      <strong>{originalData.nama_barang}</strong> sedang
                      diperbaiki oleh <strong>Tim Servis</strong>
                    </small>
                  )}
                </div>

                {/* Keterangan */}
                <div className="form-group full-width">
                  <label htmlFor="notes">Keterangan</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleNotesChange}
                    placeholder="Tuliskan catatan tambahan"
                    className={`${errors.notes ? "error-input" : ""} ${
                      isDisabled ? "readonly-input" : ""
                    }`}
                    rows="3"
                    required
                    disabled={isDisabled}
                  />
                  {errors.notes && (
                    <span className="error-text">{errors.notes[0]}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/app/peminjaman-pengembalian")}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-save"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  isDisabled ||
                  (formData.tanggal_peminjaman ===
                    originalData.current_tanggal_peminjaman &&
                    formData.notes.trim() === originalData.current_notes &&
                    formData.status === originalData.current_status) ||
                  ((barangDipinjamOlehKaryawanLain ||
                    barangSedangDiperbaiki) &&
                    formData.status === "Dipinjam")
                }
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