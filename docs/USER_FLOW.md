# Diagram Alur Pengguna (USER_FLOW.md) — CashWise

Dokumen ini merinci diagram alur pengguna (*User Flows*) untuk interaksi utama di Web dan Mobile, disajikan dalam diagram Mermaid yang terstruktur dan mudah diuji.

---

## 1. Alur Registrasi, Onboarding & Inisialisasi Akun

Alur pertama kali pengguna baru membuka CashWise. Sistem membuatkan akun default dan kategori dasar secara otomatis di database lokal sebelum menyinkronkannya ke cloud.

```mermaid
flowchart TD
    Start([Pengguna Membuka Aplikasi]) --> CheckSession{Sudah Punya Akun / Session Aktif?}
    
    CheckSession -- Ya --> LoadLocalData[Muat Database Lokal <br/> IndexedDB / SQLite]
    LoadLocalData --> DashboardView([Tampilkan Dashboard Utama])
    
    CheckSession -- Tidak --> RegisterScreen[Form Registrasi / Login]
    RegisterScreen --> SubmitAuth[Kirim Kredensial ke Server]
    
    SubmitAuth -- Gagal --> ShowAuthError[Tampilkan Pesan Error Valid]
    ShowAuthError --> RegisterScreen
    
    SubmitAuth -- Sukses --> SaveToken[Simpan JWT Secure Token]
    SaveToken --> SeedDefaultData[Inisialisasi Data Default Lokal:<br/>1. Akun 'Dompet Tunai'<br/>2. Kategori Standar Sistem<br/>3. Preferensi Mata Uang 'IDR']
    SeedDefaultData --> PushInitialSync[Kirim State Awal ke Cloud Sync]
    PushInitialSync --> DashboardView
```

---

## 2. Alur Pencatatan Transaksi Kilat (Online & Offline)

Alur pencatatan harian yang mengutamakan kecepatan respon. Dirancang agar dapat diselesaikan dalam < 3 detik tanpa ketergantungan jaringan.

```mermaid
flowchart TD
    Start([Tekan Tombol Tambah Transaksi '+']) --> ChooseType{Pilih Jenis Transaksi}
    
    ChooseType -- Pengeluaran --> FormExpense[Input Nominal, Akun Asal, & Kategori]
    ChooseType -- Pemasukan --> FormIncome[Input Nominal, Akun Tujuan, & Kategori]
    ChooseType -- Transfer --> FormTransfer[Input Nominal, Akun Asal, & Akun Tujuan]
    
    FormExpense --> InputDetails[Isi Tanggal & Catatan Opsional]
    FormIncome --> InputDetails
    FormTransfer --> InputDetails
    
    InputDetails --> ValidateData{Nominal Valid & > 0?}
    ValidateData -- Tidak --> ShowValidationError[Tampilkan Peringatan Input]
    ShowValidationError --> InputDetails
    
    ValidateData -- Ya --> SaveToLocalDB[Simpan Transaksi ke DB Lokal<br/>UUID v4, Version: 1, Status: PENDING]
    SaveToLocalDB --> UpdateAccountBalance[Update Saldo Akun di DB Lokal Secara Atomic]
    UpdateAccountBalance --> EnqueueSync[Tambahkan ke Tabel sync_queue]
    EnqueueSync --> FeedbackSuccess[Berikan Feedback Haptic / UI Instan < 16ms]
    
    FeedbackSuccess --> CheckNetwork{Koneksi Internet Aktif?}
    CheckNetwork -- Ya --> TriggerSync[Trigger Background Delta Sync]
    CheckNetwork -- Tidak --> KeepInQueue[Biarkan di Antrean Lokal Menunggu Sinyal]
    
    TriggerSync --> CloseModal([Kembali ke Dashboard])
    KeepInQueue --> CloseModal
```

---

## 3. Alur Sinkronisasi Latar Belakang & Resolusi Konflik

Mekanisme sinkronisasi otomatis yang berjalan saat koneksi pulih, saat aplikasi dibuka (*app resume*), atau saat interval polling berkala.

```mermaid
flowchart TD
    Trigger([Pemicu: Aplikasi Dibuka / Koneksi Internet Pulih]) --> ReadQueue[Baca Mutasi Berstatus 'PENDING' dari sync_queue]
    
    ReadQueue --> HasPending{Ada Antrean Mutasi?}
    
    HasPending -- Tidak --> PullOnly[Kirim Request Pull Saja<br/>POST /api/v1/sync dengan lastSyncTimestamp]
    HasPending -- Ya --> BatchPushPull[Kemas Mutasi ke Payload Delta<br/>POST /api/v1/sync]
    
    PullOnly --> ServerProcess
    BatchPushPull --> ServerProcess[Server Memproses Payload & Versi Data]
    
    ServerProcess --> CheckConflict{Terdeteksi Konflik Versi?}
    
    CheckConflict -- Tidak --> ApplyChanges[Simpan Perubahan ke PostgreSQL Cloud]
    CheckConflict -- Ya --> ResolveLWW[Selesaikan dengan Last-Write-Wins<br/>Simpan Versi Terlama ke Audit Log]
    
    ResolveLWW --> ApplyChanges
    ApplyChanges --> ReturnResponse[Server Mengembalikan Server Changes Baru]
    
    ReturnResponse --> UpdateLocalDB[Terapkan Server Changes ke DB Lokal]
    UpdateLocalDB --> DequeueSuccess[Hapus Item Sukses dari sync_queue]
    DequeueSuccess --> UpdateLastSyncTime[Perbarui lastSyncTimestamp Lokal]
    UpdateLastSyncTime --> FinishSync([Sinkronisasi Selesai])
```

---

## 4. Alur Penganggaran & Pemantauan Batas Pengeluaran

Alur penetapan batas anggaran dan peringatan otomatis ketika pengeluaran mendekati kuota maksimal.

```mermaid
flowchart TD
    StartBudget([Pengguna Membuka Tab Anggaran]) --> ViewBudgets[Tampilkan Progress Bar Anggaran per Kategori]
    
    ViewBudgets --> CalculateUsage[Hitung: Total Pengeluaran Kategori Bulan Ini / Limit Anggaran]
    
    CalculateUsage --> CheckRatio{Rasio Pengeluaran}
    
    CheckRatio -- "Persen <= 70%" --> StateSafe[Indikator Hijau Emerald<br/>Status: Aman]
    CheckRatio -- "70% < Persen <= 90%" --> StateWarning[Indikator Kuning Amber<br/>Status: Waspada]
    CheckRatio -- "90% < Persen <= 100%" --> StateDanger[Indikator Merah Coral<br/>Status: Kritis]
    CheckRatio -- "Persen > 100%" --> StateOver[Badge Over-Budget Merah Pekat<br/>Tampilkan Nominal Melebihi Batas]
    
    StateSafe --> ActionChoice{Aksi Pengguna}
    StateWarning --> ActionChoice
    StateDanger --> ActionChoice
    StateOver --> ActionChoice
    
    ActionChoice -- Ubah Limit --> FormEditBudget[Ubah Nilai Kuota Anggaran]
    ActionChoice -- Tambah Kategori --> FormNewBudget[Buat Anggaran untuk Kategori Baru]
    ActionChoice -- Cukup Pantau --> Done([Tetap di Halaman])
    
    FormEditBudget --> SaveBudgetLocal[Simpan ke Local DB & Enqueue Sync]
    FormNewBudget --> SaveBudgetLocal
    SaveBudgetLocal --> ViewBudgets
```

---

## 5. Alur Ekspor Laporan Keuangan (Web Application)

Alur pengguna mengekspor rekapan transaksi dan ringkasan bulanan dari antarmuka Web.

```mermaid
flowchart TD
    StartExport([Buka Halaman Laporan di Web]) --> SelectFilter[Pilih Filter Periode: Bulan, Tahun, Akun, Kategori]
    SelectFilter --> PreviewData[Tampilkan Preview Ringkasan Arus Kas & Tabel Transaksi]
    
    PreviewData --> ChooseFormat{Pilih Format Ekspor}
    ChooseFormat -- CSV --> GenerateCSV[Generate File CSV Terformat via Client Web Memory]
    ChooseFormat -- JSON --> GenerateJSON[Generate File JSON Schema Lengkap]
    
    GenerateCSV --> DownloadFile[Trigger Browser Download File]
    GenerateJSON --> DownloadFile
    DownloadFile --> EndExport([File Tersimpan di Perangkat Pengguna])
```
