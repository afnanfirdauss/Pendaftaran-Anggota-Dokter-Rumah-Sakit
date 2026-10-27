import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine current page title based on route
  const getPageInfo = (path: string) => {
    switch (path) {
      case '/':
        return { title: 'Dashboard Operasional', subtitle: 'Ikhtisar kunjungan dan antrean poliklinik hari ini' };
      case '/pasiens':
        return { title: 'Data Rekam Medis Pasien', subtitle: 'Pencarian, pendaftaran, dan pengelolaan berkas pasien' };
      case '/pendaftaran-baru':
        return { title: 'Pendaftaran Kunjungan Baru', subtitle: 'Pendaftaran pasien rawat jalan & pemilihan dokter poli' };
      case '/antrean':
        return { title: 'Manajemen Antrean Poliklinik', subtitle: 'Monitor, panggilan, dan pembaharuan status antrean' };
      case '/polikliniks':
        return { title: 'Master Data Poliklinik', subtitle: 'Kelola unit layanan poliklinik dan kode antrean' };
      case '/dokters':
        return { title: 'Master Data Dokter', subtitle: 'Kelola data tenaga medis dan spesialisasi' };
      case '/jadwals':
        return { title: 'Jadwal Praktik & Kuota', subtitle: 'Atur jadwal dokter, hari praktik, dan kapasitas kuota harian' };
      case '/laporan':
        return { title: 'Laporan & Rekapitulasi Kunjungan', subtitle: 'Analisis statistik performa poliklinik dan dokter' };
      case '/users':
        return { title: 'Manajemen Akun Pengguna', subtitle: 'Kelola hak akses administrator, petugas loket, dan dokter' };
      default:
        if (path.startsWith('/pasiens/')) {
          return { title: 'Detail Rekam Medis Pasien', subtitle: 'Riwayat kunjungan dan data demografis pasien' };
        }
        return { title: 'MediQueue', subtitle: 'Sistem Pendaftaran Pasien Rumah Sakit' };
    }
  };

  const { title, subtitle } = getPageInfo(location.pathname);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
