---
name: hybrid-sync
description: "Procedures and protocols for implementing and testing CashWise bidirectional offline-first synchronization."
allowed-tools: Read Write Edit Glob Grep
---

# Hybrid Sync Runbook

## Protocol Principles
1. **Local-First Write:**
   - Operasi insert, update, dan soft-delete langsung disimpan ke SQLite (Mobile) atau IndexedDB (Web).
   - Simpan entri mutasi ke tabel lokal `sync_queue`.
2. **Delta Push & Pull:**
   - Client mengirimkan array mutasi `sync_queue` yang berstatus `PENDING` beserta `lastSyncTimestamp`.
   - Server memproses mutasi dengan pemeriksaan `version` dan `updatedAt`.
   - Server mengembalikan mutasi yang dibuat oleh client lain sejak `lastSyncTimestamp`.
3. **Conflict Resolution (LWW):**
   - Bila terjadi versi konkuren pada entitas yang sama, versi dengan timestamp pembaruan paling akhir menang (*Last-Write-Wins*).
   - Catat kejadian konflik di log audit server.
4. **Tombstone Cleanup:**
   - Entitas dengan `deletedAt` tidak dihapus fisik sampai semua perangkat terdaftar melewati retensi 30 hari.
