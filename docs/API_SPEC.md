# Spesifikasi API Cloud & Sinkronisasi CashWise (API_SPEC.md)

**Versi:** 1.0.0  
**Protokol:** HTTPS REST / SSE (Server-Sent Events)  
**Format Payload:** JSON (UTF-8)  
**Base URL Produksi:** `https://api.cashwise.app/api/v1`  
**Base URL Lokal:** `http://localhost:4000/api/v1`

---

## 1. Standar Respons & Error Formatting

Semua endpoint mengembalikan respons dengan format seragam:

### Respons Sukses (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-22T10:15:00.000Z"
  }
}
```

### Respons Gagal (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data transaksi tidak valid",
    "details": {
      "amount": "Nominal transaksi wajib lebih besar dari 0."
    }
  }
}
```

---

## 2. Autentikasi & Profil Pengguna

### 2.1 `POST /auth/register`
Mendaftarkan akun pengguna baru.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Budi Santoso",
    "currency": "IDR"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "00000000-0000-4000-8000-000000000001",
        "email": "user@example.com",
        "name": "Budi Santoso",
        "currency": "IDR"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### 2.2 `POST /auth/login`
Autentikasi dan penerbitan JWT Access Token.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):** Mengembalikan user object dan JWT bearer token.

---

## 3. Endpoint Inti Sinkronisasi (`/sync`)

### `POST /sync`
Endpoint utama untuk proses **Bidirectional Delta Sync**. Menerima mutasi lokal yang tertunda di client dan mengembalikan mutasi cloud yang terjadi sejak `lastSyncTimestamp`.

- **Headers Wajib:**
  ```http
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
  X-Device-Id: <client-unique-uuid>
  ```

- **Request Body (`SyncPayload`):**
  ```json
  {
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "lastSyncTimestamp": "2026-11-20T08:00:00.000Z",
    "changes": {
      "accounts": [],
      "categories": [],
      "transactions": [
        {
          "entityId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "action": "CREATE",
          "version": 1,
          "timestamp": "2026-11-22T09:30:00.000Z",
          "data": {
            "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            "userId": "00000000-0000-4000-8000-000000000001",
            "accountId": "10000000-0000-4000-8000-000000000001",
            "amount": 35000,
            "type": "EXPENSE",
            "categoryId": "20000000-0000-4000-8000-000000000001",
            "date": "2026-11-22T09:30:00.000Z",
            "note": "Kopi pagi",
            "version": 1
          }
        }
      ],
      "budgets": []
    }
  }
  ```

- **Response Body (200 OK - `SyncResponse`):**
  ```json
  {
    "success": true,
    "data": {
      "serverSyncTimestamp": "2026-11-22T10:15:30.120Z",
      "appliedCount": 1,
      "conflicts": [],
      "serverChanges": {
        "accounts": [],
        "categories": [],
        "transactions": [],
        "budgets": []
      }
    }
  }
  ```

---

## 4. Endpoint Notifikasi Real-time (Server-Sent Events)

### `GET /sync/events`
Kanal streaming satu arah untuk memberi tahu perangkat mobile/web bahwa ada mutasi baru di server, sehingga client dapat langsung memicu `/sync`.

- **Headers:**
  ```http
  Accept: text/event-stream
  Authorization: Bearer <jwt_token>
  ```
- **Stream Message:**
  ```
  event: data_changed
  data: {"entityType": "transaction", "updatedAt": "2026-11-22T10:15:30.000Z"}
  ```
