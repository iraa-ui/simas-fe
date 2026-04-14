import {
  mockInventaris, mockKaryawans, mockStokBarang, mockHistoriStok,
  mockPeminjamanPengembalian, mockKendalaBarang, mockPenjualanAset, mockDashboard,
} from "./mockData";

// Database lokal di memory - bisa tambah/hapus/edit selama session
let db = {
  inventaris: [...mockInventaris],
  karyawans: [...mockKaryawans],
  stok_barang: [...mockStokBarang],
  "histori-stok": [...mockHistoriStok],
  pinjamkembalis: [...mockPeminjamanPengembalian],
  "kendala-barang": [...mockKendalaBarang],
  penjualan_asset: [...mockPenjualanAset],
};

// Tentukan koleksi dari URL
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

// Ambil ID dari URL: "/inventaris/3" → 3
const getIdFromUrl = (url) => {
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const id = parseInt(last);
  return isNaN(id) ? null : id;
};

// Key ID tiap koleksi
const getIdKey = (collection) => ({
  inventaris: "id_inventaris",
  karyawans: "id",
  stok_barang: "id_barang",
  "histori-stok": "id_histori",
  pinjamkembalis: "id_peminjaman",
  "kendala-barang": "id_kendala",
  penjualan_asset: "id_penjualan",
}[collection] || "id");

// Konversi FormData ke plain object
const formDataToObject = (body) => {
  if (body instanceof FormData) {
    const obj = {};
    body.forEach((value, key) => { if (key !== "_method") obj[key] = value; });
    return obj;
  }
  return body || {};
};

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const mockApi = {

  // ─── GET ────────────────────────────────────────────────
  async get(url, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);
    console.log(`[mockApi GET] ${url}`);

    // Dashboard
    if (collection === "dashboard") return { data: mockDashboard };

    // Next no inventaris
    if (url.includes("next-no") || url.includes("next_no")) {
      const maxNo = db.inventaris.length + 1;
      const no = `INV-2024-${String(maxNo).padStart(3, "0")}`;
      return { data: { next_no: no, next_no_inventaris: no, data: { no_inventaris: no } } };
    }

    // Histori inventaris: /inventaris/:id/histori
    if (url.includes("/histori") && collection === "inventaris") {
      return { data: { data: [], meta: { total: 0, per_page: 5, current_page: 1, last_page: 1 } } };
    }

    // Histori penjualan: /penjualan_asset/:id/histori
    if (url.includes("/histori") && collection === "penjualan_asset") {
      return { data: { data: [] } };
    }

    if (!collection || !db[collection]) return { data: { data: [] } };

    const idKey = getIdKey(collection);

    // Special: histori-stok by ID → filter by id_barang (bukan id_histori)
    if (id && collection === "histori-stok") {
      const items = db["histori-stok"].filter((h) => h.id_barang === id);
      return { data: { data: items } };
    }

    // GET by ID → { data: { data: item } }
    if (id) {
      const item = db[collection].find((d) => d[idKey] === id);
      if (!item) {
        const err = new Error("Data tidak ditemukan");
        err.response = { status: 404, data: { message: "Data tidak ditemukan" } };
        throw err;
      }
      return { data: { data: item } };
    }

    // GET semua → { data: { data: [...], total: N } }
    return { data: { data: [...db[collection]], total: db[collection].length } };
  },

  // ─── POST ───────────────────────────────────────────────
  async post(url, body, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);
    const bodyObj = formDataToObject(body);

    console.log(`[mockApi POST] ${url}`, bodyObj);

    // Kalau POST ke URL dengan ID (Laravel _method=PUT trick) → update
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

    // Tambah data baru
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

  // ─── PUT ────────────────────────────────────────────────
  async put(url, body, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);
    const bodyObj = formDataToObject(body);
    console.log(`[mockApi PUT] ${url}`, bodyObj);

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

  // ─── DELETE ─────────────────────────────────────────────
  async delete(url, config) {
    await delay();
    const collection = getCollection(url);
    const id = getIdFromUrl(url);
    console.log(`[mockApi DELETE] ${url}`);

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
