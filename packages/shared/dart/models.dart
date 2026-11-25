/// CashWise Shared Dart Domain Models & SQLite Helpers for Mobile Flutter
/// Clean, strongly-typed representations matching TypeScript models 1:1.

class AccountType {
  static const String cash = 'CASH';
  static const String bank = 'BANK';
  static const String eWallet = 'E_WALLET';
  static const String investment = 'INVESTMENT';
  static const String creditCard = 'CREDIT_CARD';
}

class TransactionType {
  static const String income = 'INCOME';
  static const String expense = 'EXPENSE';
  static const String transfer = 'TRANSFER';
}

class BaseEntity {
  final String id;
  final String createdAt;
  final String updatedAt;
  final String? deletedAt;
  final int version;

  BaseEntity({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    this.version = 1,
  });
}

class User extends BaseEntity {
  final String email;
  final String name;
  final String currency;

  User({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    super.deletedAt,
    super.version,
    required this.email,
    required this.name,
    this.currency = 'IDR',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'currency': currency,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'version': version,
    };
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] as String,
      email: map['email'] as String,
      name: map['name'] as String,
      currency: map['currency'] as String? ?? 'IDR',
      createdAt: map['createdAt'] as String,
      updatedAt: map['updatedAt'] as String,
      version: map['version'] as int? ?? 1,
    );
  }
}

class Account extends BaseEntity {
  final String userId;
  final String name;
  final String type;
  final String group;
  final double balance;
  final String? description;
  final int order;
  final bool isGroupHidden;
  final String color;
  final String icon;

  Account({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    super.deletedAt,
    super.version,
    required this.userId,
    required this.name,
    required this.type,
    this.group = 'Accounts',
    required this.balance,
    this.description,
    this.order = 0,
    this.isGroupHidden = false,
    required this.color,
    required this.icon,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'type': type,
      'group': group,
      'balance': balance,
      'description': description,
      'order': order,
      'isGroupHidden': isGroupHidden ? 1 : 0,
      'color': color,
      'icon': icon,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'deletedAt': deletedAt,
      'version': version,
    };
  }

  factory Account.fromMap(Map<String, dynamic> map) {
    return Account(
      id: map['id'] as String,
      userId: map['userId'] as String,
      name: map['name'] as String,
      type: map['type'] as String,
      group: map['group'] as String? ?? 'Accounts',
      balance: (map['balance'] as num).toDouble(),
      description: map['description'] as String?,
      order: map['order'] as int? ?? 0,
      isGroupHidden: (map['isGroupHidden'] as int? ?? 0) == 1,
      color: map['color'] as String,
      icon: map['icon'] as String,
      createdAt: map['createdAt'] as String,
      updatedAt: map['updatedAt'] as String,
      deletedAt: map['deletedAt'] as String?,
      version: map['version'] as int? ?? 1,
    );
  }

  Account copyWith({
    String? name,
    String? type,
    String? group,
    double? balance,
    String? description,
    int? order,
    bool? isGroupHidden,
    String? color,
    String? icon,
    String? updatedAt,
    int? version,
  }) {
    return Account(
      id: id,
      userId: userId,
      name: name ?? this.name,
      type: type ?? this.type,
      group: group ?? this.group,
      balance: balance ?? this.balance,
      description: description ?? this.description,
      order: order ?? this.order,
      isGroupHidden: isGroupHidden ?? this.isGroupHidden,
      color: color ?? this.color,
      icon: icon ?? this.icon,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt,
      version: version ?? this.version,
    );
  }
}

class Category extends BaseEntity {
  final String userId;
  final String name;
  final String type;
  final String icon;
  final String color;
  final bool isDefault;

  Category({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    super.deletedAt,
    super.version,
    required this.userId,
    required this.name,
    required this.type,
    required this.icon,
    required this.color,
    this.isDefault = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'type': type,
      'icon': icon,
      'color': color,
      'isDefault': isDefault ? 1 : 0,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'deletedAt': deletedAt,
      'version': version,
    };
  }

  factory Category.fromMap(Map<String, dynamic> map) {
    return Category(
      id: map['id'] as String,
      userId: map['userId'] as String,
      name: map['name'] as String,
      type: map['type'] as String,
      icon: map['icon'] as String,
      color: map['color'] as String,
      isDefault: (map['isDefault'] as int? ?? 0) == 1,
      createdAt: map['createdAt'] as String,
      updatedAt: map['updatedAt'] as String,
      deletedAt: map['deletedAt'] as String?,
      version: map['version'] as int? ?? 1,
    );
  }
}

class Transaction extends BaseEntity {
  final String userId;
  final String accountId;
  final String? toAccountId;
  final String? categoryId;
  final double amount;
  final String type;
  final String date;
  final String? note;
  final String? tags;
  final String syncStatus;

  Transaction({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    super.deletedAt,
    super.version,
    required this.userId,
    required this.accountId,
    this.toAccountId,
    this.categoryId,
    required this.amount,
    required this.type,
    required this.date,
    this.note,
    this.tags,
    this.syncStatus = 'PENDING',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'accountId': accountId,
      'toAccountId': toAccountId,
      'categoryId': categoryId,
      'amount': amount,
      'type': type,
      'date': date,
      'note': note,
      'tags': tags,
      'syncStatus': syncStatus,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'deletedAt': deletedAt,
      'version': version,
    };
  }

  factory Transaction.fromMap(Map<String, dynamic> map) {
    return Transaction(
      id: map['id'] as String,
      userId: map['userId'] as String,
      accountId: map['accountId'] as String,
      toAccountId: map['toAccountId'] as String?,
      categoryId: map['categoryId'] as String?,
      amount: (map['amount'] as num).toDouble(),
      type: map['type'] as String,
      date: map['date'] as String,
      note: map['note'] as String?,
      tags: map['tags'] as String?,
      syncStatus: map['syncStatus'] as String? ?? 'PENDING',
      createdAt: map['createdAt'] as String,
      updatedAt: map['updatedAt'] as String,
      deletedAt: map['deletedAt'] as String?,
      version: map['version'] as int? ?? 1,
    );
  }
}

class Budget extends BaseEntity {
  final String userId;
  final String categoryId;
  final double limitAmount;
  final String period;
  final String startDate;
  final String endDate;

  Budget({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    super.deletedAt,
    super.version,
    required this.userId,
    required this.categoryId,
    required this.limitAmount,
    this.period = 'MONTHLY',
    required this.startDate,
    required this.endDate,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'categoryId': categoryId,
      'limitAmount': limitAmount,
      'period': period,
      'startDate': startDate,
      'endDate': endDate,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'deletedAt': deletedAt,
      'version': version,
    };
  }

  factory Budget.fromMap(Map<String, dynamic> map) {
    return Budget(
      id: map['id'] as String,
      userId: map['userId'] as String,
      categoryId: map['categoryId'] as String,
      limitAmount: (map['limitAmount'] as num).toDouble(),
      period: map['period'] as String? ?? 'MONTHLY',
      startDate: map['startDate'] as String,
      endDate: map['endDate'] as String,
      createdAt: map['createdAt'] as String,
      updatedAt: map['updatedAt'] as String,
      deletedAt: map['deletedAt'] as String?,
      version: map['version'] as int? ?? 1,
    );
  }
}

class SyncQueueItem {
  final int? id;
  final String entityType;
  final String entityId;
  final String action;
  final String payload;
  final String createdAt;
  final String status;
  final int retryCount;
  final String? lastError;

  SyncQueueItem({
    this.id,
    required this.entityType,
    required this.entityId,
    required this.action,
    required this.payload,
    required this.createdAt,
    this.status = 'PENDING',
    this.retryCount = 0,
    this.lastError,
  });

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'entityType': entityType,
      'entityId': entityId,
      'action': action,
      'payload': payload,
      'createdAt': createdAt,
      'status': status,
      'retryCount': retryCount,
      'lastError': lastError,
    };
  }

  factory SyncQueueItem.fromMap(Map<String, dynamic> map) {
    return SyncQueueItem(
      id: map['id'] as int?,
      entityType: map['entityType'] as String,
      entityId: map['entityId'] as String,
      action: map['action'] as String,
      payload: map['payload'] as String,
      createdAt: map['createdAt'] as String,
      status: map['status'] as String? ?? 'PENDING',
      retryCount: map['retryCount'] as int? ?? 0,
      lastError: map['lastError'] as String?,
    );
  }
}
