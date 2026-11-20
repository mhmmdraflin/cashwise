# Spesifikasi Protokol Sinkronisasi Data CashWise

CashWise menggunakan protokol sinkronisasi dua arah (**Bidirectional Delta Sync**) yang efisien, hemat bandwidth, dan tangguh terhadap gangguan jaringan.

---

## 1. Alur Sinkronisasi (Sync Flow)

```
[ CLIENT ]                                           [ CLOUD SERVER ]
    |                                                       |
    | 1. Memeriksa antrean mutasi lokal (sync_queue)        |
    | 2. POST /api/v1/sync/pull-push                        |
    |    - deviceId                                         |
    |    - lastSyncTimestamp                                |
    |    - deltaChanges [CREATE, UPDATE, DELETE]            |
    | ----------------------------------------------------> |
    |                                                       |
    |                                    3. Memproses mutasi client:
    |                                       - Cek versi & conflict resolution
    |                                       - Simpan perubahan ke Cloud DB
    |                                    4. Mengambil mutasi cloud yang terjadi
    |                                       sejak `lastSyncTimestamp`
    |                                                       |
    | 5. Mengembalikan respon sinkronisasi:                 |
    |    - serverSyncTimestamp                              |
    |    - appliedCount                                     |
    |    - conflicts (jika ada)                             |
    |    - serverChanges (data baru/terupdate dari cloud)   |
    | <---------------------------------------------------- |
    |                                                       |
    | 6. Terapkan serverChanges ke Database Lokal           |
    | 7. Hapus antrean sync_queue yang sukses terkirim      |
    | 8. Perbarui lastSyncTimestamp lokal                   |
    v                                                       v
```

---

## 2. Kontrak Endpoint API

### `POST /api/v1/sync`
**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "deviceId": "client-uuid-or-device-id",
  "lastSyncTimestamp": "2026-11-20T10:00:00.000Z",
  "changes": {
    "transactions": [
      {
        "entityId": "a5e88df0-63ab-4ef4-9840-7e18d6a858e9",
        "action": "CREATE",
        "version": 1,
        "timestamp": "2026-11-20T10:15:22.000Z",
        "data": {
          "id": "a5e88df0-63ab-4ef4-9840-7e18d6a858e9",
          "userId": "usr_9981",
          "accountId": "acc_001",
          "amount": 45000,
          "type": "EXPENSE",
          "date": "2026-11-20T10:15:00.000Z",
          "note": "Makan siang"
        }
      }
    ]
  }
}
```

**Response Body (200 OK):**
```json
{
  "success": true,
  "serverSyncTimestamp": "2026-11-20T10:20:00.000Z",
  "appliedCount": 1,
  "conflicts": [],
  "serverChanges": {
    "accounts": [],
    "categories": [],
    "transactions": [],
    "budgets": []
  }
}
```

---

## 3. Strategi Penanganan Masalah Jaringan & Edge Cases

1. **Jaringan Terputus di Tengah Request:**
   - Karena transaksi menggunakan UUID yang digenerate di sisi client dan operasi bersifat idempotent, pengiriman ulang tidak akan menduplikasi transaksi.
2. **Koleksi Batching:**
   - Perubahan di client dikelompokkan dalam batch maksimal 100 entitas per request guna menghemat kuota dan memori perangkat bergerak.
3. **Pemberitahuan Latar Belakang (Silent Push / WebSocket):**
   - Saat pengguna melakukan mutasi di Web, server mengirimkan trigger notifikasi ke Mobile agar Mobile segera melakukan pull sinkronisasi otomatis.
