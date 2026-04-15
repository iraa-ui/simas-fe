// Pengganti axios - mengambil data dari mockData, bukan dari server

import {
  mockInventaris, mockKaryawans, mockStokBarang, mockHistoriStok,
  mockPeminjamanPengembalian, mockKendalaBarang, mockPenjualanAset, mockDashboard,
} from "./mockData";

// Database di memory - data bisa berubah selama sesi (hilang saat refresh)
let db = {
  inventaris: [...mockInventaris],
  karyawans: [...mockKaryawans],
  stok_barang: [...mockStokBarang],
  "histori-stok": [...mockHistoriStok],
  pinjamkembalis: [...mockPeminjamanPengembalian],
  "kendala-barang": [...mockKendalaBarang],
  penjualan_asset: [...mockPenjualanAset],
};

// Menentukan koleksi data berdasarkan URL
const getCollection = (url) => {
  if (url.includes("penjualan_asset")) return "penjualan_asset";
  if (url.includes("histori-stok")) return "histori-stok";
  if (url.includes("stok_barang")) return "stok_barang";
  if (url.includes("pinjamkembalis")) return "pinjamkembalis";
  if (url.includes("kendala-barang")) return "kendala-barang";
  if (url.includes("inventaris")) return "inventaris";
  if (url.includes("karyawans")) return "karyawans";
  if (url.includes("dashboard")) return "dashboard";
  return null;
};

// Mengambil ID dari URL - contoh: "/inventaris/3" menghasilkan 3
const getIdFromUrl = (url) => {
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const id = parseInt(last);
  return isNaN(id) ? null : id;
};

// Primary key tiap koleksi
const getIdKey = (collection) => ({
  inventaris: "id_inventaris",
  karyawans: "id",
  stok_barang: "id_barang",
  "histori-stok": "id_histori",
  pinjamkembalis: "id_peminjaman",
  "kendala-barang": "id_kendala",
  penjualan_asset: "id_penjualan",
}[collection] || "id");

// Mengubah FormData menjadi plain object
// File object (foto) dikonversi ke URL sementara agar bisa ditampilkan di tag img
const formDataToObject = (body) => {
  if (body instanceof FormData) {
    const obj = {};
    body.forEach((value, key) => {
      if (key === "_method") return;
      if (value instanceof File && value.size > 0) {
        obj[key] = value;
        obj["foto_url"] = URL.createObjectURL(value);
      } else {
        obj[key] = value;
      }
    });
    return obj;
  }
  return body || {};
};

// Simulasi delay jaringan agar terasa seperti request API sungguhan
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const mockApi = {

  // GET - mengambil data
  async get(url, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);

    if (collection === "dashboard") return { data: mockDashboard };

    if (url.includes("next-no") || url.includes("next_no")) {
      const maxNo = db.inventaris.length + 1;
      const no = `INV-2024-${String(maxNo).padStart(3, "0")}`;
      return { data: { next_no: no, next_no_inventaris: no, data: { no_inventaris: no } } };
    }

    if (url.includes("/histori") && collection === "inventaris") {
      return { data: { data: [], meta: { total: 0, per_page: 5, current_page: 1, last_page: 1 } } };
    }

    if (url.includes("/histori") && collection === "penjualan_asset") {
      return { data: { data: [] } };
    }

    if (!collection || !db[collection]) return { data: { data: [] } };

    const idKey = getIdKey(collection);

    // Khusus histori-stok: cari berdasarkan id_barang, bukan id_histori
    if (id && collection === "histori-stok") {
      const items = db["histori-stok"].filter((h) => h.id_barang === id);
      return { data: { data: items } };
    }

    // GET satu data berdasarkan ID
    if (id) {
      const item = db[collection].find((d) => d[idKey] === id);
      if (!item) {
        const err = new Error("Data tidak ditemukan");
        err.response = { status: 404, data: { message: "Data tidak ditemukan" } };
        throw err;
      }
      return { data: { data: item } };
    }

    // GET semua data
    return { data: { data: [...db[collection]], total: db[collection].length } };
  },

  // POST - menambah data baru
  async post(url, body, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);
    const bodyObj = formDataToObject(body);

    // POST ke URL berisi ID = update (Laravel _method PUT trick)
    if (id && collection && db[collection]) {
      const idKey = getIdKey(collection);
      const idx = db[collection].findIndex((d) => d[idKey] === id);
      if (idx !== -1) {
        db[collection][idx] = { ...db[collection][idx], ...bodyObj };
        return { data: { message: "Data berhasil diupdate", data: db[collection][idx], success: true } };
      }
    }

    if (!collection || !db[collection]) {
      return { data: { message: "Berhasil", success: true } };
    }

    const idKey = getIdKey(collection);
    const maxId = db[collection].reduce((max, item) => Math.max(max, item[idKey] || 0), 0);
    const newItem = {
      [idKey]: maxId + 1,
      id: maxId + 1,
      ...bodyObj,
      created_at: new Date().toISOString(),
    };
    db[collection].unshift(newItem);

    return { data: { message: "Data berhasil ditambahkan", data: newItem, success: true } };
  },

  // PUT - mengubah data yang sudah ada
  async put(url, body, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);
    const bodyObj = formDataToObject(body);

    if (!collection || !db[collection]) {
      return { data: { message: "Berhasil diupdate", success: true } };
    }

    const idKey = getIdKey(collection);
    const idx = db[collection].findIndex((d) => d[idKey] === id);
    if (idx !== -1) {
      db[collection][idx] = { ...db[collection][idx], ...bodyObj };
      return { data: { message: "Data berhasil diupdate", data: db[collection][idx], success: true } };
    }
    return { data: { message: "Berhasil diupdate", success: true } };
  },

  // DELETE - menghapus data
  async delete(url, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);

    if (!collection || !db[collection]) {
      return { data: { message: "Berhasil dihapus", success: true } };
    }

    const idKey = getIdKey(collection);
    const idx = db[collection].findIndex((d) => d[idKey] === id);
    if (idx !== -1) db[collection].splice(idx, 1);

    return { data: { message: "Data berhasil dihapus", success: true } };
  },
};

export default mockApi;