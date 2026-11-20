# Skema Database FinFlow (Local & Cloud)

Struktur data FinFlow dirancang secara identik antara database lokal (SQLite di Mobile, IndexedDB/SQLite-Wasm di Web) dan database cloud (PostgreSQL), sehingga proses pertukaran data berlangsung mulus.

---

## 1. Entitas & Tabel Utama

### 1.1 Tabel `users`
Menyimpan identitas pengguna dan preferensi dasar.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (PK) | Identifikasi unik pengguna |
| `email` | VARCHAR(255) | Alamat email (unik) |
| `name` | VARCHAR(100) | Nama lengkap pengguna |
| `currency` | VARCHAR(10) | Mata uang utama (default: 'IDR') |
| `createdAt` | TIMESTAMP | Waktu pembuatan akun |
| `updatedAt` | TIMESTAMP | Waktu pembaruan data terakhir |
| `version` | INTEGER | Nomor versi untuk sinkronisasi |

---

### 1.2 Tabel `accounts` (Rekening / Kantong Keuangan)
Menyimpan rekening bank, e-wallet, uang tunai, atau kartu kredit.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (PK) | Identifikasi akun |
| `userId` | UUID (FK) | Relasi ke `users.id` |
| `name` | VARCHAR(100) | Nama rekening (contoh: "BCA Tabungan", "Dompet Tunai") |
| `type` | VARCHAR(30) | `CASH`, `BANK`, `E_WALLET`, `INVESTMENT`, `CREDIT_CARD` |
| `balance` | NUMERIC(15, 2) | Saldo saat ini |
| `color` | VARCHAR(20) | Kode warna aksen (HEX) |
| `icon` | VARCHAR(50) | Nama ikon identifier |
| `createdAt` | TIMESTAMP | Waktu dibuat |
| `updatedAt` | TIMESTAMP | Waktu diubah |
| `deletedAt` | TIMESTAMP NULL | Penanda soft-delete (tombstone) |
| `version` | INTEGER | Nomor versi kontrol sinkronisasi |

---

### 1.3 Tabel `categories` (Kategori Pengeluaran & Pemasukan)

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (PK) | Identifikasi kategori |
| `userId` | UUID (FK) | Relasi ke `users.id` |
| `name` | VARCHAR(100) | Contoh: "Makanan & Minuman", "Gaji Bulanan", "Transportasi" |
| `type` | VARCHAR(20) | `INCOME` atau `EXPENSE` |
| `icon` | VARCHAR(50) | Ikon kategori |
| `color` | VARCHAR(20) | Warna kategori |
| `createdAt` | TIMESTAMP | Waktu dibuat |
| `updatedAt` | TIMESTAMP | Waktu diubah |
| `deletedAt` | TIMESTAMP NULL | Penanda soft-delete (tombstone) |
| `version` | INTEGER | Nomor versi |

---

### 1.4 Tabel `transactions` (Transaksi Keuangan)

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (PK) | Identifikasi transaksi |
| `userId` | UUID (FK) | Relasi ke `users.id` |
| `accountId` | UUID (FK) | Rekening sumber (relasi ke `accounts.id`) |
| `toAccountId`| UUID (FK) NULL| Rekening tujuan (jika jenis transfer antar-akun) |
| `categoryId` | UUID (FK) NULL| Relasi ke `categories.id` |
| `amount` | NUMERIC(15, 2) | Nominal transaksi |
| `type` | VARCHAR(20) | `INCOME`, `EXPENSE`, atau `TRANSFER` |
| `date` | TIMESTAMP | Tanggal dan jam transaksi terjadi |
| `note` | TEXT NULL | Catatan tambahan |
| `tags` | TEXT[] NULL | Label / tag tambahan |
| `createdAt` | TIMESTAMP | Waktu dibuat |
| `updatedAt` | TIMESTAMP | Waktu diubah |
| `deletedAt` | TIMESTAMP NULL | Penanda soft-delete (tombstone) |
| `version` | INTEGER | Nomor versi |

---

### 1.5 Tabel `budgets` (Alokasi Anggaran Bulanan)

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (PK) | Identifikasi anggaran |
| `userId` | UUID (FK) | Relasi ke `users.id` |
| `categoryId` | UUID (FK) | Kategori yang dibatasi |
| `limitAmount` | NUMERIC(15, 2) | Batas maksimal pengeluaran |
| `period` | VARCHAR(20) | `MONTHLY`, `WEEKLY`, `YEARLY` |
| `startDate` | DATE | Tanggal mulai periode |
| `endDate` | DATE | Tanggal akhir periode |
| `createdAt` | TIMESTAMP | Waktu dibuat |
| `updatedAt` | TIMESTAMP | Waktu diubah |
| `deletedAt` | TIMESTAMP NULL | Penanda soft-delete (tombstone) |
| `version` | INTEGER | Nomor versi |

---

## 2. Tabel Pendukung Sinkronisasi Lokal (`sync_queue`)
Hanya terdapat pada client (Web IndexedDB dan Flutter SQLite):

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | INTEGER (PK AI) | Urutan lokal |
| `entityType` | VARCHAR(50) | `account`, `category`, `transaction`, `budget` |
| `entityId` | UUID | ID entitas yang dimutasi |
| `action` | VARCHAR(20) | `CREATE`, `UPDATE`, `DELETE` |
| `payload` | JSON/TEXT | Data snapshot mutasi |
| `createdAt` | TIMESTAMP | Waktu antrean dibuat |
| `status` | VARCHAR(20) | `PENDING`, `SYNCING`, `FAILED` |
| `retryCount` | INTEGER | Jumlah percobaan pengiriman |
