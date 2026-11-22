-- ==============================================================================
-- CashWise Local SQLite Schema (Mobile Flutter & SQLite-WASM)
-- Version: 1.0.0
-- Offline-First Local Database with Atomic Transactions & Sync Queue
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IDR',
    createdAt TEXT NOT NULL, -- ISO 8601
    updatedAt TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
);

-- 2. Table: accounts (Rekening & Kantong Finansial)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('CASH', 'BANK', 'E_WALLET', 'INVESTMENT', 'CREDIT_CARD')),
    balance REAL NOT NULL DEFAULT 0.0,
    color TEXT NOT NULL DEFAULT '#10B981',
    icon TEXT NOT NULL DEFAULT 'wallet',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT NULL, -- Tombstone soft-delete
    version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);
CREATE INDEX IF NOT EXISTS idx_accounts_deletedAt ON accounts(deletedAt);

-- 3. Table: categories (Kategori Pemasukan & Pengeluaran)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
    icon TEXT NOT NULL DEFAULT 'tag',
    color TEXT NOT NULL DEFAULT '#F43F5E',
    isDefault INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_userId ON categories(userId);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- 4. Table: transactions (Pencatatan Keuangan Kilat)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    toAccountId TEXT NULL, -- Terisi hanya jika jenis TRANSFER
    categoryId TEXT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    date TEXT NOT NULL, -- ISO 8601
    note TEXT NULL,
    tags TEXT NULL, -- JSON array string e.g. '["makan", "kantor"]'
    syncStatus TEXT NOT NULL DEFAULT 'PENDING' CHECK(syncStatus IN ('SYNCED', 'PENDING', 'CONFLICT')),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (accountId) REFERENCES accounts(id),
    FOREIGN KEY (toAccountId) REFERENCES accounts(id),
    FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_deletedAt ON transactions(deletedAt);

-- 5. Table: budgets (Alokasi Kuota Anggaran Bulanan)
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    userId TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    limitAmount REAL NOT NULL CHECK(limitAmount > 0),
    period TEXT NOT NULL DEFAULT 'MONTHLY' CHECK(period IN ('MONTHLY', 'WEEKLY', 'YEARLY')),
    startDate TEXT NOT NULL, -- YYYY-MM-DD
    endDate TEXT NOT NULL, -- YYYY-MM-DD
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_budgets_userId ON budgets(userId);
CREATE INDEX IF NOT EXISTS idx_budgets_categoryId ON budgets(categoryId);

-- 6. Table: sync_queue (Antrean Mutasi Lokal Menuju Cloud)
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entityType TEXT NOT NULL CHECK(entityType IN ('user', 'account', 'category', 'transaction', 'budget')),
    entityId TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE')),
    payload TEXT NOT NULL, -- JSON Snapshot data
    createdAt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SYNCING', 'FAILED')),
    retryCount INTEGER NOT NULL DEFAULT 0,
    lastError TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_createdAt ON sync_queue(createdAt);

-- ==============================================================================
-- Initial Default Seed Data
-- ==============================================================================

INSERT OR IGNORE INTO users (id, email, name, currency, createdAt, updatedAt, version)
VALUES ('00000000-0000-4000-8000-000000000001', 'local-user@cashwise.app', 'Pengguna CashWise', 'IDR', datetime('now'), datetime('now'), 1);

INSERT OR IGNORE INTO accounts (id, userId, name, type, balance, color, icon, createdAt, updatedAt, version)
VALUES 
('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Dompet Tunai', 'CASH', 500000.0, '#10B981', 'wallet', datetime('now'), datetime('now'), 1),
('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'BCA Tabungan', 'BANK', 3500000.0, '#2563EB', 'credit-card', datetime('now'), datetime('now'), 1),
('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'GoPay', 'E_WALLET', 250000.0, '#06B6D4', 'smartphone', datetime('now'), datetime('now'), 1);

INSERT OR IGNORE INTO categories (id, userId, name, type, icon, color, isDefault, createdAt, updatedAt, version)
VALUES
('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Makanan & Minuman', 'EXPENSE', 'utensils', '#F43F5E', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Transportasi & Bensin', 'EXPENSE', 'car', '#F97316', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Tagihan & Utilitas', 'EXPENSE', 'receipt', '#F59E0B', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Belanja Kebutuhan Harian', 'EXPENSE', 'shopping-cart', '#8B5CF6', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', 'Gaji Bulanan', 'INCOME', 'briefcase', '#10B981', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Bonus & Freelance', 'INCOME', 'trending-up', '#14B8A6', 1, datetime('now'), datetime('now'), 1);
