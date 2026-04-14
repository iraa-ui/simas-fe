// ============================================================
// FILE: src/api/mockData.js
// Gudang semua data dummy aplikasi SIMAS
//
// PENTING: field harus PERSIS sama dengan yang dipakai di halaman!
// Contoh: halaman Karyawans cek item.status === "active"
//         → maka di sini harus "active", bukan "aktif"
// ============================================================

// --- DATA KARYAWAN ---
// status: "active" / "inactive" (sesuai yang dicek di Karyawans.jsx)
export const mockKaryawans = [
  { id: 1, nama: "Budi Santoso", nip: "KRY-001", jabatan: "Staff IT", divisi: "Teknologi Informasi", no_telp: "081234567890", email: "budi@simas.com", status: "active", created_at: "2024-01-10T08:00:00Z" },
  { id: 2, nama: "Siti Rahayu", nip: "KRY-002", jabatan: "Manager HRD", divisi: "Sumber Daya Manusia", no_telp: "081298765432", email: "siti@simas.com", status: "active", created_at: "2024-01-12T08:00:00Z" },
  { id: 3, nama: "Ahmad Fauzi", nip: "KRY-003", jabatan: "Staff Keuangan", divisi: "Keuangan", no_telp: "085612345678", email: "ahmad@simas.com", status: "active", created_at: "2024-02-01T08:00:00Z" },
  { id: 4, nama: "Dewi Lestari", nip: "KRY-004", jabatan: "Staff Gudang", divisi: "Logistik", no_telp: "087812345678", email: "dewi@simas.com", status: "active", created_at: "2024-02-15T08:00:00Z" },
  { id: 5, nama: "Rizki Pratama", nip: "KRY-005", jabatan: "Supervisor", divisi: "Operasional", no_telp: "081312345678", email: "rizki@simas.com", status: "inactive", created_at: "2024-03-01T08:00:00Z" },
];

// --- DATA INVENTARIS (MASTER ASET) ---
export const mockInventaris = [
  { id_inventaris: 1, no_inventaris: "INV-2024-001", nama_barang: "Laptop Dell Latitude 5520", kategori: "Elektronik", merk: "Dell", kondisi: "Baik", status: "Tersedia", lokasi: "Ruang IT", harga_perolehan: 15000000, tanggal_perolehan: "2024-01-15", foto_barang: null, keterangan: "Laptop untuk staff IT", created_at: "2024-01-15T08:00:00Z" },
  { id_inventaris: 2, no_inventaris: "INV-2024-002", nama_barang: "Monitor LG 24 inch", kategori: "Elektronik", merk: "LG", kondisi: "Baik", status: "Dipinjam", lokasi: "Ruang Keuangan", harga_perolehan: 3500000, tanggal_perolehan: "2024-01-20", foto_barang: null, keterangan: "Monitor eksternal", created_at: "2024-01-20T08:00:00Z" },
  { id_inventaris: 3, no_inventaris: "INV-2024-003", nama_barang: "Printer Canon G2020", kategori: "Elektronik", merk: "Canon", kondisi: "Rusak", status: "Tersedia", lokasi: "Ruang HRD", harga_perolehan: 2200000, tanggal_perolehan: "2024-02-01", foto_barang: null, keterangan: "Perlu servis", created_at: "2024-02-01T08:00:00Z" },
  { id_inventaris: 4, no_inventaris: "INV-2024-004", nama_barang: "Kursi Ergonomis", kategori: "Furnitur", merk: "Ergoflex", kondisi: "Baik", status: "Tersedia", lokasi: "Ruang Kerja A", harga_perolehan: 1800000, tanggal_perolehan: "2024-02-10", foto_barang: null, keterangan: "", created_at: "2024-02-10T08:00:00Z" },
  { id_inventaris: 5, no_inventaris: "INV-2024-005", nama_barang: "Proyektor Epson EB-X41", kategori: "Elektronik", merk: "Epson", kondisi: "Baik", status: "Dipinjam", lokasi: "Ruang Meeting", harga_perolehan: 8500000, tanggal_perolehan: "2024-03-01", foto_barang: null, keterangan: "Untuk presentasi", created_at: "2024-03-01T08:00:00Z" },
  { id_inventaris: 6, no_inventaris: "INV-2024-006", nama_barang: "Meja Kerja Besi", kategori: "Furnitur", merk: "Olympic", kondisi: "Baik", status: "Tersedia", lokasi: "Ruang Kerja B", harga_perolehan: 1200000, tanggal_perolehan: "2024-03-15", foto_barang: null, keterangan: "", created_at: "2024-03-15T08:00:00Z" },
];

// --- DATA STOK BARANG ---
export const mockStokBarang = [
  { id_barang: 1, kode_barang: "STK-001", nama_barang: "Kertas HVS A4 80gr", kategori: "ATK", satuan: "Rim", kuantitas: 5, harga_satuan: 55000, lokasi_penyimpanan: "Gudang A", keterangan: "Stok menipis", created_at: "2024-01-01T08:00:00Z" },
  { id_barang: 2, kode_barang: "STK-002", nama_barang: "Tinta Printer Canon", kategori: "ATK", satuan: "Botol", kuantitas: 12, harga_satuan: 85000, lokasi_penyimpanan: "Gudang A", keterangan: "", created_at: "2024-01-05T08:00:00Z" },
  { id_barang: 3, kode_barang: "STK-003", nama_barang: "Baterai AA", kategori: "Elektronik", satuan: "Pack", kuantitas: 3, harga_satuan: 30000, lokasi_penyimpanan: "Gudang B", keterangan: "Stok menipis", created_at: "2024-01-10T08:00:00Z" },
  { id_barang: 4, kode_barang: "STK-004", nama_barang: "Spidol Whiteboard", kategori: "ATK", satuan: "Kotak", kuantitas: 20, harga_satuan: 45000, lokasi_penyimpanan: "Gudang A", keterangan: "", created_at: "2024-01-15T08:00:00Z" },
  { id_barang: 5, kode_barang: "STK-005", nama_barang: "Amplop Coklat Besar", kategori: "ATK", satuan: "Pak", kuantitas: 50, harga_satuan: 20000, lokasi_penyimpanan: "Gudang A", keterangan: "", created_at: "2024-01-20T08:00:00Z" },
];

// --- DATA HISTORI STOK ---
export const mockHistoriStok = [
  { id_histori: 1, id_barang: 1, nama_barang: "Kertas HVS A4 80gr", tipe: "masuk", jumlah: 10, tanggal_kejadian: "2024-04-01T09:00:00Z", keterangan: "Pembelian bulanan" },
  { id_histori: 2, id_barang: 1, nama_barang: "Kertas HVS A4 80gr", tipe: "keluar", jumlah: 5, tanggal_kejadian: "2024-04-05T10:00:00Z", keterangan: "Pemakaian operasional" },
  { id_histori: 3, id_barang: 2, nama_barang: "Tinta Printer Canon", tipe: "masuk", jumlah: 6, tanggal_kejadian: "2024-04-07T08:30:00Z", keterangan: "Restok" },
  { id_histori: 4, id_barang: 3, nama_barang: "Baterai AA", tipe: "keluar", jumlah: 2, tanggal_kejadian: "2024-04-08T11:00:00Z", keterangan: "Pemakaian remote" },
];

// --- DATA PEMINJAMAN PENGEMBALIAN ---
// tanggal_peminjaman (bukan tanggal_pinjam) sesuai EditPeminjamanPengembalian.jsx
export const mockPeminjamanPengembalian = [
  { id_peminjaman: 1, id: 1, id_karyawan: 1, nama_karyawan: "Budi Santoso", id_inventaris: 2, nama_barang: "Monitor LG 24 inch", no_inventaris: "INV-2024-002", tanggal_peminjaman: "2024-04-01", tanggal_pengembalian: null, tanggal_kembali_rencana: "2024-04-30", tanggal_kembali_aktual: null, status: "Dipinjam", notes: "Untuk keperluan kerja dari rumah", keterangan: "Untuk keperluan kerja dari rumah", created_at: "2024-04-01T08:00:00Z" },
  { id_peminjaman: 2, id: 2, id_karyawan: 2, nama_karyawan: "Siti Rahayu", id_inventaris: 5, nama_barang: "Proyektor Epson EB-X41", no_inventaris: "INV-2024-005", tanggal_peminjaman: "2024-04-05", tanggal_pengembalian: "2024-04-09", tanggal_kembali_rencana: "2024-04-10", tanggal_kembali_aktual: "2024-04-09", status: "Dikembalikan", notes: "Untuk presentasi klien", keterangan: "Untuk presentasi klien", created_at: "2024-04-05T08:00:00Z" },
  { id_peminjaman: 3, id: 3, id_karyawan: 3, nama_karyawan: "Ahmad Fauzi", id_inventaris: 1, nama_barang: "Laptop Dell Latitude 5520", no_inventaris: "INV-2024-001", tanggal_peminjaman: "2024-04-08", tanggal_pengembalian: null, tanggal_kembali_rencana: "2024-04-15", tanggal_kembali_aktual: null, status: "Dipinjam", notes: "Laptop utama sedang servis", keterangan: "Laptop utama sedang servis", created_at: "2024-04-08T08:00:00Z" },
];

// --- DATA KENDALA BARANG ---
// PENTING: pakai "status" (bukan status_kendala), "tanggal_kendala" (bukan tanggal_lapor)
// id field ditambah agar item.id bekerja di tabel
export const mockKendalaBarang = [
  { id_kendala: 1, id: 1, id_peminjaman: 1, id_karyawan: 1, nama_karyawan: "Budi Santoso", id_inventaris: 2, nama_barang: "Monitor LG 24 inch", jenis_kendala: "Rusak", deskripsi_kendala: "Layar berkedip-kedip saat digunakan", status: "In progress", tanggal_kendala: "2024-04-10", tanggal_selesai: null, created_at: "2024-04-10T10:00:00Z" },
  { id_kendala: 2, id: 2, id_peminjaman: 2, id_karyawan: 2, nama_karyawan: "Siti Rahayu", id_inventaris: 5, nama_barang: "Proyektor Epson EB-X41", jenis_kendala: "Kehilangan Aksesoris", deskripsi_kendala: "Remote control proyektor hilang", status: "Closed", tanggal_kendala: "2024-04-09", tanggal_selesai: "2024-04-11", created_at: "2024-04-09T14:00:00Z" },
  { id_kendala: 3, id: 3, id_peminjaman: 3, id_karyawan: 4, nama_karyawan: "Dewi Lestari", id_inventaris: 3, nama_barang: "Printer Canon G2020", jenis_kendala: "Tidak Berfungsi", deskripsi_kendala: "Printer tidak bisa mencetak, paper jam terus-menerus", status: "Open", tanggal_kendala: "2024-04-12", tanggal_selesai: null, created_at: "2024-04-12T09:00:00Z" },
];

// --- DATA PENJUALAN ASET ---
// status: "lunas"/"cicilan" lowercase, field "tanggal" (bukan tanggal_jual)
// jumlah_terbayar harus ada untuk kalkulasi sisa pembayaran
export const mockPenjualanAset = [
  { id_penjualan: 1, id_inventaris: 3, nama_barang: "Printer Canon G2020", no_inventaris: "INV-2024-003", id_karyawan: 2, nama: "Siti Rahayu", nama_pembeli: "Siti Rahayu", harga_jual: 1000000, jumlah_terbayar: 1000000, tanggal: "2024-04-15", tanggal_jual: "2024-04-15", status: "lunas", metode_pembayaran: "Transfer", keterangan: "Dijual karena kondisi rusak", created_at: "2024-04-15T10:00:00Z" },
  { id_penjualan: 2, id_inventaris: 6, nama_barang: "Meja Kerja Besi", no_inventaris: "INV-2024-006", id_karyawan: 5, nama: "Rizki Pratama", nama_pembeli: "Rizki Pratama", harga_jual: 600000, jumlah_terbayar: 300000, tanggal: "2024-04-20", tanggal_jual: "2024-04-20", status: "cicilan", metode_pembayaran: "Cash", keterangan: "Aset tidak terpakai", created_at: "2024-04-20T10:00:00Z" },
];

// --- DATA DASHBOARD ---
export const mockDashboard = {
  total_aset: mockInventaris.length,
  total_karyawan: mockKaryawans.length,
  total_stok_barang: mockStokBarang.length,
  aset_dipinjam: mockInventaris.filter((i) => i.status === "Dipinjam").length,
  total_barang_terjual: mockPenjualanAset.length,
  kendala_aktif: mockKendalaBarang.filter((k) => k.status !== "Closed").length,
  status_aset: {
    tersedia: mockInventaris.filter((i) => i.status === "Tersedia").length,
    dipinjam: mockInventaris.filter((i) => i.status === "Dipinjam").length,
    rusak: mockInventaris.filter((i) => i.kondisi === "Rusak").length,
  },
  aset_populer: [
    { id_inventaris: 5, nama_barang: "Proyektor Epson EB-X41", total: 8 },
    { id_inventaris: 1, nama_barang: "Laptop Dell Latitude 5520", total: 5 },
    { id_inventaris: 2, nama_barang: "Monitor LG 24 inch", total: 3 },
  ],
  stok_menipis: mockStokBarang.filter((s) => s.kuantitas <= 5).map((s) => ({
    id_barang: s.id_barang, nama_barang: s.nama_barang, kuantitas: s.kuantitas, kategori: s.kategori,
  })),
  aktivitas_mingguan: [
    { tanggal: "2024-04-05", total: 3 },
    { tanggal: "2024-04-06", total: 1 },
    { tanggal: "2024-04-07", total: 5 },
    { tanggal: "2024-04-08", total: 2 },
    { tanggal: "2024-04-09", total: 4 },
    { tanggal: "2024-04-10", total: 0 },
    { tanggal: "2024-04-11", total: 2 },
  ],
  histori_stok_terbaru: mockHistoriStok.map((h) => ({
    id_histori: h.id_histori, nama_barang: h.nama_barang, tipe: h.tipe,
    jumlah: h.jumlah, tanggal_kejadian: h.tanggal_kejadian, keterangan: h.keterangan,
  })),
};
