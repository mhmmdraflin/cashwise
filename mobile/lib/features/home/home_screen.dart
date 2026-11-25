import 'package:flutter/material.dart';
import 'package:cashwise_mobile/core/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTabIndex = 0; // 0: Transaksi, 1: Akun, 2: Kategori, 3: Statistik

  // Sub-tab for Transaksi: 0: Daily, 1: Calendar, 2: Monthly, 3: Summary
  int _transactionSubTab = 0;

  // Stats selected range: 0: 1D, 1: 1W, 2: 1M, 3: 3M, 4: 1Y
  int _statsRangeIndex = 2; // Default 1M

  // Sample mock state reflecting local SQLite data
  double totalBalance = 12500000.0;
  double totalIncome = 7500000.0;
  double totalExpense = 2350000.0;

  // Accounts grouped
  final Map<String, List<Map<String, dynamic>>> _accountsGrouped = {
    'Cash': [
      {'id': '1', 'name': 'Dompet Tunai', 'amount': 500000.0, 'desc': 'Uang tunai harian', 'icon': '💵'},
    ],
    'Accounts': [
      {'id': '2', 'name': 'BCA', 'amount': 3500000.0, 'desc': 'Rekening utama', 'icon': '💳'},
      {'id': '3', 'name': 'Superbank', 'amount': 1000000.0, 'desc': 'Transaksi digital', 'icon': '🏦'},
    ],
    'Savings': [
      {'id': '4', 'name': 'Blu BCA', 'amount': 5000000.0, 'desc': 'Dana darurat', 'icon': '🔒'},
    ],
    'Investment': [
      {'id': '5', 'name': 'Bibit', 'amount': 2500000.0, 'desc': 'Portofolio reksadana', 'icon': '📈'},
    ],
  };

  final Set<String> _hiddenGroups = {};

  final List<Map<String, dynamic>> _categories = [
    {'name': 'Makanan', 'icon': '🍔', 'type': 'EXPENSE'},
    {'name': 'Transportasi', 'icon': '🚗', 'type': 'EXPENSE'},
    {'name': 'Lainnya', 'icon': '🏷️', 'type': 'EXPENSE'},
    {'name': 'Gaji', 'icon': '💼', 'type': 'INCOME'},
  ];

  void _moveAccountToTop(String group, int index) {
    setState(() {
      final list = _accountsGrouped[group];
      if (list != null && index > 0) {
        final item = list.removeAt(index);
        list.insert(0, item);
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Akun berhasil digeser ke paling atas')),
    );
  }

  void _toggleGroupHide(String group) {
    setState(() {
      if (_hiddenGroups.contains(group)) {
        _hiddenGroups.remove(group);
      } else {
        _hiddenGroups.add(group);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.account_balance_wallet, color: CashWiseColors.emerald600),
            const SizedBox(width: 8),
            Text(
              _currentTabIndex == 0
                  ? 'Transaksi'
                  : _currentTabIndex == 1
                      ? 'Akun & Rekening'
                      : _currentTabIndex == 2
                          ? 'Kategori'
                          : 'Statistik',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: CashWiseColors.slate100,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: CashWiseColors.slate200),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.storage, size: 14, color: CashWiseColors.emerald600),
                SizedBox(width: 4),
                Text('SQLite', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: CashWiseColors.slate700)),
              ],
            ),
          )
        ],
      ),
      body: IndexedStack(
        index: _currentTabIndex,
        children: [
          _buildTransactionsTab(),
          _buildAccountsTab(),
          _buildCategoriesTab(),
          _buildStatsTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentTabIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.receipt_long),
            label: 'Transaksi',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance),
            label: 'Akun',
          ),
          NavigationDestination(
            icon: Icon(Icons.label),
            label: 'Kategori',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart),
            label: 'Statistik',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateTransactionDialog,
        backgroundColor: CashWiseColors.indigo600,
        foregroundColor: CashWiseColors.pureWhite,
        icon: const Icon(Icons.add),
        label: const Text('Catat Transaksi', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  // 1. TRANSAKSI TAB
  Widget _buildTransactionsTab() {
    return Column(
      children: [
        // Sub-tabs: Daily, Calendar, Monthly, Summary
        Container(
          padding: const EdgeInsets.all(8),
          color: CashWiseColors.pureWhite,
          child: Row(
            children: [
              _subTabButton('Daily', 0),
              _subTabButton('Calendar', 1),
              _subTabButton('Monthly', 2),
              _subTabButton('Summary', 3),
            ],
          ),
        ),

        // Summary Bar (Income, Expense, Total)
        Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: CashWiseColors.pureWhite,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CashWiseColors.slate200),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Column(
                children: [
                  const Text('Pemasukan', style: TextStyle(fontSize: 11, color: CashWiseColors.slate500)),
                  const SizedBox(height: 2),
                  Text('+Rp ${(totalIncome / 1000000).toStringAsFixed(1)}jt',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: CashWiseColors.emerald600)),
                ],
              ),
              Container(width: 1, height: 28, color: CashWiseColors.slate200),
              Column(
                children: [
                  const Text('Pengeluaran', style: TextStyle(fontSize: 11, color: CashWiseColors.slate500)),
                  const SizedBox(height: 2),
                  Text('-Rp ${(totalExpense / 1000000).toStringAsFixed(1)}jt',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: CashWiseColors.rose600)),
                ],
              ),
              Container(width: 1, height: 28, color: CashWiseColors.slate200),
              Column(
                children: [
                  const Text('Total Net', style: TextStyle(fontSize: 11, color: CashWiseColors.slate500)),
                  const SizedBox(height: 2),
                  Text('Rp ${((totalIncome - totalExpense) / 1000000).toStringAsFixed(1)}jt',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: CashWiseColors.slate900)),
                ],
              ),
            ],
          ),
        ),

        // Transaction list
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: [
              _transactionTile('Makan Siang Nasi Padang', 'Makanan', 'Dompet Tunai', -45000, '🍔', 'Hari Ini, 12:30'),
              _transactionTile('Isi Bensin Pertamax', 'Transportasi', 'BCA', -100000, '🚗', 'Hari Ini, 08:15'),
              _transactionTile('Gaji Bulanan', 'Gaji', 'BCA', 7500000, '💼', 'Kemarin, 09:00'),
              _transactionTile('Transfer ke Tabungan', 'Transfer', 'BCA ➔ Blu BCA', 1500000, '🔁', '23 Nov 2026'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _subTabButton(String label, int index) {
    final isSelected = _transactionSubTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _transactionSubTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? CashWiseColors.indigo600 : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isSelected ? CashWiseColors.pureWhite : CashWiseColors.slate600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _transactionTile(String note, String cat, String acc, double amount, String icon, String time) {
    final isExpense = amount < 0;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: CashWiseColors.slate100,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(child: Text(icon, style: const TextStyle(fontSize: 18))),
        ),
        title: Text(note, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text('$cat • $acc • $time', style: const TextStyle(fontSize: 11, color: CashWiseColors.slate500)),
        trailing: Text(
          isExpense ? '-Rp ${(amount.abs()).toStringAsFixed(0)}' : '+Rp ${amount.toStringAsFixed(0)}',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            color: isExpense ? CashWiseColors.rose600 : CashWiseColors.emerald600,
          ),
        ),
      ),
    );
  }

  // 2. AKUN TAB
  Widget _buildAccountsTab() {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: _accountsGrouped.entries.map((entry) {
        final group = entry.key;
        final list = entry.value;
        final isHidden = _hiddenGroups.contains(group);

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Column(
            children: [
              // Group Header
              ListTile(
                title: Text(group, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${list.length} Akun'),
                trailing: IconButton(
                  icon: Icon(isHidden ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => _toggleGroupHide(group),
                ),
              ),
              if (!isHidden) ...[
                const Divider(height: 1),
                ...list.asMap().entries.map((itemEntry) {
                  final idx = itemEntry.key;
                  final acc = itemEntry.value;

                  return ListTile(
                    leading: Text(acc['icon'], style: const TextStyle(fontSize: 22)),
                    title: Text(acc['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text(acc['desc'] ?? '', style: const TextStyle(fontSize: 12)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Rp ${(acc['amount'] as double).toStringAsFixed(0)}',
                          style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 4),
                        IconButton(
                          icon: const Icon(Icons.vertical_align_top, size: 18, color: CashWiseColors.indigo600),
                          tooltip: 'Geser ke paling atas',
                          onPressed: () => _moveAccountToTop(group, idx),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }

  // 3. KATEGORI TAB
  Widget _buildCategoriesTab() {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Daftar Kategori Emot', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Tambah'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ..._categories.map((c) {
          final isExpense = c['type'] == 'EXPENSE';
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Text(c['icon'], style: const TextStyle(fontSize: 24)),
              title: Text(c['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
              trailing: Chip(
                label: Text(isExpense ? 'Pengeluaran' : 'Pemasukan',
                    style: TextStyle(color: isExpense ? CashWiseColors.rose600 : CashWiseColors.emerald600, fontSize: 11)),
                backgroundColor: isExpense ? CashWiseColors.rose50 : CashWiseColors.emerald50,
              ),
            ),
          );
        }),
      ],
    );
  }

  // 4. STATS TAB
  Widget _buildStatsTab() {
    final ranges = ['1D', '1W', '1M', '3M', '1Y'];

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // Range selector
        Row(
          children: ranges.asMap().entries.map((entry) {
            final idx = entry.key;
            final r = entry.value;
            final isSel = _statsRangeIndex == idx;

            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _statsRangeIndex = idx),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSel ? CashWiseColors.indigo600 : CashWiseColors.slate100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      r,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isSel ? CashWiseColors.pureWhite : CashWiseColors.slate700,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 16),

        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TOTAL PENGELUARAN', style: TextStyle(fontSize: 12, color: CashWiseColors.slate500, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  '-Rp ${(totalExpense).toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: CashWiseColors.rose600, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                const Text('Pengeluaran per Kategori', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                _catProgress('🍔 Makanan', 1250000, 0.53),
                _catProgress('🚗 Transportasi', 850000, 0.36),
                _catProgress('🏷️ Lainnya', 250000, 0.11),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _catProgress(String label, double amount, double ratio) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 13)),
              Text('Rp ${amount.toStringAsFixed(0)} (${(ratio * 100).toStringAsFixed(0)}%)',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace', fontSize: 13)),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(value: ratio, color: CashWiseColors.rose600, backgroundColor: CashWiseColors.slate100),
        ],
      ),
    );
  }

  void _showCreateTransactionDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Catat Transaksi Kilat', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              const TextField(
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Nominal (Rp)',
                  prefixText: 'Rp ',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Deskripsi / Note',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Transaksi tersimpan di SQLite lokal!')),
                  );
                },
                child: const Text('Simpan Transaksi'),
              ),
            ],
          ),
        );
      },
    );
  }
}
