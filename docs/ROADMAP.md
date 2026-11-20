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

## 📌 Tahap 2 – Instalasi Tools dan Skills (Status: MENUNGGU VERIFIKASI TAHAP 1 ⏳)
- [ ] Verifikasi ketersediaan dan integrasi plugin **Anti-Slop** (`antislop`, `antislop-ui`, `antislop-code`, `antislop-human`, `antislop-copywriting`, `antislop-layoutmobile`).
- [ ] Instalasi dan konfigurasi aturan **Ponytail** (`DietrichGebert/ponytail`) untuk membatasi kompleksitas berlebih dan menegakkan prinsip YAGNI.
- [ ] Instalasi plugin **Vercel** (`antigravity-plugins-partners/plugin/vercel-plugin`) dan skills pendukung pengembangan.
- [ ] Pengujian menyeluruh tools dan skills sebelum masuk ke fase coding.

---

## 📌 Tahap 3 – Pengembangan Project (Status: TERJADWAL 📅)
- [ ] **Fase 3.1: Perencanaan & Domain Modeling**
  - Finalisasi DTO dan validasi skema (Zod / TypeScript / Dart data classes).
- [ ] **Fase 3.2: Arsitektur Database & Local Storage**
  - Implementasi SQLite lokal di Flutter (sqflite / drift).
  - Implementasi local storage di Web (IndexedDB / Dexie / Wasm SQLite).
  - Skema PostgreSQL di cloud backend.
- [ ] **Fase 3.3: Engine Sinkronisasi Hybrid (Offline-First)**
  - Implementasi `sync_queue` lokal pada Web dan Mobile.
  - Implementasi sinkronisasi delta dua arah dan resolusi konflik di backend server.
- [ ] **Fase 3.4: Pengembangan UI/UX (Anti-Slop Design)**
  - Desain dashboard Web responsif (ringkasan saldo, grafik arus kas, filter kategori).
  - Desain aplikasi Mobile Flutter (Material 3 modern, gesture intuitif, fast data entry).
- [ ] **Fase 3.5: Testing, Keamanan & Verifikasi**
  - Pengujian skenario offline, transisi offline-ke-online, pengujian multi-perangkat.
  - Audit kode dengan Ponytail dan Anti-Slop checklist.
- [ ] **Fase 3.6: Deployment & Dokumentasi Rilis**
  - Deployment Web ke Vercel.
  - Setup build release Flutter untuk Android & iOS.
