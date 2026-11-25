import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDatabaseHelper {
  static final LocalDatabaseHelper instance = LocalDatabaseHelper._init();
  static Database? _database;

  LocalDatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('cashwise_local.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // 1. Table: users
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'IDR',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
      )
    ''');

    // 2. Table: accounts (with group, description, order, isGroupHidden)
    await db.execute('''
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        `group` TEXT NOT NULL DEFAULT 'Accounts',
        balance REAL NOT NULL DEFAULT 0.0,
        description TEXT NULL,
        `order` INTEGER NOT NULL DEFAULT 0,
        isGroupHidden INTEGER NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#10B981',
        icon TEXT NOT NULL DEFAULT 'wallet',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT NULL,
        version INTEGER NOT NULL DEFAULT 1
      )
    ''');

    // 3. Table: categories (with emoji icon)
    await db.execute('''
      CREATE TABLE categories (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '🏷️',
        color TEXT NOT NULL DEFAULT '#F43F5E',
        isDefault INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT NULL,
        version INTEGER NOT NULL DEFAULT 1
      )
    ''');

    // 4. Table: transactions
    await db.execute('''
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        accountId TEXT NOT NULL,
        toAccountId TEXT NULL,
        categoryId TEXT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT NULL,
        tags TEXT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'PENDING',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT NULL,
        version INTEGER NOT NULL DEFAULT 1
      )
    ''');

    // 5. Table: budgets
    await db.execute('''
      CREATE TABLE budgets (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        limitAmount REAL NOT NULL,
        period TEXT NOT NULL DEFAULT 'MONTHLY',
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT NULL,
        version INTEGER NOT NULL DEFAULT 1
      )
    ''');

    // 6. Table: sync_queue
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retryCount INTEGER NOT NULL DEFAULT 0,
        lastError TEXT NULL
      )
    ''');

    // Initial Seeds
    final now = DateTime.now().toIso8601String();
    await db.rawInsert('''
      INSERT INTO users (id, email, name, currency, createdAt, updatedAt, version)
      VALUES ('00000000-0000-4000-8000-000000000001', 'local-user@cashwise.app', 'Pengguna CashWise', 'IDR', '$now', '$now', 1)
    ''');

    await db.rawInsert('''
      INSERT INTO accounts (id, userId, name, type, `group`, balance, description, `order`, isGroupHidden, color, icon, createdAt, updatedAt, version)
      VALUES 
      ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Dompet Tunai', 'CASH', 'Cash', 500000.0, 'Uang tunai di dompet', 1, 0, '#10B981', '💵', '$now', '$now', 1),
      ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'BCA', 'BANK', 'Accounts', 3500000.0, 'Rekening utama', 2, 0, '#2563EB', '💳', '$now', '$now', 1),
      ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Superbank', 'BANK', 'Accounts', 1000000.0, 'Bank digital', 3, 0, '#06B6D4', '🏦', '$now', '$now', 1),
      ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Blu BCA', 'BANK', 'Savings', 5000000.0, 'Tabungan darurat', 4, 0, '#6366F1', '🔒', '$now', '$now', 1),
      ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'Bibit', 'INVESTMENT', 'Investment', 2500000.0, 'Portofolio reksa dana', 5, 0, '#8B5CF6', '📈', '$now', '$now', 1)
    ''');

    await db.rawInsert('''
      INSERT INTO categories (id, userId, name, type, icon, color, isDefault, createdAt, updatedAt, version)
      VALUES 
      ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Makanan', 'EXPENSE', '🍔', '#F43F5E', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Transportasi', 'EXPENSE', '🚗', '#F97316', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Belanja', 'EXPENSE', '🛒', '#8B5CF6', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Tagihan', 'EXPENSE', '🏠', '#F59E0B', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'Hiburan', 'EXPENSE', '🎮', '#EC4899', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', 'Kesehatan', 'EXPENSE', '🏥', '#06B6D4', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', 'Pendidikan', 'EXPENSE', '📚', '#3B82F6', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', 'Lainnya', 'EXPENSE', '🏷️', '#64748B', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', 'Gaji', 'INCOME', '💼', '#10B981', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Bonus & Freelance', 'INCOME', '📈', '#14B8A6', 1, '$now', '$now', 1),
      ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'Hadiah', 'INCOME', '🎁', '#EC4899', 1, '$now', '$now', 1)
    ''');
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
