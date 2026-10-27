# MediQueue — Hospital Patient Registration & Queue Management System

[![Laravel](https://img.shields.io/badge/Laravel-11%2B-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite / PostgreSQL](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)

**MediQueue** adalah sistem pendaftaran pasien rumah sakit dan manajemen antrean poliklinik modern kelas enterprise yang dirancang khusus untuk kebutuhan portofolio Full-Stack Developer profesional. Aplikasi ini mengintegrasikan alur operasional loket pendaftaran rawat jalan, kuota jadwal dokter, antrean pemanggilan interaktif dengan lonceng suara (chime) & suara bahasa Indonesia, cetak karcis thermal, hingga rekapitulasi analitik kunjungan.

---

## 🌟 Fitur Utama

### 1. Autentikasi & Otorisasi Berbasis Peran (RBAC)
- **3 Peran Pengguna**:
  - `Admin`: Kelola master poliklinik, dokter, jadwal & kuota, manajemen akun pengguna, dan laporan.
  - `Petugas Pendaftaran`: Pendaftaran pasien baru, booking kunjungan, cetak karcis antrean thermal, pembaharuan status.
  - `Dokter`: Monitoring antrean poliklinik sendiri, pemanggilan pasien, konsultasi medis (In Progress -> Completed).
- **1-Click Quick Demo Login**: Tombol demo di halaman login untuk beralih peran instan saat presentasi/penilaian portofolio.
- **Demo Switcher Header**: Penguji dapat mengganti role kapan saja langsung dari header tanpa logout manual.

### 2. Rekam Medis Pasien (Patient Records)
- Pembuatan **Nomor Rekam Medis (NRM) Otomatis, Unik, dan Permanen** (contoh: `RM-2026-00001`).
- Pencarian cerdas debounced berdasarkan NRM, nama lengkap, NIK, atau nomor telepon.
- Pencegahan pendaftaran ganda (duplicate check) dengan validasi kombinasi nama & tanggal lahir.
- Profil pasien lengkap dengan linimasa riwayat seluruh kunjungan poliklinik terdahulu.

### 3. Pendaftaran Kunjungan & Transaksi Kuota
- Formulir pendaftaran multi-langkah: Pencarian pasien, pemilihan poliklinik, tanggal kunjungan, jadwal dokter, dan jenis kunjungan (Umum / Kontrol).
- Perhitungan sisa kuota harian dokter secara realtime.
- **Database Transaction dengan Row-Level Locking**: Mencegah race condition nomor antrean ganda dan kelebihan kuota saat booking simultan.
- Format nomor antrean harian per poliklinik (contoh: `A-001`, `A-002` untuk Poli Umum; `B-001` untuk Poli Gigi).

### 4. Meja Kendali Antrean & Suara Panggilan Interaktif
- Tab filter status antrean: *Semua, Menunggu, Dipanggil, Sedang Dilayani, Selesai, Dibatalkan*.
- **Panggilan Bersuara (Audio Chime & Speech Synthesis)**: Lonceng nada bandara/rumah sakit (Ding-Dong 2-tone) menggunakan *Web Audio API* diikuti suara pemanggilan bahasa Indonesia (*Web Speech API*):
  > *"Nomor antrean A 0 0 1, silakan menuju Poliklinik Umum."*
- Transisi status tervalidasi di backend: `waiting` ➔ `called` ➔ `in_progress` ➔ `completed` (atau `cancelled` dengan alasan administratif).

### 5. Layar Monitor Antrean Ruang Tunggu (Public TV Kiosk)
- Dapat diakses langsung pada route publik `/display` (full-screen TV mode).
- Menampilkan nomor antrean yang baru dipanggil secara menonjol dengan nama pasien yang disamarkan (*privacy masking*: `Joko W***`).
- Papan monitor 5 poliklinik aktif dengan nomor yang sedang dilayani, jumlah antrean menunggu, dan jumlah kunjungan selesai.
- Jam digital realtime dan running marquee teks info rumah sakit.

### 6. Bukti Pendaftaran (Thermal Queue Slip)
- Tampilan karcis antrean format struk thermal 80mm modern dengan logo rumah sakit, barcode demo, identitas pasien, poli & dokter, jam estimasi, dan petunjuk kedatangan.
- Print stylesheet khusus `@media print` sehingga saat dicetak, header browser dan dashboard otomatis tersembunyi rapi.

### 7. Laporan & Visualisasi Analitik (Recharts)
- Ringkasan metrik total pendaftaran, kunjungan selesai, dibatalkan, dan rasio sukses.
- Grafik tren kunjungan 14-30 hari (Area Chart) dan distribusi poliklinik (Donut/Pie Chart).
- Filter rentang tanggal fleksibel (Hari ini, 7 hari, 30 hari, kustom).
- Tabel rekapitulasi produktivitas per poliklinik dan per dokter.
- **Ekspor Data ke CSV/Excel** langsung dari backend.

---

## 🏗️ Arsitektur & Teknologi

```
├── backend/                  # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/  # Auth, Dashboard, Pasien, Poliklinik, Dokter, Jadwal, Pendaftaran, Antrean, Laporan, User
│   │   ├── Http/Middleware/       # RoleMiddleware (RBAC)
│   │   └── Models/                # Eloquent Models & Relasi
│   ├── database/
│   │   ├── migrations/            # 9 Skema tabel termigrasi
│   │   ├── seeders/               # 50+ Pasien, 10 Dokter, 5 Poli, 350+ Riwayat Kunjungan
│   │   └── database.sqlite        # SQLite local zero-config database
│   ├── routes/api.php             # 40 endpoint API RESTful
│   └── tests/Feature/             # Automated PHPUnit Feature Tests
│
├── frontend/                 # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/            # UI kit, Layout (Sidebar, Header), PrintableSlip
│   │   ├── context/               # AuthContext & Session Provider
│   │   ├── lib/                   # API Client, Chime & Speech Synthesis, Utils
│   │   ├── pages/                 # Login, Dashboard, Pasiens, PendaftaranBaru, Antrean, Display TV, Master Data, Laporan
│   │   └── types/                 # TypeScript interfaces
│   ├── tailwind.config.js         # MediQueue Design System tokens
│   └── package.json
│
├── docker-compose.yml        # Konfigurasi deployment produksi PostgreSQL
└── start.bat                 # Script 1-klik jalankan frontend & backend di Windows
```

---

## ⚡ Panduan Menjalankan Proyek Secara Lokal

### Prasyarat
- PHP 8.3+ dan Composer
- Node.js 18+ dan npm

### Opsi A: Menggunakan Script Windows (Paling Mudah)
Cukup jalankan file `start.bat`:
```cmd
start.bat
```
Script akan otomatis membuka jendela terminal untuk **Backend API (port 8000)** dan **Frontend Vite (port 5173)**.

---

### Opsi B: Menjalankan Manual per Direktori

#### 1. Menjalankan Backend (Laravel)
```bash
cd backend
composer install
php artisan migrate:fresh --seed
php artisan serve --port=8000
```
Backend API akan aktif di: `http://localhost:8000/api`

#### 2. Menjalankan Frontend (React + Vite)
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Buka browser Anda di: `http://localhost:5173`

---

## 🔑 Akun Demo Siap Pakai

Anda dapat langsung mengklik tombol **Quick Demo Login** pada halaman Login, atau menggunakan kredensial berikut:

| Peran (Role) | Email | Password | Hak Akses Utama |
|---|---|---|---|
| **Administrator** | `admin@mediqueue.test` | `password` | Master Poli, Dokter, Jadwal, Pengguna, Laporan, Dashboard |
| **Petugas Pendaftaran** | `petugas@mediqueue.test` | `password` | Pendaftaran Pasien, Booking Kunjungan, Antrean, Cetak Karcis |
| **Petugas Loket 2** | `bagus@mediqueue.test` | `password` | Pendaftaran Pasien, Booking Kunjungan, Antrean |
| **Dokter Poli Dalam** | `dr.ahmad@mediqueue.test` | `password` | Panggilan Antrean Pasien Poli Dalam, Pelayanan Konsultasi |
| **Dokter Poli Anak** | `dr.sarah@mediqueue.test` | `password` | Panggilan Antrean Pasien Poli Anak, Pelayanan Konsultasi |
| **Dokter Gigi** | `dr.maya@mediqueue.test` | `password` | Panggilan Antrean Pasien Poli Gigi, Pelayanan Konsultasi |

---

## 🧪 Pengujian Otomatis (Automated Testing)

Jalankan test suite backend:
```bash
cd backend
php artisan test
```
*Seluruh feature test (5 test cases, 30 assertions) mencakup health check, quick demo login, validasi NRM unik pasien, pembuatan transaksi antrean berkunci, dan layar antrean TV berhasil 100% lolos (PASSED).*

---

## 🐳 Opsi Deployment Docker & PostgreSQL

Untuk menjalankan aplikasi dalam container Docker dengan database PostgreSQL:
```bash
docker compose up -d
```
Konfigurasi file `docker-compose.yml`, `backend/Dockerfile`, dan koneksi PostgreSQL Alpine telah disediakan dan siap digunakan.

---

## 📄 Lisensi
Proyek ini dibuat untuk keperluan portofolio pengembangan aplikasi web Full-Stack modern berstandar industri kesehatan.
