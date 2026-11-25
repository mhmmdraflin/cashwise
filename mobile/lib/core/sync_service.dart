import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:cashwise_mobile/core/db_helper.dart';

enum SyncStatus { idle, syncing, synced, offline, error }

class SyncResult {
  final bool success;
  final int appliedCount;
  final int inboundCount;
  final String? error;

  SyncResult({
    required this.success,
    this.appliedCount = 0,
    this.inboundCount = 0,
    this.error,
  });
}

class SyncService {
  static final SyncService instance = SyncService._();
  SyncService._();

  final LocalDatabaseHelper _db = LocalDatabaseHelper.instance;
  final ValueNotifier<SyncStatus> statusNotifier = ValueNotifier<SyncStatus>(SyncStatus.idle);
  String? lastSyncTimestamp;

  String get defaultServerUrl {
    // 10.0.2.2 for Android Emulator, localhost for macOS / iOS Simulator
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://127.0.0.1:3000';
  }

  Future<SyncResult> sync({String? baseUrl}) async {
    final serverUrl = baseUrl ?? defaultServerUrl;
    statusNotifier.value = SyncStatus.syncing;

    try {
      final db = await _db.database;
      final pendingRows = await db.query('sync_queue', where: "status = 'PENDING'");

      final mutations = pendingRows.map((r) {
        return {
          'id': r['id'],
          'entityType': r['entityType'],
          'entityId': r['entityId'],
          'action': r['action'],
          'payload': r['payload'],
          'createdAt': r['createdAt'],
          'status': 'PENDING',
          'retryCount': r['retryCount'],
        };
      }).toList();

      final client = HttpClient();
      client.connectionTimeout = const Duration(seconds: 6);

      final uri = Uri.parse('$serverUrl/api/sync');
      final request = await client.postUrl(uri);
      request.headers.contentType = ContentType.json;
      request.headers.add('X-Device-Id', 'mobile-${Platform.operatingSystem}');

      final body = jsonEncode({
        'deviceId': 'mobile-${Platform.operatingSystem}',
        'lastSyncTimestamp': lastSyncTimestamp ?? DateTime.fromMillisecondsSinceEpoch(0).toIso8601String(),
        'mutations': mutations,
      });

      request.write(body);
      final response = await request.close();
      final rawResponse = await response.transform(utf8.decoder).join();
      client.close();

      if (response.statusCode != 200) {
        throw Exception('Server returned ${response.statusCode}: $rawResponse');
      }

      final json = jsonDecode(rawResponse) as Map<String, dynamic>;
      final data = json['data'] as Map<String, dynamic>;

      // 1. Mark and clear sent mutations
      for (final row in pendingRows) {
        await db.update('sync_queue', {'status': 'SYNCED'}, where: 'id = ?', whereArgs: [row['id']]);
      }
      await db.delete('sync_queue', where: "status = 'SYNCED'");

      // 2. Inbound changes processing
      int inboundCount = 0;
      final serverChanges = data['serverChanges'] as Map<String, dynamic>?;

      if (serverChanges != null) {
        // Accounts
        final accounts = serverChanges['accounts'] as List<dynamic>? ?? [];
        for (final item in accounts) {
          final acc = Map<String, dynamic>.from(item as Map);
          await db.insert('accounts', acc, conflictAlgorithm: ConflictAlgorithm.replace);
          inboundCount++;
        }

        // Categories
        final categories = serverChanges['categories'] as List<dynamic>? ?? [];
        for (final item in categories) {
          final cat = Map<String, dynamic>.from(item as Map);
          await db.insert('categories', cat, conflictAlgorithm: ConflictAlgorithm.replace);
          inboundCount++;
        }

        // Transactions
        final transactions = serverChanges['transactions'] as List<dynamic>? ?? [];
        for (final item in transactions) {
          final tx = Map<String, dynamic>.from(item as Map);
          await db.insert('transactions', tx, conflictAlgorithm: ConflictAlgorithm.replace);
          inboundCount++;
        }
      }

      lastSyncTimestamp = data['serverSyncTimestamp'] as String?;
      statusNotifier.value = SyncStatus.synced;

      return SyncResult(
        success: true,
        appliedCount: data['appliedCount'] as int? ?? 0,
        inboundCount: inboundCount,
      );
    } catch (e) {
      statusNotifier.value = SyncStatus.error;
      return SyncResult(success: false, error: e.toString());
    }
  }
}
