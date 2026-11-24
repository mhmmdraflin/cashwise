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
7. **Tahap 7 – Development (Vertical Slicing: Slices 1–9)** *(Status: Sedang Berjalan 🚀 - Slices 1–6 Selesai & Web App Runnable)*
8. **Tahap 8 – Testing, Security & Quality Assurance**
9. **Tahap 9 – Deployment dan Release**
10. **Tahap 10 – Final Review dan Handover**
