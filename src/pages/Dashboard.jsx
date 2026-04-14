import React, { useState, useEffect } from "react";
import mockApi from "../api/mockApi";
import "../styles/Dashboard.css";
import SellIcon from "@mui/icons-material/Sell";
import StorageIcon from "@mui/icons-material/Storage";
import {
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import UpdateIcon from "@mui/icons-material/Update";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import "../styles/Dashboard.css";
import "../styles/fix-dashboard-layout.css";

// ===== Configuration =====
// API_URL dihapus - sudah pakai mockApi
const COLORS = ["#60A5FA", "#93C5FD", "#FCA5A5"];

// ===== Components =====
const StatCard = ({ title, value, icon, loading, subtitle }) => (
  <Card className="stat-card">
    <CardContent>
      <div className="stat-card-header">
        {icon}
        <span>{title}</span>
      </div>
      <div className="stat-card-value">
        {loading ? <CircularProgress size={24} /> : value}
      </div>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const PanelCard = ({ title, icon, children, loading, action }) => (
  <Card className="panel-card">
    <CardContent>
      <div className="panel-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon}
          <span>{title}</span>
        </div>
        {action}
      </div>
      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "20px" }}
        >
          <CircularProgress />
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

const PieChartCard = ({ data, loading }) => (
  <PanelCard title="Status Aset" icon={<Inventory2Icon />} loading={loading}>
    {data && data.length > 0 ? (
      <div className="pie-chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
        Tidak ada data status aset
      </div>
    )}
  </PanelCard>
);

// ===== Main Component =====
function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

    // TAMBAHKAN useEffect untuk mengatur body class
  useEffect(() => {
    // Tambahkan class ke body
    document.body.classList.add('dashboard-page');
    
    // Cleanup: hapus class saat komponen unmount
    return () => {
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [retryCount]);

  useEffect(() => {
    fetchDashboardData();
  }, [retryCount]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[mockApi] Fetching dashboard data...");

      const response = await mockApi.get("/dashboard");
      const data = response.data;

      setDashboardData(data);
      console.log("Dashboard data loaded successfully:", data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      let errorMessage = `Gagal memuat data dashboard: ${err.message}`;

      if (err.message.includes("500")) {
        errorMessage =
          "Server error (500). Silakan coba beberapa saat lagi atau hubungi administrator.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Format data untuk pie chart status aset
  const getPieChartData = () => {
    if (!dashboardData?.status_aset) return [];

    const { status_aset } = dashboardData;
    return [
      { name: "Tersedia", value: status_aset.tersedia || 0 },
      { name: "Dipinjam", value: status_aset.dipinjam || 0 },
      { name: "Rusak", value: status_aset.rusak || 0 },
    ];
  };

  // Format data untuk bar chart aktivitas mingguan
  const getBarChartData = () => {
    if (!dashboardData?.aktivitas_mingguan) return [];

    return dashboardData.aktivitas_mingguan.map((item) => ({
      name: new Date(item.tanggal).toLocaleDateString("id-ID", {
        weekday: "short",
      }),
      total: item.total || 0,
    }));
  };

  // Format data aset populer
  const getAsetPopuler = () => {
    if (!dashboardData?.aset_populer) return [];

    return dashboardData.aset_populer.map((item) => ({
      id: item.id_inventaris,
      name: item.nama_barang,
      value: `Dipinjam ${item.total}x`,
      total: item.total,
    }));
  };

  // Format data stok menipis
  const getStokMenipis = () => {
    if (!dashboardData?.stok_menipis) return [];

    return dashboardData.stok_menipis.map((item) => ({
      id: item.id_barang,
      name: item.nama_barang,
      value: `Sisa ${item.kuantitas} unit`,
      kuantitas: item.kuantitas,
      kategori: item.kategori,
    }));
  };

  // Format data histori stok terbaru
  const getHistoriStokTerbaru = () => {
    if (!dashboardData?.histori_stok_terbaru) return [];

    return dashboardData.histori_stok_terbaru.map((item) => ({
      id: item.id_histori,
      name: item.nama_barang,
      tipe: item.tipe,
      jumlah: item.jumlah,
      tanggal: new Date(item.tanggal_kejadian).toLocaleDateString("id-ID"),
      keterangan: item.keterangan,
    }));
  };

  // Get tipe color untuk histori stok
  const getTipeColor = (tipe) => {
    switch (tipe?.toLowerCase()) {
      case "masuk":
        return "success";
      case "keluar":
        return "error";
      case "adjustment":
        return "warning";
      default:
        return "default";
    }
  };

  if (error) {
    return (
      <div className="dashboard-container">
        <Alert
          severity="error"
          style={{ margin: "20px 0" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
            >
              Coba Lagi
            </Button>
          }
        >
          <Typography variant="h6">Gagal Memuat Dashboard</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1>Dashboard</h1>
          </div>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            {loading ? "Memuat..." : "Refresh"}
          </Button>
        </div>
      </header>

      {/* Statistics Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Aset"
            value={dashboardData?.total_aset?.toLocaleString() || "0"}
            icon={<InventoryIcon />}
            loading={loading}
            subtitle="Semua barang inventaris"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Karyawan"
            value={dashboardData?.total_karyawan?.toLocaleString() || "0"}
            icon={<PeopleIcon />}
            loading={loading}
            subtitle="Karyawan terdaftar"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Stok"
            value={dashboardData?.total_stok_barang?.toLocaleString() || "0"}
            icon={<StorageIcon />}
            loading={loading}
            subtitle="Jumlah jenis barang"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aset Dipinjam"
            value={dashboardData?.aset_dipinjam?.toLocaleString() || "0"}
            icon={<LocalShippingIcon />}
            loading={loading}
            subtitle="Sedang dipinjam"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Barang Terjual"
            value={dashboardData?.total_barang_terjual?.toLocaleString() || "0"}
            icon={<SellIcon />}
            loading={loading}
            subtitle="Total penjualan asset"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Kendala Aktif"
            value={dashboardData?.kendala_aktif?.toLocaleString() || "0"}
            icon={<WarningIcon />}
            loading={loading}
            subtitle="Perlu perhatian"
          />
        </Grid>
      </Grid>

      {/* Charts and Lists */}
      <Grid container spacing={3} style={{ marginTop: "20px" }}>
        <Grid item xs={12} lg={6}>
          {/* Aset Populer */}
          <PanelCard
            title="Aset Populer"
            icon={<TrendingUpIcon />}
            loading={loading}
          >
            <List dense>
              {getAsetPopuler().length > 0 ? (
                getAsetPopuler().map((a, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={a.name} secondary={a.value} />
                    <Chip
                      label={`#${i + 1}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <IconButton>
                      <ChevronRightIcon />
                    </IconButton>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="Tidak ada data aset populer"
                    secondary="Belum ada aktivitas peminjaman"
                  />
                </ListItem>
              )}
            </List>
          </PanelCard>

          {/* Aktivitas 7 Hari Terakhir */}
          <PanelCard
            title="Aktivitas 7 Hari Terakhir"
            icon={<UpdateIcon />}
            loading={loading}
          >
            <div className="bar-chart-container">
              {getBarChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getBarChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="total"
                      fill="#1976d2"
                      name="Total Aktivitas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                  }}
                >
                  Tidak ada aktivitas dalam 7 hari terakhir
                </div>
              )}
            </div>
          </PanelCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          {/* Pie Chart Status Aset */}
          <PieChartCard data={getPieChartData()} loading={loading} />

          {/* Barang Stok Menipis */}
          <PanelCard
            title="Barang Stok Menipis"
            icon={<WarningIcon />}
            loading={loading}
          >
            <List dense>
              {getStokMenipis().length > 0 ? (
                getStokMenipis().map((s, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={s.name} secondary={s.value} />
                    <IconButton>
                      <ChevronRightIcon />
                    </IconButton>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="Tidak ada stok menipis"
                    secondary="Semua stok dalam kondisi aman"
                  />
                </ListItem>
              )}
            </List>
          </PanelCard>
        </Grid>
      </Grid>

      <footer className="dashboard-footer">
        &copy; 2025 Inventory Dashboard. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;
