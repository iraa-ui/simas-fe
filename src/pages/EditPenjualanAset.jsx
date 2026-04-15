// src/pages/EditPenjualanAset.jsx
import React, { useState, useEffect, useMemo } from "react";
import mockApi from "../api/mockApi";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import "../styles/TambahEditPenjualanAset.css";

function EditPenjualanAset() {
  const API_BARANG = "/inventaris";
  const API_KARYAWAN = "/karyawans";
  const API_PENJUALAN =
    "/penjualan_asset";

  const navigate = useNavigate();
  const { id } = useParams();

  const [barangList, setBarangList] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);
  const [formData, setFormData] = useState({
    id_karyawan: "",
    id_inventaris: "",
    harga_jual: "",
    jumlah_terbayar: "",
    metode_pembayaran: "",
    tanggal: "",
    keterangan: "",
    status: "",
  });

  const [karyawanOptions, setKaryawanOptions] = useState([]);
  const [barangOptions, setBarangOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentStatus, setCurrentStatus] = useState("");
  const [originalData, setOriginalData] = useState(null);

  // Tambahkan state ini
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fungsi untuk mengecek perubahan data - VERSI FIXED
  const checkForChanges = () => {
    if (!originalData) return false;

    const meaningfulFields = [
      "id_karyawan",
      "id_inventaris",
      "metode_pembayaran",
      "keterangan",
      "status",
    ];

    // Cek perubahan di field meaningful (kecuali tanggal)
    const hasMeaningfulChanges = meaningfulFields.some(
      (field) => formData[field] !== originalData[field]
    );

    // Cek perubahan pembayaran
    const hasPaymentChanges =
      formData.jumlah_terbayar &&
      formData.jumlah_terbayar !== "" &&
      parseRupiah(formData.jumlah_terbayar) > 0;

    // 🔥 PERBAIKAN: Tanggal dianggap perubahan hanya jika ada nilai DAN berbeda dari original
    const hasDateChanges =
      formData.tanggal &&
      formData.tanggal !== "" &&
      formData.tanggal !== originalData.tanggal;

    console.log("CHANGES DEBUG:", {
      hasMeaningfulChanges,
      hasPaymentChanges,
      hasDateChanges,
      tanggal: formData.tanggal,
      originalTanggal: originalData.tanggal,
      jumlahTerbayar: formData.jumlah_terbayar,
    });

    // KRITERIA:
    // - Ada perubahan meaningful ATAU
    // - Ada perubahan tanggal ATAU
    // - (Ada pembayaran baru DAN tanggal sudah diisi DAN berbeda dari original)
    return (
      hasMeaningfulChanges ||
      hasDateChanges ||
      (hasPaymentChanges &&
        formData.tanggal &&
        formData.tanggal !== originalData.tanggal)
    );
  };

  // Fungsi untuk mengecek validitas form
  const checkFormValidity = () => {
    const requiredFields = [
      "id_karyawan",
      "id_inventaris",
      "harga_jual",
      "metode_pembayaran",
      "status",
      "tanggal",
    ];

    // Cek semua field wajib terisi
    const allRequiredFilled = requiredFields.every((field) => {
      if (field === "harga_jual") {
        return formData[field] && parseRupiah(formData[field]) > 0;
      }
      if (field === "tanggal") {
        return formData[field] && formData[field].toString().trim() !== "";
      }
      return formData[field] && formData[field].toString().trim() !== "";
    });

    // 🔥 PERBAIKAN: Validasi khusus berdasarkan status
    let jumlahTerbayarValid = true;
    const total = parseRupiah(formData.harga_jual) || 0;
    const pembayaranBaru = parseRupiah(formData.jumlah_terbayar) || 0;
    const totalTerbayarSebelumnya =
      parseRupiah(originalData?.jumlah_terbayar) || 0;

    if (formData.status === "lunas") {
      const totalTerbayar = totalTerbayarSebelumnya + pembayaranBaru;
      jumlahTerbayarValid = totalTerbayar >= total && pembayaranBaru > 0;
    } else if (formData.status === "belum lunas") {
      const sisaSebelumnya = total - totalTerbayarSebelumnya;

      // 🔥 PERBAIKAN: Jika ada input pembayaran, validasi harus benar
      if (pembayaranBaru > 0) {
        jumlahTerbayarValid = pembayaranBaru <= sisaSebelumnya;
      } else {
        // Jika tidak ada pembayaran baru, tetap valid (mungkin hanya update data lain)
        jumlahTerbayarValid = true;
      }
    } else if (formData.status === "dibatalkan") {
      // 🔥 PERBAIKAN: Untuk status dibatalkan, tidak perlu validasi jumlah terbayar
      jumlahTerbayarValid = true;
    }

    // Cek tidak ada error critical
    const criticalErrors = [
      "id_karyawan",
      "id_inventaris",
      "harga_jual",
      "jumlah_terbayar",
      "metode_pembayaran",
      "status",
      "tanggal",
    ];
    const hasCriticalErrors = criticalErrors.some(
      (errorField) => errors[errorField]
    );

    console.log("Form Validation Debug:", {
      allRequiredFilled,
      jumlahTerbayarValid,
      hasCriticalErrors,
      tanggal: formData.tanggal,
      jumlahTerbayar: formData.jumlah_terbayar,
    });

    return allRequiredFilled && jumlahTerbayarValid && !hasCriticalErrors;
  };

  // useEffect untuk memantau perubahan
  useEffect(() => {
    setHasChanges(checkForChanges());
    setIsFormValid(checkFormValidity());
  }, [formData, errors, originalData]);

  // Format angka ke format Rupiah - FIXED untuk handle input real-time
  const formatRupiah = (angka) => {
    if (!angka && angka !== 0) return "";

    // Konversi ke number dulu menggunakan parseRupiah untuk konsistensi
    let number;
    if (typeof angka === "string") {
      number = parseRupiah(angka);
    } else {
      number = Math.round(parseFloat(angka) || 0);
    }

    if (isNaN(number)) return "";

    return new Intl.NumberFormat("id-ID").format(number);
  };

  // Konversi dari format Rupiah ke number dengan handle yang benar
  const parseRupiah = (rupiah) => {
    if (!rupiah && rupiah !== 0) return 0;

    // Jika sudah number, return langsung (bulatkan)
    if (typeof rupiah === "number") return Math.round(rupiah);

    let cleanString = rupiah.toString();

    console.log("🔥 parseRupiah INPUT:", rupiah);

    // Handle format database vs format Rupiah dengan benar
    if (cleanString.includes(".")) {
      const parts = cleanString.split(".");

      // Jika bagian setelah titik panjangnya <= 2, itu format database (desimal)
      if (parts.length > 1 && parts[1].length <= 2) {
        // Format database: "10000.00" -> ambil bagian integer sebelum titik
        cleanString = parts[0];
        console.log(
          "🔥 Format database terdeteksi, ambil bagian integer:",
          cleanString
        );
      } else {
        // Format Rupiah: "10.000" -> hapus semua titik (pemisah ribuan)
        cleanString = cleanString.replace(/\./g, "");
        console.log("🔥 Format Rupiah terdeteksi, hapus titik:", cleanString);
      }
    } else {
      // Tidak ada titik, langsung hapus non-digit
      cleanString = cleanString.replace(/[^\d]/g, "");
    }

    // Parse integer dan bulatkan
    const result = Math.round(parseInt(cleanString) || 0);

    console.log("🔥 parseRupiah DEBUG:", {
      input: rupiah,
      cleanString: cleanString,
      output: result,
    });

    return result;
  };

  // Load data yang akan di-edit
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load data barang dan karyawan
        const [barangResponse, karyawanResponse] = await Promise.all([
          mockApi.get(API_BARANG),
          mockApi.get(API_KARYAWAN),
        ]);

        setBarangList(barangResponse.data.data || []);
        setKaryawanList(karyawanResponse.data.data || []);

        // Prepare options untuk react-select
        setKaryawanOptions(
          karyawanResponse.data.data.map((karyawan) => ({
            value: karyawan.id,
            label: karyawan.nama,
          }))
        );

        setBarangOptions(
          barangResponse.data.data.map((barang) => ({
            value: barang.id_inventaris,
            label: barang.nama_barang,
            data: barang,
          }))
        );

        // Load data penjualan yang akan di-edit
        const penjualanResponse = await mockApi.get(`${API_PENJUALAN}/${id}`);
        const dataToEdit =
          penjualanResponse.data.data || penjualanResponse.data;

        console.log("Data dari API untuk edit:", dataToEdit);

        // Simpan data asli dan status awal
        setOriginalData(dataToEdit);
        setCurrentStatus(dataToEdit.status);

        // Format data dengan handle data dari database
        setFormData({
          id_karyawan: dataToEdit.id_karyawan || "",
          id_inventaris: dataToEdit.id_inventaris || "",
          // Handle data database yang berupa string dengan desimal
          harga_jual: formatRupiah(dataToEdit.harga_jual) || "",
          jumlah_terbayar: "", // RESET jumlah terbayar untuk cicilan baru
          metode_pembayaran: dataToEdit.metode_pembayaran || "",
          tanggal: dataToEdit.tanggal ? dataToEdit.tanggal.split("T")[0] : "",
          keterangan: dataToEdit.keterangan || "",
          status: dataToEdit.status || "",
        });

        setInitialLoading(false);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        alert("Gagal memuat data untuk diedit");
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Hitung sisa pembayaran dengan logika yang benar
  const calculateSisa = () => {
    const total = parseRupiah(formData.harga_jual) || 0;
    const pembayaranBaru = parseRupiah(formData.jumlah_terbayar) || 0;

    console.log("🔥 DEBUG calculateSisa:", {
      totalHarga: formData.harga_jual,
      parsedTotal: total,
      jumlahBayar: formData.jumlah_terbayar,
      parsedBayar: pembayaranBaru,
      originalData: originalData,
      originalJumlahTerbayar: originalData?.jumlah_terbayar,
      status: formData.status,
    });

    // Untuk semua status, hitung dari total terbayar (sebelumnya + baru)
    if (originalData) {
      // Parse data dari database yang mungkin string dengan desimal
      const totalTerbayarSebelumnya =
        parseRupiah(originalData.jumlah_terbayar) || 0;

      console.log("🔥 DEBUG totalTerbayarSebelumnya:", {
        raw: originalData.jumlah_terbayar,
        parsed: totalTerbayarSebelumnya,
      });

      // Tentukan total terbayar berdasarkan status
      let totalTerbayar;

      if (formData.status === "belum lunas") {
        // Untuk status "belum lunas": total terbayar = yang sudah dibayar + pembayaran baru
        totalTerbayar = totalTerbayarSebelumnya + pembayaranBaru;
      } else if (formData.status === "lunas") {
        // Untuk status "lunas": total terbayar = total harga (bayar semua)
        totalTerbayar = total;
      } else {
        // Untuk status lainnya (dibatalkan): hanya pembayaran baru
        totalTerbayar = pembayaranBaru;
      }

      // Gunakan Math.max untuk pastikan integer dan tidak negatif
      const sisa = Math.max(0, total - totalTerbayar);

      console.log("🔥 DEBUG cicilan FIXED:", {
        totalTerbayarSebelumnya: originalData.jumlah_terbayar,
        parsedTerbayarSebelumnya: totalTerbayarSebelumnya,
        pembayaranBaru: pembayaranBaru,
        totalTerbayar: totalTerbayar,
        sisa: sisa,
        calculation: `${total} - ${totalTerbayar} = ${sisa}`,
      });

      return sisa;
    }

    // Fallback jika tidak ada originalData
    const sisa = Math.max(0, total - pembayaranBaru);
    console.log("🔥 DEBUG normal:", { total, pembayaranBaru, sisa });
    return sisa;
  };

  // Gunakan useMemo untuk optimasi perhitungan sisa
  const sisaPembayaran = useMemo(
    () => calculateSisa(),
    [
      formData.harga_jual,
      formData.jumlah_terbayar,
      formData.status,
      originalData,
    ]
  );

  // Validasi real-time dengan useEffect terpisah
  useEffect(() => {
    if (formData.status === "dibatalkan") {
      if (errors.jumlah_terbayar) {
        setErrors((prev) => ({ ...prev, jumlah_terbayar: "" }));
      }
      return;
    }

    if (formData.jumlah_terbayar && originalData) {
      const total = parseRupiah(formData.harga_jual) || 0;
      const pembayaranBaru = parseRupiah(formData.jumlah_terbayar) || 0;
      const totalTerbayarSebelumnya =
        parseRupiah(originalData.jumlah_terbayar) || 0;
      const sisaSebelumnya = Math.max(0, total - totalTerbayarSebelumnya);

      console.log("🔥 DEBUG validasi real-time:", {
        total,
        pembayaranBaru,
        totalTerbayarSebelumnya,
        sisaSebelumnya,
        status: formData.status,
      });

      // Validasi untuk semua status: pembayaran baru tidak boleh melebihi sisa sebelumnya
      if (pembayaranBaru > sisaSebelumnya) {
        setErrors((prev) => ({
          ...prev,
          jumlah_terbayar: `Pembayaran tidak boleh melebihi sisa: Rp ${formatRupiah(
            sisaSebelumnya
          )}`,
        }));
      } else if (pembayaranBaru <= 0 && formData.status === "lunas") {
        // 🔥 PERBAIKAN: Hanya validasi > 0 untuk status lunas
        setErrors((prev) => ({
          ...prev,
          jumlah_terbayar: "Pembayaran harus lebih dari 0",
        }));
      } else if (
        errors.jumlah_terbayar?.includes(
          "Pembayaran tidak boleh melebihi sisa"
        ) ||
        errors.jumlah_terbayar?.includes("Pembayaran harus lebih dari 0")
      ) {
        setErrors((prev) => ({ ...prev, jumlah_terbayar: "" }));
      }
    }
  }, [
    formData.jumlah_terbayar,
    formData.status,
    formData.harga_jual,
    originalData,
  ]);

  // Handler untuk react-select karyawan
  const handleKaryawanChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      id_karyawan: selectedOption ? selectedOption.value : "",
    }));

    if (errors.id_karyawan) {
      setErrors((prev) => ({ ...prev, id_karyawan: "" }));
    }
  };

  // Handler untuk react-select barang
  const handleBarangChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      id_inventaris: selectedOption ? selectedOption.value : "",
    }));

    if (errors.id_inventaris) {
      setErrors((prev) => ({ ...prev, id_inventaris: "" }));
    }
  };

  // HandleChange tanpa validasi yang menyebabkan re-render
  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedFormData = {
      ...formData,
      [name]: value,
    };

    // Handle input number dengan format Rupiah - FIXED
    if (name === "harga_jual" || name === "jumlah_terbayar") {
      // Untuk input real-time, kita perlu format saat user mengetik
      // Tapi jangan format ulang jika sudah dalam format Rupiah yang benar
      if (value && value !== "") {
        // Parse dulu ke number, lalu format ke Rupiah
        const numericValue = parseRupiah(value);
        updatedFormData[name] = formatRupiah(numericValue);
      } else {
        updatedFormData[name] = "";
      }
    }

    // Logic khusus untuk status
    if (name === "status") {
      if (value === "lunas") {
        // Auto-set jumlah_terbayar = sisa pembayaran
        const total = parseRupiah(formData.harga_jual) || 0;
        const totalTerbayarSebelumnya =
          parseRupiah(originalData?.jumlah_terbayar) || 0;
        const sisaSebelumnya = Math.max(0, total - totalTerbayarSebelumnya);

        updatedFormData.jumlah_terbayar = formatRupiah(sisaSebelumnya);
      } else if (value === "belum lunas") {
        // Reset jumlah_terbayar untuk cicilan baru
        updatedFormData.jumlah_terbayar = "";
      } else if (value === "dibatalkan") {
        // 🔥 PERBAIKAN: Set jumlah_terbayar ke 0 dan clear error
        updatedFormData.jumlah_terbayar = "0";
        if (errors.jumlah_terbayar) {
          setErrors((prev) => ({ ...prev, jumlah_terbayar: "" }));
        }
      }
    }

    setFormData(updatedFormData);

    // Clear error untuk field yang sedang diubah
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Fungsi untuk menentukan apakah field harus disabled berdasarkan status
  const isFieldDisabled = (fieldName) => {
    // Untuk status LUNAS, lock field tertentu
    if (currentStatus === "lunas") {
      if (
        [
          "status",
          "jumlah_terbayar",
          "metode_pembayaran",
          "tanggal",
          "harga_jual",
        ].includes(fieldName)
      ) {
        return true;
      }
    }

    // Untuk status DIBATALKAN, lock semua field
    if (currentStatus === "dibatalkan") {
      return true;
    }

    // Karyawan, barang, dan harga_jual biasanya tidak bisa diubah setelah dibuat
    if (
      fieldName === "id_karyawan" ||
      fieldName === "id_inventaris" ||
      fieldName === "harga_jual"
    ) {
      return true;
    }

    return false;
  };

  // Fungsi untuk menentukan opsi status yang tersedia
  const getAvailableStatusOptions = () => {
    if (currentStatus === "lunas" || currentStatus === "dibatalkan") {
      return [
        {
          value: currentStatus,
          label: currentStatus === "lunas" ? "Lunas" : "Dibatalkan",
        },
      ];
    } else if (currentStatus === "belum lunas" || currentStatus === "cicilan") {
      return [
        { value: "belum lunas", label: "Belum Lunas" },
        { value: "cicilan", label: "Cicilan" },
        { value: "lunas", label: "Lunas" },
        { value: "dibatalkan", label: "Dibatalkan" },
      ];
    }
    return [
      { value: "belum lunas", label: "Belum Lunas" },
      { value: "cicilan", label: "Cicilan" },
      { value: "lunas", label: "Lunas" },
      { value: "dibatalkan", label: "Dibatalkan" },
    ];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validasi client-side
    const newErrors = {};

    if (!formData.id_karyawan)
      newErrors.id_karyawan = "Pilih karyawan terlebih dahulu";
    if (!formData.id_inventaris)
      newErrors.id_inventaris = "Pilih barang terlebih dahulu";
    if (!formData.harga_jual || parseRupiah(formData.harga_jual) <= 0)
      newErrors.harga_jual = "Harga jual harus diisi dan lebih dari 0";
    if (!formData.metode_pembayaran)
      newErrors.metode_pembayaran = "Pilih metode pembayaran";
    if (!formData.status) newErrors.status = "Status harus diisi";
    if (!formData.tanggal) newErrors.tanggal = "Tanggal harus diisi";

    // 🔥 PERBAIKAN: Validasi khusus berdasarkan status
    if (formData.status === "lunas") {
      const total = parseRupiah(formData.harga_jual) || 0;
      const dibayar = parseRupiah(formData.jumlah_terbayar) || 0;
      const totalTerbayarSebelumnya =
        parseRupiah(originalData?.jumlah_terbayar) || 0;
      const totalTerbayar = totalTerbayarSebelumnya + dibayar;

      if (totalTerbayar < total) {
        newErrors.jumlah_terbayar = `Untuk status Lunas, total pembayaran harus mencapai total harga. Sisa: Rp ${formatRupiah(
          total - totalTerbayarSebelumnya
        )}`;
      }
    } else if (formData.status === "belum lunas") {
      const total = parseRupiah(formData.harga_jual) || 0;
      const pembayaranBaru = parseRupiah(formData.jumlah_terbayar) || 0;
      const totalTerbayarSebelumnya =
        parseRupiah(originalData?.jumlah_terbayar) || 0;
      const sisaSebelumnya = total - totalTerbayarSebelumnya;

      // 🔥 PERBAIKAN: Hanya validasi jika ada input pembayaran
      if (pembayaranBaru > 0) {
        if (pembayaranBaru > sisaSebelumnya) {
          newErrors.jumlah_terbayar = `Pembayaran tidak boleh melebihi sisa: Rp ${formatRupiah(
            sisaSebelumnya
          )}`;
        }
      }
      // Untuk status belum lunas, pembayaran baru tidak wajib (bisa hanya update data lain)
    }
    // 🔥 PERBAIKAN: Untuk status "dibatalkan", TIDAK ADA validasi jumlah_terbayar

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 🔥 KONFIRMASI PERUBAHAN
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Perubahan",
      text: "Apakah Anda yakin ingin mengubah data penjualan ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Simpan Perubahan",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);

    // Format data sebelum dikirim
    const dataToSend = {
      id_karyawan: formData.id_karyawan,
      id_inventaris: formData.id_inventaris,
      harga_jual: parseRupiah(formData.harga_jual),
      // Untuk status "belum lunas", jumlah_terbayar adalah cicilan baru
      // Untuk status "lunas", jumlah_terbayar adalah sisa yang harus dibayar
      jumlah_terbayar: parseRupiah(formData.jumlah_terbayar),
      metode_pembayaran: formData.metode_pembayaran,
      tanggal: formData.tanggal,
      keterangan: formData.keterangan,
      status: formData.status,
    };

    console.log("Data yang dikirim ke API:", dataToSend);

    mockApi
      .put(`${API_PENJUALAN}/${id}`, dataToSend)
      .then((response) => {
        // 🔥 REDIRECT KE PENJUALAN ASET DENGAN PARAMETER
        navigate("/app/penjualan-aset?action=updated");
      })
      .catch((err) => {
        console.error("Gagal update data:", err);
        const errorMessage = err.response?.data?.message || err.message;

        if (
          errorMessage.includes(
            "Jumlah dibayar tidak boleh melebihi total harga"
          ) &&
          formData.status === "dibatalkan"
        ) {
          // Coba lagi dengan jumlah_terbayar = 0
          const fixedData = { ...dataToSend, jumlah_terbayar: 0 };
          mockApi
            .put(`${API_PENJUALAN}/${id}`, fixedData)
            .then((response) => {
              // 🔥 REDIRECT KE PENJUALAN ASET DENGAN PARAMETER
              navigate("/app/penjualan-aset?action=updated");
            })
            .catch((err2) => {
              Swal.fire({
                icon: "error",
                title: "Gagal Memperbarui!",
                text:
                  "Terjadi kesalahan saat update data: " +
                  (err2.response?.data?.message || err2.message),
              });
              setLoading(false);
            });
        } else if (err.response?.data?.errors) {
          const backendErrors = err.response.data.errors;
          setErrors(backendErrors);
          Swal.fire({
            icon: "error",
            title: "Validasi Gagal",
            text: "Terjadi kesalahan validasi data",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal Memperbarui!",
            text: "Terjadi kesalahan saat update data: " + errorMessage,
          });
          setLoading(false);
        }
      })
      .finally(() => setLoading(false));
  };

  // Tentukan apakah jumlah bayar harus disabled
  const isJumlahBayarDisabled =
    formData.status === "lunas" ||
    currentStatus === "lunas" ||
    currentStatus === "dibatalkan";

  const statusOptions = getAvailableStatusOptions();

  // Custom styles untuk react-select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused
        ? "#3b82f6"
        : errors.id_karyawan || errors.id_inventaris
        ? "#dc3545"
        : "#d1d5db",
      "&:hover": {
        borderColor: state.isFocused
          ? "#3b82f6"
          : errors.id_karyawan || errors.id_inventaris
          ? "#dc3545"
          : "#d1d5db",
      },
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      minHeight: "42px",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 1000,
    }),
  };

  return (
    <div className="create-container">
      <div className="form-card">
        <h2>Edit Data Penjualan Aset</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Informasi Penjualan</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Nama Karyawan <span className="required-star">*</span>
                </label>
                <Select
                  options={karyawanOptions}
                  value={karyawanOptions.find(
                    (option) => option.value === parseInt(formData.id_karyawan)
                  )}
                  onChange={handleKaryawanChange}
                  placeholder="-- Pilih Karyawan --"
                  isSearchable
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={customStyles}
                  isDisabled={isFieldDisabled("id_karyawan")}
                  noOptionsMessage={({ inputValue }) =>
                    inputValue
                      ? "Karyawan tidak ditemukan"
                      : "Tidak ada data karyawan"
                  }
                />
                {errors.id_karyawan && (
                  <span className="error-message">{errors.id_karyawan}</span>
                )}
                {isFieldDisabled("id_karyawan") && (
                  <small className="input-hint">
                    Data karyawan tidak dapat diubah
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Nama Barang <span className="required-star">*</span>
                </label>
                <Select
                  options={barangOptions}
                  value={barangOptions.find(
                    (option) => option.value === parseInt(formData.id_inventaris)
                  )}
                  onChange={handleBarangChange}
                  placeholder="-- Pilih Barang --"
                  isSearchable
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={customStyles}
                  isDisabled={isFieldDisabled("id_inventaris")}
                  noOptionsMessage={({ inputValue }) =>
                    inputValue
                      ? "Barang tidak ditemukan"
                      : "Tidak ada barang tersedia"
                  }
                />
                {errors.id_inventaris && (
                  <span className="error-message">{errors.id_inventaris}</span>
                )}
                {isFieldDisabled("id_inventaris") && (
                  <small className="input-hint">
                    Data barang tidak dapat diubah
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Total Harga <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="harga_jual"
                  placeholder="Contoh: 1.500.000"
                  value={formData.harga_jual}
                  onChange={handleChange}
                  required
                  disabled={isFieldDisabled("harga_jual")}
                  className={errors.harga_jual ? "error" : ""}
                />
                {errors.harga_jual && (
                  <span className="error-message">{errors.harga_jual}</span>
                )}
                <small className="input-hint">
                  {isFieldDisabled("harga_jual")
                    ? "Harga hanya bisa diubah di menu inventaris"
                    : "Harga total barang"}
                </small>
              </div>

              <div className="form-group">
                <label>
                  Status Penjualan <span className="required-star">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className={errors.status ? "error" : ""}
                  disabled={isFieldDisabled("status")}
                >
                  <option value="">-- Pilih Status --</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <span className="error-message">{errors.status}</span>
                )}
                {currentStatus === "lunas" && (
                  <small className="input-hint" style={{ color: "#dc3545" }}>
                    Status LUNAS tidak dapat diubah
                  </small>
                )}
                {currentStatus === "dibatalkan" && (
                  <small className="input-hint" style={{ color: "#dc3545" }}>
                    Status DIBATALKAN tidak dapat diubah
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>
                  {formData.status === "belum lunas"
                    ? "Tambah Pembayaran"
                    : formData.status === "dibatalkan"
                    ? "Jumlah Dibayar" // 🔥 PERBAIKAN: Label untuk status dibatalkan
                    : "Jumlah Dibayar"}{" "}
                  <span className="required-star">
                    {formData.status === "dibatalkan" ? "" : "*"}{" "}
                    {/* 🔥 PERBAIKAN: Tidak required untuk dibatalkan */}
                  </span>
                </label>
                <input
                  type="text"
                  name="jumlah_terbayar"
                  placeholder={
                    formData.status === "belum lunas"
                      ? "Masukkan cicilan baru (contoh: 200.000)"
                      : formData.status === "dibatalkan"
                      ? "Otomatis 0 untuk status dibatalkan" // 🔥 PERBAIKAN: Placeholder khusus
                      : "Contoh: 500.000"
                  }
                  value={formData.jumlah_terbayar}
                  onChange={handleChange}
                  required={formData.status !== "dibatalkan"} // 🔥 PERBAIKAN: Tidak required untuk dibatalkan
                  disabled={
                    isJumlahBayarDisabled || formData.status === "dibatalkan"
                  } // 🔥 PERBAIKAN: Disable untuk dibatalkan
                  className={errors.jumlah_terbayar ? "error" : ""}
                />
                {errors.jumlah_terbayar && (
                  <span className="error-message">
                    {errors.jumlah_terbayar}
                  </span>
                )}
                <small className="input-hint">
                  {formData.status === "lunas"
                    ? `Auto sesuai sisa pembayaran: Total (${formatRupiah(
                        formData.harga_jual
                      )}) - Terbayar (${formatRupiah(
                        originalData?.jumlah_terbayar || 0
                      )}) = Rp ${formatRupiah(
                        (parseRupiah(formData.harga_jual) || 0) -
                          (parseRupiah(originalData?.jumlah_terbayar) || 0)
                      )}`
                    : formData.status === "belum lunas"
                    ? `Total sudah dibayar: Rp ${formatRupiah(
                        originalData?.jumlah_terbayar || 0
                      )} - Masukkan cicilan baru`
                    : formData.status === "dibatalkan"
                    ? "Untuk status dibatalkan, jumlah bayar otomatis 0" // 🔥 PERBAIKAN: Hint khusus
                    : "Masukkan jumlah yang sudah dibayar"}
                </small>
              </div>

              {/* Sisa Pembayaran - TIDAK REQUIRED */}
              <div className="form-group">
                <label>Sisa Pembayaran</label>
                <input
                  type="text"
                  value={`Rp ${formatRupiah(sisaPembayaran)}`}
                  disabled
                  className="sisa-input"
                />
                <small className="input-hint">
                  {formData.status === "belum lunas"
                    ? `Sisa setelah cicilan ini: Total - (Terbayar + Cicilan Baru)`
                    : "Auto calculate: Total - Jumlah Bayar"}
                </small>
              </div>

              <div className="form-group">
                <label>
                  Metode Pembayaran <span className="required-star">*</span>
                </label>
                <select
                  name="metode_pembayaran"
                  value={formData.metode_pembayaran}
                  onChange={handleChange}
                  required
                  className={errors.metode_pembayaran ? "error" : ""}
                  disabled={isFieldDisabled("metode_pembayaran")}
                >
                  <option value="">-- Pilih Metode --</option>
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer</option>
                </select>
                {errors.metode_pembayaran && (
                  <span className="error-message">
                    {errors.metode_pembayaran}
                  </span>
                )}
                {isFieldDisabled("metode_pembayaran") && (
                  <small className="input-hint">
                    Metode pembayaran tidak dapat diubah untuk status LUNAS
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Tanggal <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  required
                  className={errors.tanggal ? "error" : ""}
                  disabled={isFieldDisabled("tanggal")}
                />
                {errors.tanggal && (
                  <span className="error-message">{errors.tanggal}</span>
                )}
                <small className="input-hint">Tanggal transaksi</small>
                {isFieldDisabled("tanggal") && (
                  <small className="input-hint">
                    Tanggal tidak dapat diubah untuk status LUNAS
                  </small>
                )}
              </div>

              {/* Keterangan - TIDAK REQUIRED */}
              <div className="form-group full-width">
                <label>Keterangan</label>
                <textarea
                  name="keterangan"
                  placeholder="Tuliskan keterangan tambahan (opsional)"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/app/penjualan-aset")}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={
                loading ||
                !isFormValid ||
                !hasChanges ||
                currentStatus === "dibatalkan"
              }
              style={{
                backgroundColor:
                  loading ||
                  !isFormValid ||
                  !hasChanges ||
                  currentStatus === "dibatalkan"
                    ? "#9ca3af"
                    : "#3b82f6",
                color:
                  loading ||
                  !isFormValid ||
                  !hasChanges ||
                  currentStatus === "dibatalkan"
                    ? "#6b7280"
                    : "white",
                cursor:
                  loading ||
                  !isFormValid ||
                  !hasChanges ||
                  currentStatus === "dibatalkan"
                    ? "not-allowed"
                    : "pointer",
                borderColor:
                  loading ||
                  !isFormValid ||
                  !hasChanges ||
                  currentStatus === "dibatalkan"
                    ? "#d1d5db"
                    : "#3b82f6",
                opacity:
                  loading ||
                  !isFormValid ||
                  !hasChanges ||
                  currentStatus === "dibatalkan"
                    ? 0.6
                    : 1,
              }}
            >
              {loading ? "Menyimpan..." : "Update Penjualan"}
            </button>
          </div>

          {currentStatus === "dibatalkan" && (
            <div className="warning-message">
              <strong>
                Transaksi yang sudah DIBATALKAN tidak dapat diupdate.
              </strong>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditPenjualanAset;