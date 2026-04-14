import React from "react";

export default function Inventaris({ inventaris }) {
  return (
    <div className="card col-3 shadow">
      <div>
        <strong>ID Inventaris :</strong>
        {inventaris.id_inventaris}
      </div>
      <div>
        <strong>Nama Barang :</strong>
        {inventaris.nama_barang}
      </div>
      <div>
        <strong>Tipe :</strong>
        {inventaris.tipe}
      </div>
      <div>
        <strong>No Inventaris :</strong>
        {inventaris.no_inventaris}
      </div>
      <div>
        <strong>Kondisi :</strong>
        {inventaris.kondisi}
      </div>
      <div>
        <strong>Status :</strong>
        {inventaris.status}
      </div>
      <div>
        <strong>Harga :</strong>
        {inventaris.harga}
      </div>
      <div>
        <strong>Spesifikasi Barang :</strong>
        {inventaris.spesifikasi_barang}
      </div>
      <div>
        <strong>Keterangan :</strong>
        {inventaris.keterangan}
      </div>
      <div>
        <strong>Foto :</strong>
        {inventaris.foto}
      </div>
      <div>
        <strong>Created_at :</strong>
        {inventaris.created_at}
      </div>
      <div>
        <strong>Updated_at :</strong>
        {inventaris.updated_at}
      </div>
    </div>
  );
}
