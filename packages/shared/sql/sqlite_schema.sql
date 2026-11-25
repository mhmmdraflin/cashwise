-- ==============================================================================
-- CashWise Local SQLite Schema (Mobile Flutter & SQLite-WASM)
-- Version: 1.1.0
-- Offline-First Local Database with Groups, Sort Order & Emoticon Categories
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

-- 2. Table: accounts (Rekening, Kantong & Investasi)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('CASH', 'BANK', 'E_WALLET', 'INVESTMENT', 'CREDIT_CARD')),
    `group` TEXT NOT NULL DEFAULT 'Accounts', -- Cash, Accounts, Savings, Investment
    balance REAL NOT NULL DEFAULT 0.0,
    description TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    isGroupHidden INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#10B981',
    icon TEXT NOT NULL DEFAULT 'wallet',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT NULL, -- Tombstone soft-delete
    version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);
CREATE INDEX IF NOT EXISTS idx_accounts_group ON accounts(`group`);
CREATE INDEX IF NOT EXISTS idx_accounts_order ON accounts(`order`);
CREATE INDEX IF NOT EXISTS idx_accounts_deletedAt ON accounts(deletedAt);

-- 3. Table: categories (Kategori Pemasukan & Pengeluaran dengan Emot)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
    icon TEXT NOT NULL DEFAULT '🏷️', -- Emoticon/Emoji
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

-- 4. Table: transactions (Pencatatan Keuangan: Daily, Calendar, Monthly, Summary)
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
    tags TEXT NULL, -- JSON array string
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
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
);

-- 6. Table: sync_queue (Antrean Mutasi Lokal Menuju Cloud)
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entityType TEXT NOT NULL CHECK(entityType IN ('user', 'account', 'category', 'transaction', 'budget')),
    entityId TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE')),
    payload TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SYNCING', 'FAILED', 'SYNCED')),
    retryCount INTEGER NOT NULL DEFAULT 0,
    lastError TEXT NULL
);

-- Initial Seeds
INSERT OR IGNORE INTO users (id, email, name, currency, createdAt, updatedAt, version)
VALUES ('00000000-0000-4000-8000-000000000001', 'local-user@cashwise.app', 'Pengguna CashWise', 'IDR', datetime('now'), datetime('now'), 1);

INSERT OR IGNORE INTO accounts (id, userId, name, type, `group`, balance, description, `order`, isGroupHidden, color, icon, createdAt, updatedAt, version)
VALUES 
('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Dompet Tunai', 'CASH', 'Cash', 500000.0, 'Uang tunai di dompet', 1, 0, '#10B981', '💵', datetime('now'), datetime('now'), 1),
('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'BCA', 'BANK', 'Accounts', 3500000.0, 'Rekening utama', 2, 0, '#2563EB', '💳', datetime('now'), datetime('now'), 1),
('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Superbank', 'BANK', 'Accounts', 1000000.0, 'Bank digital', 3, 0, '#06B6D4', '🏦', datetime('now'), datetime('now'), 1),
('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Blu BCA', 'BANK', 'Savings', 5000000.0, 'Tabungan darurat', 4, 0, '#6366F1', '🔒', datetime('now'), datetime('now'), 1),
('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'Bibit', 'INVESTMENT', 'Investment', 2500000.0, 'Portofolio reksa dana', 5, 0, '#8B5CF6', '📈', datetime('now'), datetime('now'), 1);

INSERT OR IGNORE INTO categories (id, userId, name, type, icon, color, isDefault, createdAt, updatedAt, version)
VALUES
('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Makanan', 'EXPENSE', '🍔', '#F43F5E', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Transportasi', 'EXPENSE', '🚗', '#F97316', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', 'Lainnya', 'EXPENSE', '🏷️', '#64748B', 1, datetime('now'), datetime('now'), 1),
('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', 'Gaji', 'INCOME', '💼', '#10B981', 1, datetime('now'), datetime('now'), 1);
