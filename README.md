# FinFlow — Aplikasi Pengatur Keuangan Web & Mobile

FinFlow adalah platform manajemen keuangan personal modern berbasis **Web** dan **Mobile (Flutter Android & iOS)** dengan arsitektur **Hybrid (Offline-First Local Database + Cloud Database Synchronization)**.

---

## 🌟 Fitur Utama

- **Offline-First & Instant Access**: Catat transaksi, buat anggaran, dan lihat laporan tanpa ketergantungan koneksi internet. Data tersimpan di database lokal perangkat (SQLite / IndexedDB).
- **Sinkronisasi Otomatis & Aman (Cloud Sync)**: Begitu koneksi aktif, data tersinkronisasi secara dua arah (bidirectional delta sync) dengan cloud database, lengkap dengan resolusi konflik.
- **Konsistensi Multi-Platform**: Pengalaman pengguna dan data identik di Web (desktop & tablet) maupun Mobile (Android & iOS).
- **Desain Modern & Non-Slop**: Mengadopsi prinsip desain anti-slop: tipografi jelas, kontras aksesibel, tata letak fungsional tanpa animasi berlebihan atau visual generik.
- **Perencanaan Anggaran & Visualisasi Pengeluaran**: Monitoring alokasi anggaran, ringkasan per kategori, tren keuangan bulanan, dan peringatan batas pengeluaran.

---

## 🏛️ Struktur Monorepo Proyek

```plaintext
finflow/
├── .github/                  # CI/CD Workflows (GitHub Actions)
│   └── workflows/ci.yml
├── apps/
│   ├── web/                  # Web Application (Next.js / React + Tailwind CSS)
│   └── mobile/               # Mobile Application (Flutter for Android & iOS)
├── packages/
│   ├── shared/               # Shared Domain Models, Types, dan Protokol Sinkronisasi
│   └── server/               # Cloud Sync Engine & API Service
├── docs/                     # Dokumentasi Teknis Lengkap
│   ├── ARCHITECTURE.md       # Arsitektur Hybrid & Sinkronisasi
│   ├── DATABASE_SCHEMA.md    # Skema Database Lokal & Cloud
│   ├── SYNC_SPECIFICATION.md # Protokol & Resolusi Konflik Sinkronisasi
│   └── ROADMAP.md            # Rencana Kerja Bertahap
├── scripts/                  # Skrip Helper untuk Development & Deployment
├── .editorconfig             # Standar Format Kode Antar-Editor
├── .env.example              # Template Variabel Lingkungan
├── .gitignore                # Aturan Pengabaian File Git
├── package.json              # Konfigurasi Monorepo Root (NPM Workspaces)
├── tsconfig.base.json        # Base Konfigurasi TypeScript
└── README.md                 # Dokumentasi Utama Proyek
```

---

## 🚀 Panduan Memulai Cepat

### Prasyarat
1. **Node.js** (v20+) dan npm/pnpm.
2. **Flutter SDK** (v3.19+) untuk pengembangan aplikasi mobile.
3. **Git** untuk version control.

### Instalasi Repositori
```bash
# Clone repositori
git clone <url-repository>
cd finflow

# Pasang dependensi monorepo
npm install
```

---

## 📋 Tahapan Pengerjaan Proyek

Proyek ini dikembangkan secara disiplin dan bertahap melalui tiga fase utama:
1. **Tahap 1 – Persiapan File dan Folder**: Penyusunan arsitektur direktori, konfigurasi environment, Git, dan dokumentasi awal. *(Status: Selesai)*
2. **Tahap 2 – Instalasi Tools dan Skills**: Konfigurasi Anti-Slop, Ponytail, Vercel skills, dan perkakas pendukung.
3. **Tahap 3 – Pengembangan Project**: Perencanaan detail, perancangan database, implementasi UI/UX, engine sinkronisasi hybrid, testing, dan deployment.
