# CashWise Design System & UI/UX Guidelines

Dokumen ini menjadi acuan gaya visual, tipografi, palet warna, dan interaksi untuk antarmuka Web dan Mobile CashWise. Panduan ini dirancang khusus untuk mematuhi standar **Anti-Slop**: fungsional, elegan, aksesibel, dan bebas dari ornamen generik AI.

---

## 1. Identitas Visual & Mood
- **Karakter:** Tenang, Terpercaya, Presisi, Efisien.
- **Fokus Utama:** Kemudahan membaca angka keuangan, kecepatan input data transaksi, dan visibilitas anggaran.
- **Anti-Pattern (DILARANG):**
  - Tidak menggunakan gradien ungu-neon atau efek glow berlebihan.
  - Tidak menggunakan kartu melayang (floating cards) tanpa batas yang jelas.
  - Tidak menggunakan ilustrasi kartun generik AI. Gunakan ikonografi garis bersih (Lucide Icons / Feather / Material Symbols).

---

## 2. Palet Warna (Color Palette)

Semua rasio kontras teks terhadap latar belakang wajib memenuhi standar WCAG AA (minimal 4.5:1).

| Peran | Hex Code | Deskripsi & Penggunaan |
|---|---|---|
| **Primary Base (Dark Slate)** | `#0F172A` (Slate 900) | Warna utama teks, header, dan elemen navigasi aktif |
| **Primary Surface (Pure/Muted)**| `#FFFFFF` / `#F8FAFC` | Latar belakang layar, kartu transaksi, dan panel |
| **Border / Divider** | `#E2E8F0` (Slate 200) | Garis pemisah tegas dan rapi antar baris data |
| **Secondary Text** | `#64748B` (Slate 500) | Label tanggal, catatan transaksi, metadata |
| **Positive / Income (Emerald)** | `#059669` (Emerald 600) | Pemasukan, saldo positif, status anggaran aman |
| **Negative / Expense (Rose)** | `#E11D48` (Rose 600) | Pengeluaran, tagihan, over-budget warning |
| **Accent / Action (Indigo)** | `#4F46E5` (Indigo 600) | Tombol aksi utama (CTA), tombol simpan, tab aktif |
| **Warning (Amber)** | `#D97706` (Amber 600) | Peringatan mendekati limit anggaran (>80%) |

---

## 3. Tipografi (Typography)
- **Keluarga Huruf:**
  - Teks umum & UI: `Inter`, `SF Pro Display`, `-apple-system`, `Roboto`, `sans-serif`.
  - Angka Finansial: Monospace / Tabular Figures (`font-mono` atau `font-variant-numeric: tabular-nums`).
- **Skala Ukuran:**
  - `Hero Balance`: 32px / 2rem, Font Weight: 700 (Bold)
  - `Section Title`: 20px / 1.25rem, Font Weight: 600 (Semibold)
  - `Card Header / Account Name`: 16px / 1rem, Font Weight: 600
  - `Body Text / Transaction Title`: 14px / 0.875rem, Font Weight: 400 (Regular)
  - `Caption / Timestamp / Metadata`: 12px / 0.75rem, Font Weight: 500

---

## 4. Format Tampilan Angka Keuangan
- **Pemasukan:** `+ Rp 5.000.000` (Warna Emerald, teks tegas)
- **Pengeluaran:** `- Rp 45.000` (Warna Rose, teks tegas)
- **Transfer:** `Rp 250.000` (Warna Slate, ikon panah transfer)
- Penataan tabel dan daftar: Nominal selalu **rata kanan (right-aligned)** untuk memudahkan perbandingan digit.

---

## 5. Tata Letak & Ergonomi Layar
- **Web App:**
  - Sidebar navigasi tetap di sisi kiri (desktop) atau bottom navigation bar (mobile web).
  - Dashboard ringkasan 3-kolom: Saldo Akun (kiri), Transaksi Terbaru (tengah), Grafik & Budget (kanan).
- **Mobile App (Flutter):**
  - Fast Transaction Entry (Floating Action Button atau persistent bottom action bar).
  - Target sentuh (tap target) minimal 48 x 48 px untuk mencegah salah ketuk.
  - Haptic feedback lembut pada saat menyimpan transaksi.

---

## 6. Feedback & Indikator Status Sinkronisasi
- **Ikon Status Sinkronisasi:**
  - Hijau / Cloud Tercentang: Semua data tersinkron ke cloud.
  - Oranye / Cloud Berputar: Sedang menyinkronkan antrean lokal.
  - Abu-abu / Cloud Bergaris: Mode Offline (Data tersimpan aman di perangkat).
