import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import mockApi from "../api/mockApi";
import "../styles/QrAssetDetail.css";
import LogoSimas from "../assets/topbar-logo.png";

function QrAssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssetDetail();
  }, [id]);

  const fetchAssetDetail = async () => {
    try {
      setLoading(true);
      const response = await mockApi.get(`/inventaris/${id}`);
      setAsset(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Data aset tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  const cleanUrl = (url) => (url ? url.replace(/\\\//g, "/") : null);

  const formatScanTime = () => {
    return new Date().toLocaleString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="qr-detail-container">
        <div className="loading-wrapper">
          <div className="loading-spinner"></div>
          <h2 className="loading-title">Memuat Data Aset</h2>
          <p className="loading-text">Sedang mengambil informasi detail...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-detail-container">
        <div className="error-wrapper">
          <h2 className="error-title">Gagal Memuat Data</h2>
          <p className="error-text">{error}</p>
          <button className="retry-btn" onClick={fetchAssetDetail}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="qr-detail-container">
        <div className="error-wrapper">
          <h2 className="error-title">Data Tidak Ditemukan</h2>
          <p className="error-text">
            Aset dengan ID {id} tidak ditemukan dalam sistem.
          </p>
          <button className="retry-btn" onClick={fetchAssetDetail}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-detail-container">
      {/* HEADER WITH LOGO */}
      <div className="header-bar">
        <img src={LogoSimas} className="header-logo" alt="SIMAS Logo" />
        <h1 className="header-title">Asset Detail</h1>
      </div>

      {/* Asset Card */}
      <div className="asset-card">
        {/* Asset Image */}
        <div className="image-section">
          {asset.foto_url ? (
            <img
              src={cleanUrl(asset.foto_url)}
              alt={asset.nama_barang}
              className="asset-img"
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/400x300?text=Gambar+Tidak+Tersedia";
              }}
            />
          ) : (
            <div className="no-image-box">
              <p className="no-image-text">Tidak Ada Foto</p>
            </div>
          )}
        </div>

        {/* Asset Info */}
        <div className="info-section">
          <h2 className="asset-title">{asset.nama_barang}</h2>

          {/* BADGES */}
          <div className="badge-group">
            <span
              className={`badge badge-status-${asset.status
                ?.toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {asset.status}
            </span>
            <span
              className={`badge badge-condition-${asset.kondisi?.toLowerCase()}`}
            >
              {asset.kondisi}
            </span>
          </div>

          {/* Info Grid */}
          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">Nomor Inventaris</span>
              <span className="detail-value">
                {asset.no_inventaris || "Tidak Tersedia"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Tipe Barang</span>
              <span className="detail-value">
                {asset.tipe || "Tidak Tersedia"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Harga</span>
              <span className="detail-value">{asset.formatted_harga}</span>
            </div>
          </div>

          {/* Spesifikasi */}
          {asset.spesifikasi_barang && (
            <div className="spec-box">
              <h3 className="spec-title">Spesifikasi Teknis</h3>
              <p className="spec-content">{asset.spesifikasi_barang}</p>
            </div>
          )}

          {/* Keterangan */}
          {asset.keterangan && (
            <div className="spec-box">
              <h3 className="spec-title">Keterangan Tambahan</h3>
              <p className="spec-content">{asset.keterangan}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="meta-box enhanced-meta">
            <div className="meta-row enhanced-meta-row">
              <span className="meta-label enhanced-meta-label">
                Nomor Aset:
              </span>
              <span className="meta-value enhanced-meta-value">
                {asset.id_inventaris}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="app-footer">
        <div className="footer-sub">
          <span>Powered by SIMAS © 2025</span>
          <span className="footer-dot">•</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}

export default QrAssetDetail;
