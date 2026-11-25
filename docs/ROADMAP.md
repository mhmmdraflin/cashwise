# Roadmap Pengembangan CashWise

Roadmap ini merinci implementasi bertahap dari awal hingga siap produksi sesuai dengan instruksi pengerjaan proyek.

---

## 📌 Tahap 1 – Persiapan File dan Folder (Status: SELESAI ✅)
- [x] Inisialisasi struktur monorepo terorganisasi (`apps/web`, `apps/mobile`, `packages/shared`, `packages/server`, `docs`, `scripts`).
- [x] Inisialisasi repository Git dan konfigurasi `.gitignore` multi-platform (Node, Flutter, Android, iOS, SQLite).
- [x] Penyusunan konfigurasi format kode (`.editorconfig`, `tsconfig.base.json`, `package.json`).
- [x] Pembuatan template environment variable (`.env.example`).
- [x] Penyusunan arsitektur lengkap, skema database, dan spesifikasi sinkronisasi di direktori `docs/`.
- [x] Penyusunan domain model & kontrak tipe data dasar di `packages/shared`.
- [x] Persiapan workflow CI di `.github/workflows/ci.yml`.

---

## 📌 Tahap 2 – Instalasi Tools dan Skills (Status: SELESAI ✅)
- [x] Verifikasi ketersediaan dan integrasi plugin **Anti-Slop** (`antislop`, `antislop-ui`, `antislop-code`, `antislop-human`, `antislop-copywriting`, `antislop-layoutmobile`).
- [x] Instalasi dan konfigurasi aturan **Ponytail** (`DietrichGebert/ponytail`) untuk membatasi kompleksitas berlebih dan menegakkan prinsip YAGNI.
- [x] Instalasi plugin **Vercel** (`antigravity-plugins-partners/plugin/vercel-plugin`) dan skills pendukung pengembangan.
- [x] Panduan agen terpusat di `AGENTS.md` dan design guidelines di `DESIGN.md`.

---

## 📌 Tahap 3 – Discovery dan Requirements (Status: SELESAI ✅)
- [x] Penyusunan Product Requirements Document lengkap di `docs/PRD.md`.
- [x] Penyusunan spesifikasi rinci modul fitur dan Acceptance Criteria (Gherkin) di `docs/FEATURES.md`.
- [x] Penyusunan diagram alur pengguna (Mermaid User Flows) di `docs/USER_FLOW.md`.

---

## 📌 Tahap 4 – Arsitektur dan Database (Status: SELESAI ✅)
- [x] Kontrak domain model, interface penyimpanan, dan validasi runtime di `packages/shared/src/`.
- [x] Implementasi engine penyimpanan lokal Web (Native IndexedDB) di `packages/shared/src/storage/indexeddb.ts`.
- [x] Implementasi skema SQLite lokal untuk Mobile Flutter di `packages/shared/sql/sqlite_schema.sql` dan model Dart di `packages/shared/dart/models.dart`.
- [x] Implementasi skema DDL PostgreSQL Cloud di `packages/shared/sql/postgres_schema.sql`.
- [x] Spesifikasi API Cloud REST & Real-time SSE di `docs/API_SPEC.md`.
- [x] Protokol dan strategi sinkronisasi hybrid (Offline-First) di `docs/SYNC_STRATEGY.md`.

---

## 📌 Tahap 5 – UI/UX dan Design System (Anti-Slop) (Status: SELESAI ✅)
- [x] Panduan sistem desain dan spesifikasi komponen anti-slop di `docs/DESIGN_SYSTEM.md`.
- [x] Token desain Web & Tailwind CSS preset di `packages/shared/src/theme/`.
- [x] Tema Material 3 & token Flutter Dart di `packages/shared/dart/theme.dart`.
- [x] Utilitas pemformat angka moneter tabular Indonesia (`formatCurrency`, `formatCompactCurrency`).
- [x] Matriks kontras aksesibilitas WCAG AA (semua rasio teks >= 4.5:1).

---

## 📌 Tahap 6 – Workspace dan Context Engineering (Status: SELESAI ✅)
- [x] Penyiapan struktur monorepo terpadu & workspace linking (`web`, `backend`, `mobile`, `packages/shared`).
- [x] Konfigurasi skrip build, lint, dan bundle checking.
- [x] Penyiapan context engineering & agent memory rules untuk development.

---

## 📌 Tahap 7 – Development (Vertical Slicing: Slices 1–9) (Status: SEDANG BERJALAN 🚀)
- [x] **Slice 1:** Scaffolding Web (Next.js App Router) & Mobile (Flutter) dengan local storage terintegrasi.
- [x] **Slice 2:** Manajemen Akun/Kantong Keuangan (Akun Dompet Tunai, BCA Tabungan, GoPay, Saldo Real-Time).
- [x] **Slice 3:** Pencatatan Transaksi Kilat (Pemasukan, Pengeluaran, Transfer Antar-Kantong) via Modal interaktif.
- [x] **Slice 4:** Manajemen Kategori Sistem (Makanan, Transportasi, Tagihan, Belanja, Gaji, dll).
- [x] **Slice 5:** Penganggaran & Batas Pengeluaran Bulanan (Budgeting & Visual Alerts).
- [x] **Slice 6:** Dashboard Analitik & Laporan Arus Kas (Net Worth Card, Pemasukan vs Pengeluaran).
- [x] **Slice 7:** Ekspor Data Transaksi (CSV & JSON).
- [ ] **Slice 8:** Sinkronisasi Hybrid Background Worker & Queue Processing.
- [ ] **Slice 9:** Polish UI/UX, Haptic Feedback & Offline Resilience.

---

## 📌 Tahap 8 – Testing, Security & Quality Assurance
- [ ] Pengujian skenario offline, transisi offline-ke-online, pengujian multi-perangkat.
- [ ] Audit kode dengan Ponytail dan Anti-Slop checklist.

---

## 📌 Tahap 9 – Deployment dan Release
- [ ] Deployment Web ke Vercel.
- [ ] Setup build release Flutter untuk Android & iOS.

---

## 📌 Tahap 10 – Final Review dan Handover
- [ ] Evaluasi kepatuhan arsitektur, verifikasi zero data loss, dan serah terima proyek.
