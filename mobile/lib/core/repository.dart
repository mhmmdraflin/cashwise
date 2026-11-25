import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import 'package:cashwise_mobile/core/db_helper.dart';
import 'package:cashwise_mobile/core/sync_service.dart';

const _uuid = Uuid();

class TransactionRepository {
  final LocalDatabaseHelper _db = LocalDatabaseHelper.instance;

  Future<List<Map<String, dynamic>>> getAll() async {
    final db = await _db.database;
    return db.query('transactions', where: 'deletedAt IS NULL', orderBy: 'date DESC');
  }

  Future<void> create({
    required String type,
    required String accountId,
    String? toAccountId,
    String? categoryId,
    required double amount,
    required String date,
    String? note,
  }) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();
    final id = _uuid.v4();
    final txData = {
      'id': id,
      'userId': '00000000-0000-4000-8000-000000000001',
      'accountId': accountId,
      'toAccountId': toAccountId,
      'categoryId': categoryId,
      'amount': amount,
      'type': type,
      'date': date,
      'note': note,
      'syncStatus': 'PENDING',
      'createdAt': now,
      'updatedAt': now,
      'version': 1,
    };
    await db.insert('transactions', txData);
    await db.insert('sync_queue', {
      'entityType': 'transaction',
      'entityId': id,
      'action': 'CREATE',
      'payload': jsonEncode(txData),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();

    if (type == 'EXPENSE') {
      await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
    } else if (type == 'INCOME') {
      await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, accountId]);
    } else if (type == 'TRANSFER' && toAccountId != null) {
      await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
      await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toAccountId]);
    }
  }

  Future<void> update(String id, {
    required String type,
    required String accountId,
    String? toAccountId,
    String? categoryId,
    required double amount,
    required String date,
    String? note,
  }) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();

    final old = await db.query('transactions', where: 'id = ?', whereArgs: [id]);
    if (old.isNotEmpty) {
      final o = old.first;
      final oldType = o['type'] as String;
      final oldAmount = o['amount'] as double;
      final oldAccountId = o['accountId'] as String;
      final oldToAccountId = o['toAccountId'] as String?;

      if (oldType == 'EXPENSE') {
        await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldAmount, oldAccountId]);
      } else if (oldType == 'INCOME') {
        await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [oldAmount, oldAccountId]);
      } else if (oldType == 'TRANSFER' && oldToAccountId != null) {
        await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldAmount, oldAccountId]);
        await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [oldAmount, oldToAccountId]);
      }
    }

    final updateData = {
      'id': id,
      'type': type,
      'accountId': accountId,
      'toAccountId': toAccountId,
      'categoryId': categoryId,
      'amount': amount,
      'date': date,
      'note': note,
      'updatedAt': now,
    };
    await db.update('transactions', updateData, where: 'id = ?', whereArgs: [id]);
    await db.insert('sync_queue', {
      'entityType': 'transaction',
      'entityId': id,
      'action': 'UPDATE',
      'payload': jsonEncode(updateData),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();

    if (type == 'EXPENSE') {
      await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
    } else if (type == 'INCOME') {
      await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, accountId]);
    } else if (type == 'TRANSFER' && toAccountId != null) {
      await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
      await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toAccountId]);
    }
  }

  Future<void> delete(String id) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();

    final old = await db.query('transactions', where: 'id = ?', whereArgs: [id]);
    if (old.isNotEmpty) {
      final o = old.first;
      final type = o['type'] as String;
      final amount = o['amount'] as double;
      final accountId = o['accountId'] as String;
      final toAccountId = o['toAccountId'] as String?;

      if (type == 'EXPENSE') {
        await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, accountId]);
      } else if (type == 'INCOME') {
        await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
      } else if (type == 'TRANSFER' && toAccountId != null) {
        await db.rawUpdate('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, accountId]);
        await db.rawUpdate('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, toAccountId]);
      }
    }

    await db.update('transactions', {'deletedAt': now}, where: 'id = ?', whereArgs: [id]);
    await db.insert('sync_queue', {
      'entityType': 'transaction',
      'entityId': id,
      'action': 'DELETE',
      'payload': jsonEncode({'id': id, 'deletedAt': now}),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();
  }
}

class AccountRepository {
  final LocalDatabaseHelper _db = LocalDatabaseHelper.instance;

  Future<List<Map<String, dynamic>>> getAll() async {
    final db = await _db.database;
    return db.query('accounts', where: 'deletedAt IS NULL', orderBy: '`order` ASC');
  }

  Future<void> create({
    required String name,
    required String type,
    required String group,
    required double balance,
    String? description,
  }) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();
    final id = _uuid.v4();
    final maxOrder = Sqflite.firstIntValue(
      await db.rawQuery('SELECT MAX(`order`) FROM accounts WHERE deletedAt IS NULL'),
    ) ?? 0;
    final accData = {
      'id': id,
      'userId': '00000000-0000-4000-8000-000000000001',
      'name': name,
      'type': type,
      'group': group,
      'balance': balance,
      'description': description,
      'order': maxOrder + 1,
      'isGroupHidden': 0,
      'color': '#10B981',
      'icon': '💳',
      'createdAt': now,
      'updatedAt': now,
      'version': 1,
    };
    await db.insert('accounts', accData);
    await db.insert('sync_queue', {
      'entityType': 'account',
      'entityId': id,
      'action': 'CREATE',
      'payload': jsonEncode(accData),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();
  }

  Future<void> update(String id, {String? name, String? group, double? balance, String? description}) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();
    final data = <String, dynamic>{'id': id, 'updatedAt': now};
    if (name != null) data['name'] = name;
    if (group != null) data['group'] = group;
    if (balance != null) data['balance'] = balance;
    if (description != null) data['description'] = description;
    await db.update('accounts', data, where: 'id = ?', whereArgs: [id]);
    await db.insert('sync_queue', {
      'entityType': 'account',
      'entityId': id,
      'action': 'UPDATE',
      'payload': jsonEncode(data),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();
  }

  Future<void> delete(String id) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();
    await db.update('accounts', {'deletedAt': now}, where: 'id = ?', whereArgs: [id]);
    await db.insert('sync_queue', {
      'entityType': 'account',
      'entityId': id,
      'action': 'DELETE',
      'payload': jsonEncode({'id': id, 'deletedAt': now}),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();
  }

  Future<void> moveToTop(String id) async {
    final db = await _db.database;
    final minOrder = Sqflite.firstIntValue(
      await db.rawQuery('SELECT MIN(`order`) FROM accounts WHERE deletedAt IS NULL'),
    ) ?? 0;
    await db.update('accounts', {'order': minOrder - 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> toggleGroupHidden(String group, bool hidden) async {
    final db = await _db.database;
    await db.rawUpdate(
      'UPDATE accounts SET isGroupHidden = ? WHERE `group` = ? AND deletedAt IS NULL',
      [hidden ? 1 : 0, group],
    );
  }
}

class CategoryRepository {
  final LocalDatabaseHelper _db = LocalDatabaseHelper.instance;

  Future<List<Map<String, dynamic>>> getAll() async {
    final db = await _db.database;
    return db.query('categories', where: 'deletedAt IS NULL', orderBy: 'name ASC');
  }

  Future<void> create({
    required String name,
    required String type,
    required String icon,
    required String color,
  }) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();
    final id = _uuid.v4();
    final catData = {
      'id': id,
      'userId': '00000000-0000-4000-8000-000000000001',
      'name': name,
      'type': type,
      'icon': icon,
      'color': color,
      'isDefault': 0,
      'createdAt': now,
      'updatedAt': now,
      'version': 1,
    };
    await db.insert('categories', catData);
    await db.insert('sync_queue', {
      'entityType': 'category',
      'entityId': id,
      'action': 'CREATE',
      'payload': jsonEncode(catData),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();
  }

  Future<void> update(String id, {String? name, String? type, String? icon, String? color}) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();
    final data = <String, dynamic>{'id': id, 'updatedAt': now};
    if (name != null) data['name'] = name;
    if (type != null) data['type'] = type;
    if (icon != null) data['icon'] = icon;
    if (color != null) data['color'] = color;
    await db.update('categories', data, where: 'id = ?', whereArgs: [id]);
    await db.insert('sync_queue', {
      'entityType': 'category',
      'entityId': id,
      'action': 'UPDATE',
      'payload': jsonEncode(data),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();
  }

  Future<void> delete(String id) async {
    final db = await _db.database;
    final now = DateTime.now().toIso8601String();
    await db.update('categories', {'deletedAt': now}, where: 'id = ?', whereArgs: [id]);
    await db.insert('sync_queue', {
      'entityType': 'category',
      'entityId': id,
      'action': 'DELETE',
      'payload': jsonEncode({'id': id, 'deletedAt': now}),
      'createdAt': now,
      'status': 'PENDING',
      'retryCount': 0,
    });
    SyncService.instance.sync().ignore();
  }
}
