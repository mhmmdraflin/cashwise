# Spesifikasi Rinci Fitur CashWise (FEATURES.md)

Dokumen ini mendefinisikan spesifikasi fungsional, aturan bisnis, dan kriteria penerimaan (*Acceptance Criteria*) untuk setiap modul aplikasi CashWise.

---

## 1. Modul Akun & Kantong Finansial (Accounts / Wallets)

### 1.1 Deskripsi Fungsional
Pengguna dapat mengelola beberapa sumber dana terpisah untuk memisahkan uang kebutuhan harian, tabungan, dan dompet digital.

### 1.2 Tipe Akun yang Didukung
- `CASH`: Uang tunai di dompet fisik.
- `BANK`: Rekening tabungan bank (BCA, Mandiri, BRI, BNI, dll).
- `E_WALLET`: Dompet digital (GoPay, OVO, DANA, ShopeePay).
- `INVESTMENT`: Kantong dana darurat / reksadana.
- `CREDIT_CARD`: Kartu kredit dengan batas kredit dan saldo terpakai.

### 1.3 Aturan Bisnis & Validasi
1. Saldo akun dihitung ulang secara atomic saat transaksi dibuat, diubah, atau dihapus.
2. Pengguna wajib memiliki minimal satu akun aktif (akun default dibuat otomatis saat registrasi: "Dompet Tunai").
3. Akun yang memiliki riwayat transaksi tidak boleh di-*hard delete*; hanya dapat diarsipkan (*soft delete*) dengan `deletedAt != null`.

### 1.4 Acceptance Criteria (Gherkin)
```gherkin
Skenario: Menambahkan akun rekening baru secara offline
  Dengan pengguna berada di halaman Akun dalam kondisi perangkat offline
  Ketika pengguna mengisi nama "BCA Tabungan", tipe "BANK", dan saldo awal Rp 1.500.000
  Dan pengguna menekan tombol "Simpan Akun"
  Maka akun "BCA Tabungan" langsung muncul di daftar akun lokal dengan saldo Rp 1.500.000
  Dan mutasi penambahan akun dicatat dalam antrean sync_queue dengan status "PENDING"
```

---

## 2. Modul Pencatatan Transaksi Kilat (Transactions)

### 2.1 Deskripsi Fungsional
Memfasilitasi pencatatan uang masuk, uang keluar, serta transfer antar-kantong dalam waktu seminimal mungkin.

### 2.2 Jenis Transaksi
1. **EXPENSE (Pengeluaran):** Mengurangi saldo akun sumber, diasosiasikan dengan kategori pengeluaran.
2. **INCOME (Pemasukan):** Menambah saldo akun tujuan, diasosiasikan dengan kategori pemasukan.
3. **TRANSFER (Pindah Saldo):** Mengurangi saldo `accountId` dan menambah saldo `toAccountId` secara serentak.

### 2.3 Aturan Bisnis & Validasi
1. Nominal transaksi wajib lebih besar dari 0 (`amount > 0`).
2. Tanggal transaksi default adalah waktu saat input dibuat (`Date.now()`), namun dapat diatur ke tanggal lampau (backdating).
3. Transaksi transfer wajib memiliki `accountId` (asal) dan `toAccountId` (tujuan) yang berbeda.
4. Nilai moneter ditampilkan dengan format tabular monospaced:
   - Contoh: `Rp  1.250.000,00`
   - Warna teks: Hijau Emerald untuk pemasukan (`#10B981`), Merah Rose untuk pengeluaran (`#F43F5E`).

### 2.4 Acceptance Criteria (Gherkin)
```gherkin
Skenario: Melakukan transfer saldo antar kantong
  Dengan saldo "BCA Tabungan" adalah Rp 2.000.000 dan "GoPay" adalah Rp 100.000
  Ketika pengguna mencatat transfer sebesar Rp 250.000 dari "BCA Tabungan" ke "GoPay"
  Maka saldo "BCA Tabungan" seketika berkurang menjadi Rp 1.750.000
  Dan saldo "GoPay" seketika bertambah menjadi Rp 350.000
  Dan dibuat 1 entitas transaksi bertipe "TRANSFER" dengan toAccountId yang valid
```

---

## 3. Modul Kategori & Tag Dinamis (Categories & Tags)

### 3.1 Kategori Bawaan Sistem (Default Pre-seeded)
- **Pengeluaran:**
  - 🍔 *Makanan & Minuman* (Warna: Orange/Coral)
  - 🚗 *Transportasi & Bensin* (Warna: Blue Slate)
  - 🏠 *Tagihan & Utilitas* (Warna: Amber)
  - 🛒 *Belanja Harian* (Warna: Rose)
  - 🎮 *Hiburan & Langganan* (Warna: Purple)
  - 💊 *Kesehatan & Medis* (Warna: Teal)
- **Pemasukan:**
  - 💼 *Gaji Bulanan* (Warna: Emerald Green)
  - 📈 *Bonus & Investasi* (Warna: Cyan)
  - 🎁 *Hadiah & Lainnya* (Warna: Lime)

### 3.2 Aturan Bisnis
1. Pengguna dapat menambah, mengedit nama, ikon, atau warna kategori kustom.
2. Kategori sistem tidak dapat dihapus, namun dapat disembunyikan jika tidak digunakan.
3. Menghapus kategori kustom tidak akan menghapus riwayat transaksi lama; transaksi yang terkait dialihkan ke kategori "Lain-lain" atau tetap mempertahankan nama kategori lama sebagai teks snapshot.

---

## 4. Modul Penganggaran & Batas Pengeluaran (Budgets)

### 4.1 Deskripsi Fungsional
Pengguna dapat mematok kuota pengeluaran maksimal per kategori untuk siklus tertentu (umumnya bulanan, 1 hingga 31 kalender).

### 4.2 Status & Ambang Batas Visual
- **Aman (Safe):** Pengeluaran <= 70% dari limit. Status bar: Emerald Green (`#10B981`).
- **Waspada (Warning):** Pengeluaran > 70% dan <= 90%. Status bar: Amber Gold (`#F59E0B`).
- **Kritis / Bahaya (Danger):** Pengeluaran > 90% dan <= 100%. Status bar: Coral Red (`#F43F5E`).
- **Over-Budget:** Pengeluaran > 100%. Teks bertuliskan "Melebihi anggaran sebesar Rp X" dengan styling kontras tinggi.

### 4.3 Acceptance Criteria (Gherkin)
```gherkin
Skenario: Notifikasi visual batas anggaran terlampaui
  Dengan pengguna menetapkan anggaran "Makanan & Minuman" sebesar Rp 1.500.000
  Dan total pengeluaran kategori tersebut bulan ini sudah mencapai Rp 1.400.000
  Ketika pengguna mencatat pengeluaran makan malam baru sebesar Rp 200.000
  Maka total pengeluaran menjadi Rp 1.600.000
  Dan kartu anggaran menampilkan badge "Over-Budget (+Rp 100.000)" dengan warna rose-600
```

---

## 5. Modul Dashboard & Laporan Analitik (Analytics & Reporting)

### 5.1 Komponen Visual Dashboard
1. **Kartu Saldo Utama (Net Worth Card):** Total likuiditas dari seluruh kantong aktif.
2. **Widget Arus Kas Bulan Ini (Cash Flow Widget):**
   - Total Pemasukan vs Total Pengeluaran vs Net Saving.
3. **Grafik Pengeluaran per Kategori:** Donut / Bar chart proporsi belanja bulanan.
4. **Daftar Transaksi Terakhir (Recent Transactions):** 5-10 transaksi terakhir dengan badge status sinkronisasi.

### 5.2 Fitur Ekspor
- Ekspor data transaksi terfilter ke file format `.csv` dan `.json` langsung dari browser web.

---

## 6. Modul Sinkronisasi Offline-First & Keamanan (Sync Engine)

### 6.1 Lifecycle Antrean Sinkronisasi
```
[User Action] -> [Simpan DB Lokal] -> [Tambah sync_queue (PENDING)]
                         |
           (Deteksi Jaringan Online)
                         v
                [Kirim Delta ke Server]
                  /                 \
        (Sukses 200)             (Gagal Jaringan / 5xx)
            v                           v
[Hapus item di sync_queue]     [Tingkatkan retryCount & backoff]
[Terapkan Server Changes]
```

### 6.2 Resolusi Konflik (Conflict Matrix)
| Kondisi | Keputusan Sistem | Keterangan |
|---|---|---|
| `clientVersion == serverVersion + 1` | Terima mutasi client | Alur normal sinkron, server update version ke clientVersion. |
| `serverVersion > clientVersion` (Transaksi sama diubah di 2 tempat) | Last-Write-Wins berdasarkan `updatedAt` | Data versi teranyar menang; versi lama disimpan di `sync_audit_log`. |
| Entitas di-delete di server tapi di-update di client offline | Delete menang (Tombstone preserved) | Entitas ditandai `deletedAt`, client menerima konfirmasi penghapusan. |
