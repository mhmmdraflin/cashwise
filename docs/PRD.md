# Product Requirements Document (PRD) — CashWise

**Versi:** 1.0.0  
**Tanggal:** 22 November 2026  
**Status:** DRAFT (Disetujui untuk Tahap 3)  
**Dokumen Terkait:** [ROADMAP.md](file:///Users/mhmmdraflin/Cashwise/cashwise/docs/ROADMAP.md), [ARCHITECTURE.md](file:///Users/mhmmdraflin/Cashwise/cashwise/docs/ARCHITECTURE.md), [DATABASE_SCHEMA.md](file:///Users/mhmmdraflin/Cashwise/cashwise/docs/DATABASE_SCHEMA.md), [FEATURES.md](file:///Users/mhmmdraflin/Cashwise/cashwise/docs/FEATURES.md), [USER_FLOW.md](file:///Users/mhmmdraflin/Cashwise/cashwise/docs/USER_FLOW.md)

---

## 1. Ringkasan Eksekutif & Latar Belakang

Pengelolaan keuangan pribadi seringkali gagal bukan karena kurangnya niat, melainkan karena gesekan (*friction*) dalam aplikasi pencatat keuangan konvensional:
1. **Ketergantungan Sinyal Internet:** Sebagian besar aplikasi modern mengandalkan API cloud penuh. Saat pengguna berada di basement, pasar swalayan, atau area berkuota tipis, aplikasi mengalami *loading spinner* yang lama atau bahkan gagal menyimpan transaksi.
2. **Fragmentasi Platform:** Pengguna mencatat transaksi saat bepergian via ponsel cerdas (Mobile), namun mengevaluasi anggaran dan menyusun strategi tabungan lebih nyaman dilakukan di layar besar laptop/desktop (Web). Seringkali data antar-perangkat tidak sinkron secara *real-time*.
3. **Kompleksitas Berlebih & UI Cluttered:** Banyak aplikasi menyematkan fitur pinjaman online, iklan, dan grafik bergradien neon yang mengganggu konsentrasi data finansial.

**CashWise** hadir sebagai platform pengatur keuangan modern dengan arsitektur **Hybrid (Offline-First Local Database + Cloud Database Synchronization)**. CashWise menggabungkan kecepatan native aplikasi lokal dengan kenyamanan sinkronisasi multi-device berbasis cloud, dibalut desain visual fungsional dan bersih (mengikuti standar *Anti-Slop* dan prinsip efisiensi *Ponytail*).

---

## 2. Visi Produk & Prinsip Inti

1. **Local-First, Zero Latency:** Interaksi pencatatan, perubahan saldo, dan pembuatan anggaran terjadi seketika (< 16ms) di perangkat lokal tanpa menunggu respons server.
2. **Kemandirian Jaringan (Offline-Resilient):** Aplikasi dapat difungsikan 100% tanpa jaringan internet. Begitu koneksi aktif, pertukaran delta data terjadi secara otomatis di latar belakang.
3. **Data Clarity First (Anti-Slop Standard):** Angka finansial disajikan dengan angka tabular monospaced (`font-mono`), hierarki warna yang tegas (Hijau Emerald untuk pemasukan, Merah Rose untuk pengeluaran, Slate Navy untuk teks data), serta kontras rasio minimal 4.5:1 untuk keterbacaan tinggi.
4. **Keamanan & Kedaulatan Data:** Transaksi pengguna dilindungi token otentikasi standar industri (JWT), hashing sandi kuat (Argon2/Bcrypt), dan arsitektur soft-delete (tombstones) untuk mencegah hilangnya data akibat tumpang tindih.

---

## 3. Profil Pengguna & Persona

### Persona A: Rian — "The Fast Track Mobile Logger"
- **Usia:** 27 tahun, Pekerja Lapangan / Konsultan.
- **Karakteristik:** Mobilitas tinggi, sering melakukan transaksi mikro harian (kopi, bensin, makan siang, parkir).
- **Kebutuhan:** Mencatat pengeluaran dalam waktu kurang dari 3 detik langsung dari layar utama ponsel. Tidak ingin terhalang sinyal lemot.
- **Pain Point:** Aplikasi lama sering *freeze* di kasir minimarket karena sinyal kartu seluler buruk.

### Persona B: Siti — "The Strategic Financial Planner"
- **Usia:** 34 tahun, Ibu Rumah Tangga & Pemilik Usaha Mikro.
- **Karakteristik:** Memiliki beberapa pos rekening (BCA, Mandiri, Dompet Tunai, GoPay, OVO). Suka mengevaluasi anggaran keluarga di akhir pekan menggunakan laptop.
- **Kebutuhan:** Dashboard analitik web yang jelas, laporan arus kas bulanan, grafik batas anggaran per kategori, dan kemampuan ekspor ke spreadsheet.
- **Pain Point:** Sering mendapati transaksi yang dicatat suaminya di ponsel tidak muncul di catatan laptop.

---

## 4. Ruang Lingkup Proyek (Scope)

### 4.1 In-Scope (MVP & Fase Inti)
- **Multi-Akun / Multi-Kantong:** Manajemen rekening bank, uang tunai, e-wallet, dan kartu kredit.
- **Pencatatan Transaksi Instan:** Pemasukan, Pengeluaran, dan Transfer Antar-Akun secara atomic.
- **Kategori Fleksibel:** Kategori default sistem dan kategori kustom pengguna.
- **Penganggaran (Budgets):** Penetapan batas anggaran bulanan per kategori dan indikator sisa batas.
- **Dashboard Analitik:** Ringkasan kekayaan bersih (Net Worth), arus kas masuk vs keluar, dan alokasi pengeluaran.
- **Sinkronisasi Dua Arah (Bidirectional Delta Sync):**
  - Antrean lokal (`sync_queue`) di Web (IndexedDB) dan Mobile (SQLite).
  - Endpoint REST/SSE untuk push-pull delta mutasi.
  - Resolusi konflik berbasis nomor versi entitas & *Last-Write-Wins* dengan catatan audit log.
- **Multi-Platform:** Web responsif (Next.js) dan Mobile (Flutter untuk Android & iOS).

### 4.2 Out-of-Scope (Fase Selanjutnya / Deferred)
- Integrasi otomatis *Open Banking* / *Screen Scraping* bank lokal (dihindari di fase awal karena regulasi dan risiko keamanan credential).
- Otomatisasi pembacaan struk belanja via OCR/AI (disediakan opsi manual cepat terlebih dahulu untuk menjaga bundle tetap ringan).
- Fitur pinjaman, investasi reksadana/saham terintegrasi, atau e-commerce.

---

## 5. Indikator Keberhasilan (Success Metrics & KPIs)

| Metrik | Target | Metode Pengukuran |
|---|---|---|
| **Waktu Pencatatan Transaksi** | < 3 detik dari buka aplikasi | User testing & analytics event |
| **Latensi UI Lokal (CRUD)** | < 16ms (60 FPS fluid) | Benchmark render & database query lokal |
| **Tingkat Kesiapan Offline** | 100% fitur pencatatan | Automated offline integration test |
| **Tingkat Kehilangan Data Sync** | 0% (Zero Data Loss) | Stress testing multi-device concurrent sync |
| **Kontras Aksesibilitas UI** | >= 4.5:1 (WCAG AA) | Anti-slop contrast scanner & lighthouse |
| **Waktu Sinkronisasi Delta** | < 500ms (koneksi normal 4G) | API benchmark endpoint `/api/v1/sync` |

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Performa:**
   - Client bundle size Web awal < 150KB gzip.
   - Ukuran instalasi aplikasi Flutter < 25MB.
2. **Keamanan:**
   - Komunikasi data wajib melalui TLS 1.3 (HTTPS).
   - Penyimpanan token otentikasi aman (`flutter_secure_storage` di Mobile, `HttpOnly` Secure Cookie di Web).
   - Validasi ketat semua payload masuk menggunakan Zod (di server/web) dan strongly-typed DTO (di mobile/shared).
3. **Keandalan:**
   - Retry otomatis dengan *exponential backoff* pada antrean sinkronisasi jika server tidak dapat dijangkau.
   - Skema penghapusan data bertahap (*soft-delete/tombstone*) agar propagasi penghapusan data tidak menimbulkan anomali.
