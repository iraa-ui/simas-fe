import React from "react";

export default function Peminjaman_pengembalian({ data }) {
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID");
  };

  return (
    <div className="card col-3 shadow" style={{ padding: "10px", marginTop: "5px" }}>
      <div><strong>Nama Peminjam:</strong> {data.nama_peminjam || data.id_peminjaman || "-"}</div>
      <div><strong>Nama Karyawan:</strong> {data.nama_karyawan || data.id_karyawan || "-"}</div>
      <div><strong>Nama Barang:</strong> {data.nama_barang || data.id_inventaris || "-"}</div>
      <div><strong>Tanggal Peminjaman:</strong> {formatDate(data.tanggal_peminjaman)}</div>
      <div><strong>Tanggal Pengembalian:</strong> {formatDate(data.tanggal_pengembalian)}</div>
      <div><strong>Keterangan:</strong> {data.keterangan || data.notes || "-"}</div>
      <div><strong>Status:</strong> {data.status || "-"}</div>
      <div><strong>Dibuat:</strong> {formatDate(data.created_at)}</div>
      <div><strong>Diperbarui:</strong> {formatDate(data.updated_at)}</div>
    </div>
  );
}
