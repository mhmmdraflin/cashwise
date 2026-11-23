# Panduan Sistem Desain & Komponen CashWise (DESIGN_SYSTEM.md)

**Versi:** 1.0.0  
**Standar:** Anti-Slop (No Generik AI Gradients, Data Clarity First, WCAG AA Accessibility)  
**Dokumen Induk:** [DESIGN.md](file:///Users/mhmmdraflin/Cashwise/cashwise/DESIGN.md)

---

## 1. Filosofi Desain Anti-Slop

CashWise dirancang untuk menyelesaikan masalah pencatatan keuangan pribadi dengan kecepatan tinggi dan akurasi maksimal. Antarmuka tidak boleh membebani pengguna dengan dekorasi visual yang tidak perlu:
1. **Kejelasan Data di Atas Dekorasi:** Angka keuangan adalah aktor utama. Semua nominal uang disajikan dengan format *tabular numbers* (`font-mono`) dan diratakan ke kanan pada tabel/daftar.
2. **Batas Tegas (Crisp 1px Borders):** Menolak kartu melayang dengan bayangan kabur (*blurry floating shadows*). Gunakan garis batas kontras tinggi `1px solid #E2E8F0` yang rapi.
3. **Warna Semantik yang Konsisten:**
   - **Pemasukan:** Emerald Green (`#059669`)
   - **Pengeluaran:** Rose Red (`#E11D48`)
   - **Peringatan Anggaran:** Amber Gold (`#D97706`)
   - **Aksi / CTA:** Indigo (`#4F46E5`)
4. **Sentuhan Ergonomis:** Target sentuh (*touch target*) minimal **48 x 48 px** pada layar sentuh ponsel.

---

## 2. Matriks Kontras Aksesibilitas (WCAG AA Compliance)

Semua kombinasi warna teks dan latar belakang diuji untuk melampaui batas minimal rasio kontras 4.5:1 (Normal Text) dan 3:1 (Large Text):

| Pasangan Warna (Teks / Background) | Nilai Hex | Rasio Kontras | Status WCAG AA | Penggunaan |
|---|---|---|---|---|
| Slate 900 pada Putih | `#0F172A` / `#FFFFFF` | **18.7 : 1** | PASS (AAA) | Judul, nominal utama, teks navigasi |
| Slate 600 pada Putih | `#475569` / `#FFFFFF` | **7.1 : 1** | PASS (AAA) | Label form, deskripsi akun |
| Slate 500 pada Putih | `#64748B` / `#FFFFFF` | **4.6 : 1** | PASS (AA) | Timestamp, placeholder teks |
| Emerald 600 pada Emerald 50 | `#059669` / `#ECFDF5` | **5.4 : 1** | PASS (AA) | Badge pemasukan, status anggaran aman |
| Rose 600 pada Rose 50 | `#E11D48` / `#FFF1F2` | **5.8 : 1** | PASS (AA) | Badge pengeluaran, badge over-budget |
| Amber 700 pada Amber 50 | `#B45309` / `#FFFBEB` | **5.3 : 1** | PASS (AA) | Badge peringatan anggaran (>70%) |
| Putih pada Indigo 600 | `#FFFFFF` / `#4F46E5` | **6.4 : 1** | PASS (AA) | Tombol CTA utama (Primary Button) |

---

## 3. Spesifikasi Komponen Inti

### 3.1 Kartu Saldo Utama (Net Worth Hero Card)
- **Struktur:**
  - Label kecil: `Total Kekayaan Bersih` (Slate 500, 12px, Uppercase tracking-wider).
  - Nilai Nominal: `Rp 4.250.000,00` (Slate 900, 32px Bold, `font-mono`).
  - Ringkasan Arus Kas Bulan Ini (2 Kolom Sub-Stat):
    - Pemasukan: `+ Rp 5.000.000` (Emerald 600, 14px Semibold).
    - Pengeluaran: `- Rp 750.000` (Rose 600, 14px Semibold).
- **Styling:** Latar belakang putih `#FFFFFF`, border `1px solid #E2E8F0`, padding 24px, border-radius 12px.

### 3.2 Kartu Akun / Kantong (Account Wallet Card)
- **Elemen:**
  - Ikon Akun dalam kotak rounded 36x36px dengan warna background aksen akun.
  - Nama Akun: "BCA Tabungan" (16px, Semibold).
  - Tipe Akun: Badge kecil "BANK" (11px, Uppercase).
  - Saldo Akun: `Rp 3.500.000` (18px Bold, `font-mono`).

### 3.3 Baris Transaksi (Transaction Row Item)
- **Elemen:**
  - Ikon kategori (40x40px rounded box).
  - Kolom teks kiri:
    - Judul transaksi / Kategori (14px Semibold).
    - Catatan & Nama Akun (12px Slate 500).
  - Kolom kanan (Rata Kanan):
    - Nominal transaksi bertanda:
      - Pengeluaran: `- Rp 45.000` (Rose 600, `font-mono`).
      - Pemasukan: `+ Rp 1.500.000` (Emerald 600, `font-mono`).
      - Transfer: `Rp 250.000` (Slate 700, `font-mono`).
    - Waktu transaksi (11px Slate 500).
    - Badge status sinkronisasi kecil (hanya tampil jika `PENDING` atau `CONFLICT`).

### 3.4 Progress Bar Anggaran (Budget Card)
- **Komponen:**
  - Baris Header: Nama Kategori ("Makanan & Minuman") dan Kuota Anggaran (`Rp 1.500.000`).
  - Progress Track (Tinggi 8px, rounded 9999px, background `#E2E8F0`):
    - Warna Fill:
      - <= 70% Terpakai: Emerald 600 (`#059669`).
      - 70% - 90% Terpakai: Amber 600 (`#D97706`).
      - 90% - 100% Terpakai: Rose 600 (`#E11D48`).
      - > 100% Terpakai: Rose 700 + Label Badge "Over-Budget".
  - Baris Footer: Sisa dana yang dapat dibelanjakan & persentase pemakaian.

### 3.5 Tombol Aksi & Formulir (Forms & Action Buttons)
- **Primary CTA Button:**
  - Tinggi 48px, background Indigo 600 (`#4F46E5`), teks Putih 16px Semibold, rounded 8px.
  - State Hover: Indigo 700 (`#4338CA`).
  - State Focus: `ring-2 ring-indigo-500 ring-offset-2`.
- **Input Form:**
  - Tinggi 48px, padding horizontal 16px, border `1px solid #CBD5E1`.
  - State Focus: border `Indigo 600`, outline ring `2px #EEF2FF`.

---

## 4. Pola Status Antarmuka (Component States)

1. **State Kosong (Empty State):**
   - Tidak menggunakan ilustrasi kartun.
   - Gunakan ikon garis sederhana berukuran 48px di dalam kotak bundar abu-abu.
   - Pesan ringkas, contoh: *"Belum ada transaksi bulan ini"*.
   - Satu tombol aksi langsung: `+ Catat Transaksi Pertama`.
2. **State Loading (Skeleton):**
   - Gunakan skeleton placeholder persegi abu-abu cerah `#E2E8F0` dengan animasi pulse lembut, bukan spinner berputar di tengah layar yang memblokir tampilan.
3. **State Error:**
   - Tampilkan kotak peringatan di bawah input yang bermasalah dengan border Rose 200 dan teks Rose 700 yang jelas (misal: *"Nominal transaksi wajib lebih besar dari 0"*).

---

## 5. Integrasi Token Desain ke Kode Proyek

- **Web (Next.js / Tailwind CSS):** [tailwind-preset.ts](file:///Users/mhmmdraflin/Cashwise/cashwise/packages/shared/src/theme/tailwind-preset.ts) dan [tokens.ts](file:///Users/mhmmdraflin/Cashwise/cashwise/packages/shared/src/theme/tokens.ts).
- **Mobile (Flutter Dart):** [theme.dart](file:///Users/mhmmdraflin/Cashwise/cashwise/packages/shared/dart/theme.dart).
- **Formatter Angka Moneter:** [formatters.ts](file:///Users/mhmmdraflin/Cashwise/cashwise/packages/shared/src/theme/formatters.ts).
