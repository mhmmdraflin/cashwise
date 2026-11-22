# Arsitektur Sistem CashWise

Dokumen ini menjelaskan arsitektur teknis aplikasi CashWise, dengan fokus pada arsitektur **Hybrid: Offline-First Local Database + Cloud Database Synchronization**.

---

## 1. Diagram Arsitektur Tingkat Tinggi

```
+-------------------------------------------------------------------------------+
|                                CASHWISE CLIENTS                               |
+-------------------------------------------------------------------------------+
|  Aplikasi Web (Next.js App Router)         Aplikasi Mobile (Flutter Dart)     |
|  - UI: Tailwind CSS / Dashboard            - UI: Flutter Material 3           |
|  - Local Store: Native IndexedDB           - Local Store: SQLite (sqflite)    |
|  - Offline Sync Queue Manager              - Offline Sync Queue Manager       |
+-----------------------+---------------------------------------+---------------+
                        |                                       |
                        | HTTPS (REST / SSE / WebSockets)       |
                        v                                       v
+-------------------------------------------------------------------------------+
|                      CASHWISE CLOUD BACKEND (SYNC ENGINE)                     |
+-------------------------------------------------------------------------------+
|  - JWT Authentication & RBAC Layer                                            |
|  - Sync Dispatcher & Delta Processor                                          |
|  - Conflict Resolution Engine (Vector Clock + Last-Write-Wins + Audit Log)    |
|  - Real-time Notifications (SSE / WebSockets)                                 |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                           PERSISTENT CLOUD DATABASE                           |
+-------------------------------------------------------------------------------+
|  - PostgreSQL Database (e.g., Supabase / Neon / Self-Hosted)                  |
|  - Relational Schema with Versioning & Tombstone Deletion Flags               |
+-------------------------------------------------------------------------------+
```

---

## 2. Prinsip Desain "Local-First"

CashWise dirancang agar pengguna tidak pernah terganggu oleh kelambatan jaringan atau ketiadaan sinyal:
1. **Zero-Latency UI Updates**: Setiap operasi CRUD (Catat pengeluaran, ubah anggaran, tambah akun) langsung dieksekusi dan disimpan di database lokal terlebih dahulu. UI bereaksi secara instan (< 16ms).
2. **Atomic Sync Queue**: Setiap mutasi lokal dicatat dalam tabel `sync_queue` lokal dengan status `PENDING`, ID entitas, timestamp, dan payload mutasi.
3. **Idempotent Synchronization**: Pengiriman payload sync bersifat idempoten; pengulangan pengiriman data yang sama tidak akan merusak integritas database server.

---

## 3. Komponen Arsitektur Utama

### 3.1 Client Layer (Prioritas Penyimpanan Lokal Pertama)
- **Web App (`web`)**: Mengutamakan penyimpanan lokal peramban menggunakan **Native IndexedDB** (`cashwise_local_db`). Semua operasi CRUD akun, kategori, anggaran, dan pencatatan transaksi terjadi secara langsung dan tersimpan permanen di perangkat pengguna tanpa memerlukan koneksi backend.
- **Mobile App (`mobile`)**: Mengutamakan penyimpanan lokal perangkat menggunakan **SQLite (`sqflite`)** (`cashwise.db`). Operasi mutasi saldo dan transaksi dijalankan dalam SQL Transaction atomik untuk menjamin konsistensi data.
- **Shared Types & Storage (`packages/shared`)**: Berisi interface domain, validasi skema data runtime, engine `CashWiseIndexedDbStorage` untuk Web, model Dart untuk Mobile, dan DTO sinkronisasi agar Web dan Mobile memiliki kontrak data yang 100% konsisten.

### 3.2 Cloud Sync Engine (`packages/server`)
- Menerima mutasi perubahan dari client (delta payload).
- Membandingkan nomor versi entitas (`version`) dan timestamp (`updatedAt`).
- Menyimpan perubahan ke database cloud (PostgreSQL).
- Mengembalikan daftar perubahan dari client lain yang terjadi sejak `lastSyncTimestamp` client tersebut.

### 3.3 Strategi Resolusi Konflik (Conflict Resolution)
1. **Field-Level Last-Write-Wins (LWW) with Version Check**:
   - Jika versi client sama dengan versi server + 1: Update langsung diterima dan nomor versi dinaikkan.
   - Jika versi server sudah lebih tinggi (konflik terdeteksi karena ada client lain yang mengupdate lebih dahulu):
     - Sistem membandingkan `updatedAt` milidetik.
     - Perubahan terakhir menang (*Last-Write-Wins*), namun seluruh riwayat perubahan dicatat di tabel `sync_audit_log` agar data tidak hilang tanpa jejak.
2. **Tombstone Deletion**:
   - Penghapusan data tidak menggunakan `HARD DELETE` secara langsung, melainkan `SOFT DELETE` dengan mengisi kolom `deletedAt`. Ini memastikan penghapusan dapat disebarkan ke perangkat lain yang sedang offline.
