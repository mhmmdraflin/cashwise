-- ==============================================================================
-- CashWise Cloud PostgreSQL Schema (Supabase / Neon / Self-Hosted)
-- Version: 1.0.0
-- Persistent Cloud Database with Bidirectional Sync & Audit Trail
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NULL, -- Null if OAuth
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 1
);

-- 2. Table: accounts
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK(type IN ('CASH', 'BANK', 'E_WALLET', 'INVESTMENT', 'CREDIT_CARD')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    color VARCHAR(20) NOT NULL DEFAULT '#10B981',
    icon VARCHAR(50) NOT NULL DEFAULT 'wallet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pg_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_pg_accounts_updated ON accounts(updated_at);

-- 3. Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
    icon VARCHAR(50) NOT NULL DEFAULT 'tag',
    color VARCHAR(20) NOT NULL DEFAULT '#F43F5E',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pg_categories_user ON categories(user_id);

-- 4. Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    to_account_id UUID NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK(amount > 0),
    type VARCHAR(20) NOT NULL CHECK(type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    date TIMESTAMPTZ NOT NULL,
    note TEXT NULL,
    tags TEXT[] NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pg_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pg_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_pg_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_pg_transactions_updated ON transactions(updated_at);

-- 5. Table: budgets
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(15, 2) NOT NULL CHECK(limit_amount > 0),
    period VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' CHECK(period IN ('MONTHLY', 'WEEKLY', 'YEARLY')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pg_budgets_user ON budgets(user_id);

-- 6. Table: sync_audit_log (Audit trail untuk deteksi & resolusi konflik LWW)
CREATE TABLE IF NOT EXISTS sync_audit_log (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    client_version INT NOT NULL,
    server_version INT NOT NULL,
    resolution VARCHAR(30) NOT NULL, -- 'ACCEPTED', 'SERVER_WON', 'CLIENT_WON'
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pg_audit_user ON sync_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pg_audit_created ON sync_audit_log(created_at DESC);
