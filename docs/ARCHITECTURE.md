# Arsitektur Sistem CashWise

Dokumen ini menjelaskan arsitektur teknis aplikasi CashWise, dengan fokus pada arsitektur **Hybrid: Offline-First Local Database + Cloud Database Synchronization**.

---

## 1. Diagram Arsitektur Tingkat Tinggi

```
+-------------------------------------------------------------------------------+
|                                FINFLOW CLIENTS                                |
+-------------------------------------------------------------------------------+
|  Aplikasi Web (Next.js / React)           Aplikasi Mobile (Flutter Dart)      |
|  - UI: Tailwind CSS / Dashboard           - UI: Flutter Material 3            |
|  - Local Store: IndexedDB / SQLite-WASM   - Local Store: SQLite (sqflite)     |
|  - Offline Sync Queue Manager             - Offline Sync Queue Manager        |
+-----------------------+---------------------------------------+---------------+
                        |                                       |
                        | HTTPS (REST / SSE / WebSockets)       |
                        v                                       v
+-------------------------------------------------------------------------------+
|                       FINFLOW CLOUD BACKEND (SYNC ENGINE)                    |
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

### 3.1 Client Layer
- **Web App (`apps/web`)**: Dibangun dengan framework modern Next.js/React, responsif untuk layar smartphone, tablet, maupun layar desktop lebar. Menggunakan IndexedDB/Wasm SQLite untuk penyimpanan lokal di browser.
- **Mobile App (`apps/mobile`)**: Dibangun dengan Flutter untuk performa native 60-120fps di iOS dan Android. Menggunakan SQLite (`sqflite`) untuk penyimpanan lokal.
- **Shared Types (`packages/shared`)**: Berisi interface domain, validasi skema data, dan DTO sinkronisasi agar Web dan Mobile memiliki kontrak data yang persis sama.

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
