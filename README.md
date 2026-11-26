# CashWise — Smart Financial Management Platform

CashWise adalah aplikasi pengatur keuangan modern berbasis **Web** dan **Mobile (Flutter untuk Android & iOS)** dengan arsitektur **Hybrid (Offline-First Local Database + Cloud Database Synchronization)**.

---

## 🌟 Konsep Utama & Visi Proyek

1. **Aplikasi Multi-Platform:**
   - **Web Application:** Akses via desktop & tablet (dashboard, analitik visual, ekspor laporan).
   - **Mobile Application (Flutter):** Pencatatan transaksi kilat harian, integrasi rekening/dompet, antarmuka sentuh responsif Android & iOS.
2. **Arsitektur Hybrid & Offline-First:**
   - Aplikasi dapat digunakan **100% tanpa koneksi internet**.
   - Data dicatat dan disimpan secara instan di database lokal perangkat (SQLite di Mobile, IndexedDB di Web).
3. **Sinkronisasi Otomatis & Konsisten:**
   - Sinkronisasi latar belakang otomatis aktif seketika internet tersedia.
   - Menggunakan mekanisme *bidirectional delta sync*, deteksi konflik berbasis *versioning & vector clocks*, serta *idempotent mutations*.
   - Data antara Web dan Mobile selalu akurat dan konsisten.

---

## 🏛️ Struktur Direktori Proyek

```plaintext
cashwise/
├── .agents/                   # Custom skills & agent guidelines
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI Workflow
├── backend/                   # Backend Cloud Service & Sync Engine (API REST/SSE)
├── web/                       # Web Application (Next.js App Router & Tailwind CSS)
├── mobile/                    # Mobile Application (Flutter Dart - Android & iOS)
├── packages/
│   └── shared/                # Kontrak model data bersama, DTO, dan protokol sinkronisasi
├── docs/                      # Dokumentasi komprehensif proyek
│   ├── PRD.md                 # Product Requirement Document (Tahap 3)
│   ├── FEATURES.md            # Detail Spesifikasi Fitur (Tahap 3)
│   ├── USER_FLOW.md           # Diagram Alur Pengguna (Tahap 3)
│   ├── ARCHITECTURE.md        # Desain Arsitektur Hybrid (Tahap 4)
│   ├── DATABASE_SCHEMA.md     # Skema Database Lokal & Cloud (Tahap 4)
│   ├── API_SPEC.md            # Spesifikasi Endpoint REST/Sync (Tahap 4)
│   ├── SYNC_STRATEGY.md       # Protokol Sinkronisasi & Resolusi Konflik (Tahap 4)
│   └── DESIGN_SYSTEM.md       # Design System & Token Anti-Slop (Tahap 5)
├── config/                    # Pengaturan konfigurasi proyek & build
│   └── project-config.json
├── scripts/                   # Helper skrip development, database seed, dan build
├── .editorconfig              # Standar format kode multi-bahasa
├── .env.example               # Template environment variables
├── .gitignore                 # Konfigurasi pengabaian file Git
├── AGENTS.md                  # Panduan agen, Ponytail rules, & Anti-slop
├── DESIGN.md                  # Standar desain & token visual Anti-Slop
├── package.json               # Konfigurasi root monorepo
├── tsconfig.base.json         # Base TypeScript configuration
└── README.md                  # Dokumentasi utama proyek CashWise
```

---

## 🌿 Strategi Percabangan Git (Branching Strategy)

- **`main`**: Branch produksi utama. Hanya menerima merge yang telah lolos pengujian menyeluruh dan diverifikasi.
- **`develop`**: Branch integrasi aktif. Tempat penggabungan fitur-fitur baru sebelum rilis.
- **`feat/<nama-fitur>`**: Branch fitur vertikal (contoh: `feat/auth-profile`, `feat/offline-sync`).

---

## 🗺️ Tahapan Pengerjaan Proyek

1. **Tahap 1 – Persiapan File dan Folder** *(Status: Selesai ✅)*
2. **Tahap 2 – Instalasi Tools dan Skills** *(Status: Selesai ✅)*
3. **Tahap 3 – Discovery dan Requirements** *(Status: Selesai ✅)*
4. **Tahap 4 – Arsitektur dan Database** *(Status: Selesai ✅)*
5. **Tahap 5 – UI/UX dan Design System (Anti-Slop)** *(Status: Selesai ✅)*
6. **Tahap 6 – Workspace dan Context Engineering** *(Status: Selesai ✅)*
7. **Tahap 7 – Development (Vertical Slicing: Slices 1–9)** *(Status: SELESAI 100% ✅)*
   - [x] **Slice 1:** Scaffolding Web (Next.js App Router) & Mobile (Flutter) dengan local storage.
   - [x] **Slice 2:** Manajemen Akun / Kantong Keuangan (Saldo real-time, grouping, reorder priority).
   - [x] **Slice 3:** Pencatatan Transaksi Kilat (Pengeluaran, Pemasukan, Transfer antar-kantong).
   - [x] **Slice 4:** Manajemen Kategori Sistem & Custom dengan Visual Emojis dan auto-migrasi.
   - [x] **Slice 5:** Penganggaran & Batas Pengeluaran Bulanan (Budgeting & Visual Alerts).
   - [x] **Slice 6:** Dashboard Analitik & Laporan Arus Kas (Net Worth Card, Income vs Expense).
   - [x] **Slice 7:** Ekspor Data Transaksi (CSV & JSON).
   - [x] **Slice 8:** Sinkronisasi Hybrid Cloud Engine (Bidirectional Delta Sync, `sync_queue`, LWW Conflict Resolution).
   - [x] **Slice 9:** Polish UI/UX, Haptic Feedback & Offline Resilience (Pull-to-refresh, haptic feedback, online/offline detection, empty states).
8. **Tahap 8 – Testing, Security & Quality Assurance** *(Status: BERIKUTNYA ⏳)*
9. **Tahap 9 – Deployment dan Release (Vercel & Android APK/AAB)**
10. **Tahap 10 – Final Review dan Handover**

---

## ⚡ Panduan Menjalankan Proyek (Quick Start)

### 1. Web Application (Next.js 14)
```bash
# Build paket shared dan aplikasi web
npm --workspace=@cashwise/shared run build
npm run build:web

# Menjalankan server web produksi lokal (port 3000)
npm run start:web

# Atau mode development
npm run dev:web
```
Buka browser di **`http://localhost:3000`**.

### 2. Mobile Application (Flutter)
```bash
cd mobile

# Jalankan analisis kode
flutter analyze

# Jalankan aplikasi (Desktop macOS / Android Emulator / iOS Simulator)
flutter run
```

---

## 📲 Unduh & Jalankan Aplikasi Mobile (Local-Only Offline Vault)

Aplikasi mobile CashWise telah disetel beroperasi secara **100% Local-First** menggunakan database lokal **SQLite** (`cashwise_local.db`). Seluruh data transaksi, akun, dan kategori tersimpan aman di perangkat tanpa memerlukan server luar.

### 🤖 Android (APK)
- **Tautan Unduh APK Lokal:** [Unduh CashWise Android APK](http://localhost:3000/downloads/cashwise.apk)
- **Panduan Instalasi Android:**
  1. Jalankan web server lokal (`npm run start:web` di port 3000).
  2. Unduh file APK melalui tautan di atas: [http://localhost:3000/downloads/cashwise.apk](http://localhost:3000/downloads/cashwise.apk).
  3. Buka file `.apk` di ponsel Android dan pilih **Install**.
  4. Izinkan *"Install unknown apps"* pada browser/file manager jika diminta oleh sistem Android.
  5. Aplikasi CashWise langsung siap digunakan secara *offline-first*.

### 🍏 iOS (iPhone & iPad)
> **Catatan Teknis:** File berekstensi `.apk` adalah format khusus Android dan tidak dapat dijalankan di iOS. Perangkat Apple menggunakan format `.ipa` atau instalasi langsung (*direct provisioning*) melalui macOS.

- **Cara Memasang Langsung ke iPhone via Mac (Developer Run):**
  1. Sambungkan iPhone ke Mac menggunakan kabel data USB/Lightning.
  2. Pastikan **Developer Mode** aktif di iPhone (*Settings > Privacy & Security > Developer Mode*).
  3. Jalankan perintah instalasi otomatis ke iPhone:
     ```bash
     cd mobile
     flutter run -d ios
     ```
  4. **Atau Melalui Xcode:**
     ```bash
     open mobile/ios/Runner.xcworkspace
     ```
     Pilih target iPhone Anda di bilah atas Xcode, lalu tekan tombol **Run (▶️)**. Aplikasi akan otomatis ter-install dan muncul di layar utama iPhone Anda.

---

### 3. Endpoint Cloud Sync (`/api/sync`)
- **GET `/api/sync`**: Memeriksa status kesehatan (*health status*) dan ringkasan metrik server.
- **POST `/api/sync`**: Menangani sinkronisasi delta dua arah (*bidirectional push & pull*) antara Web dan Mobile dengan resolusi konflik *Last-Write-Wins (LWW)*.
