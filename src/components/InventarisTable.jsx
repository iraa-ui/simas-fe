// src/components/InventarisTable.jsx

import React from "react";

export default function InventarisTable({ inventaris }) {
  const columns = [
    { key: "id_barang", label: "ID Barang" },
    { key: "id_inventaris", label: "ID Inventaris" },
    { key: "nama_barang", label: "Nama Barang" },
    { key: "tipe", label: "Tipe" },
    { key: "no_inventaris", label: "No. Inventaris" },
    { key: "kondisi", label: "Kondisi" },
    { key: "status", label: "Status" },
    { key: "harga", label: "Harga" },
    { key: "spesifikasi_barang", label: "Spesifikasi" },
    { key: "keterangan", label: "Keterangan" },
    { key: "last_check_notes", label: "Notes" },
    { key: "last_check_date", label: "Tanggal Cek" },
    { key: "kode_qr", label: "Kode QR" },
  ];

  return (
    <div className="table-responsive shadow">
      <table className="table table-striped table-hover table-bordered">
        <thead className="table-dark">
          <tr>
            {columns.map(col => (
              <th key={col.key} scope="col">{col.label}</th>
            ))}
            <th scope="col" className="text-center" style={{ width: '150px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Menggunakan id_inventaris sebagai key yang unik (lebih baik dari index) */}
          {inventaris.length > 0 ? (
            inventaris.map((item) => (
              <tr key={item.id_inventaris || item.id_barang}> {/* PENTING: Gunakan ID unik di sini */}
                {columns.map(col => (
                  <td key={`${item.id_inventaris}-${col.key}`}>{item[col.key]}</td>
                ))}
                
                <td className="text-center text-nowrap">
                  <button className="btn btn-sm btn-info me-1" title="View">
                    <i className="bi bi-eye-fill"></i> 
                  </button>
                  <button className="btn btn-sm btn-warning me-1" title="Edit">
                    <i className="bi bi-pencil-square"></i> 
                  </button>
                  <button className="btn btn-sm btn-danger" title="Delete">
                    <i className="bi bi-trash-fill"></i> 
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              {/* Tampilkan pesan jika data kosong */}
              <td colSpan={columns.length + 1} className="text-center">
                Data inventaris tidak ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}