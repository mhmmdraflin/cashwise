import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cashwise_mobile/core/theme.dart';
import 'package:cashwise_mobile/core/repository.dart';
import 'package:cashwise_mobile/core/sync_service.dart';

const _presetEmojis = [
  '🍔','🍕','🍜','☕','🛒','🚗','🚌','⛽','🏠','💡',
  '📱','💊','🎬','🎮','📚','👔','✂️','🎁','🏥','🧾',
  '💼','💰','📈','🏦','💳','🔒','💵','🏷️',
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTab = 0;
  int _txSubTab = 0;
  int _statsRange = 2;
  String _txTypeFilter = 'ALL';
  bool _hideBalance = false;

  final _txRepo = TransactionRepository();
  final _accRepo = AccountRepository();
  final _catRepo = CategoryRepository();

  List<Map<String, dynamic>> _transactions = [];
  List<Map<String, dynamic>> _accounts = [];
  List<Map<String, dynamic>> _categories = [];
  bool _loading = true;

  final _hiddenGroups = <String>{};

  @override
  void initState() {
    super.initState();
    _reload();
    // Auto-sync with cloud backend
    SyncService.instance.sync().then((res) {
      if (res.inboundCount > 0 && mounted) {
        _reload();
      }
    });
  }

  Future<void> _reload() async {
    setState(() => _loading = true);
    final tx = await _txRepo.getAll();
    final acc = await _accRepo.getAll();
    final cat = await _catRepo.getAll();
    setState(() {
      _transactions = tx;
      _accounts = acc;
      _categories = cat;
      _loading = false;
    });
  }

  double get _totalBalance =>
      _accounts.fold(0.0, (s, a) => s + ((a['balance'] as num?)?.toDouble() ?? 0));
  double get _totalIncome =>
      _transactions.where((t) => t['type'] == 'INCOME').fold(0.0, (s, t) => s + ((t['amount'] as num?)?.toDouble() ?? 0));
  double get _totalExpense =>
      _transactions.where((t) => t['type'] == 'EXPENSE').fold(0.0, (s, t) => s + ((t['amount'] as num?)?.toDouble() ?? 0));

  String _catName(String? id) => _categories.firstWhere((c) => c['id'] == id, orElse: () => {'name': 'Lainnya'})['name'] ?? '';
  String _catIcon(String? id) => _categories.firstWhere((c) => c['id'] == id, orElse: () => {'icon': '🏷️'})['icon'] ?? '🏷️';
  String _accName(String? id) => _accounts.firstWhere((a) => a['id'] == id, orElse: () => {'name': '?'})['name'] ?? '?';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: CashWiseColors.indigo600,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: CashWiseLogoMark(size: 20),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'CashWise',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, letterSpacing: -0.3),
                ),
                Text(
                  ['Overview', 'Transaksi', 'Akun & Aset', 'Statistik'][_currentTab],
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: CashWiseColors.slate500),
                ),
              ],
            ),
          ],
        ),
        actions: [
          ValueListenableBuilder<SyncStatus>(
            valueListenable: SyncService.instance.statusNotifier,
            builder: (context, status, _) {
              if (status == SyncStatus.syncing) {
                return const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 10),
                  child: Center(
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: CashWiseColors.indigo600),
                    ),
                  ),
                );
              }
              IconData icon = Icons.cloud_done_rounded;
              Color color = CashWiseColors.emerald600;
              String tooltip = 'Cloud Synced - Ketuk untuk sinkronisasi';

              if (status == SyncStatus.error) {
                icon = Icons.sync_problem_rounded;
                color = CashWiseColors.rose600;
                tooltip = 'Sinkronisasi tertunda - Ketuk untuk coba lagi';
              } else if (status == SyncStatus.offline) {
                icon = Icons.cloud_off_rounded;
                color = CashWiseColors.amber600;
                tooltip = 'Mode Offline';
              } else if (status == SyncStatus.idle) {
                icon = Icons.sync_rounded;
                color = CashWiseColors.slate500;
                tooltip = 'Sinkronisasi sekarang';
              }

              return IconButton(
                icon: Icon(icon, size: 20, color: color),
                tooltip: tooltip,
                onPressed: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  final res = await SyncService.instance.sync();
                  if (!mounted) return;
                  if (res.inboundCount > 0) {
                    _reload();
                  }
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        res.success
                            ? 'Sinkronisasi cloud berhasil (${res.appliedCount} terkirim, ${res.inboundCount} diterima)'
                            : 'Sinkronisasi gagal: ${res.error ?? "Offline"}',
                      ),
                      duration: const Duration(seconds: 2),
                      backgroundColor: res.success ? CashWiseColors.emerald600 : CashWiseColors.rose600,
                    ),
                  );
                },
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.palette_outlined, size: 20),
            tooltip: 'Penyesuaian Background',
            onPressed: () => _showAppearanceSheet(context),
          ),
          TextButton.icon(
            onPressed: () => _showCategoriesSheet(context),
            icon: const Text('🏷️', style: TextStyle(fontSize: 14)),
            label: const Text('Kategori', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            style: TextButton.styleFrom(
              foregroundColor: CashWiseColors.indigo600,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            ),
          ),
          IconButton(
            icon: Icon(
              themeModeNotifier.value == ThemeMode.dark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              size: 20,
            ),
            tooltip: 'Ganti Tema',
            onPressed: () {
              themeModeNotifier.value = themeModeNotifier.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
              setState(() {});
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
          : IndexedStack(
              index: _currentTab,
              children: [
                _buildHomeTab(),
                _buildTransactionsTab(),
                _buildAccountsTab(),
                _buildStatsTab(),
              ],
            ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: CashWiseColors.slate200)),
        ),
        child: NavigationBar(
          selectedIndex: _currentTab,
          onDestinationSelected: (i) => setState(() => _currentTab = i),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_rounded), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.receipt_long_rounded), label: 'Transaksi'),
            NavigationDestination(icon: Icon(Icons.account_balance_rounded), label: 'Akun'),
            NavigationDestination(icon: Icon(Icons.bar_chart_rounded), label: 'Statistik'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showTransactionForm(context),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Catat', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
    );
  }

  // ─── HOME TAB ───
  Widget _buildHomeTab() {
    final recentTx = _transactions.take(5).toList();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      children: [
        // Total Net Worth Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'TOTAL NET WORTH',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: CashWiseColors.slate400,
                      letterSpacing: 0.8,
                    ),
                  ),
                  InkWell(
                    onTap: () => setState(() => _hideBalance = !_hideBalance),
                    borderRadius: BorderRadius.circular(20),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        _hideBalance ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                        size: 18,
                        color: CashWiseColors.slate400,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                _hideBalance ? '••••••••' : formatRupiah(_totalBalance),
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'monospace',
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: CashWiseColors.emerald600.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.trending_up_rounded, size: 14, color: Color(0xFF34D399)),
                        SizedBox(width: 4),
                        Text(
                          '+12.4%',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF34D399),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'vs bulan lalu',
                    style: TextStyle(fontSize: 11, color: CashWiseColors.slate400),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // 2-Col KPI: Pemasukan & Pengeluaran
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? CashWiseColors.darkSurface : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? CashWiseColors.darkBorder : CashWiseColors.slate200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: CashWiseColors.emerald50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(Icons.arrow_downward_rounded, size: 14, color: CashWiseColors.emerald600),
                        ),
                        const SizedBox(width: 6),
                        const Text('Pemasukan', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: CashWiseColors.slate500)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        '+${formatRupiah(_totalIncome)}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'monospace',
                          color: CashWiseColors.emerald600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? CashWiseColors.darkSurface : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? CashWiseColors.darkBorder : CashWiseColors.slate200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: CashWiseColors.rose50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(Icons.arrow_upward_rounded, size: 14, color: CashWiseColors.rose600),
                        ),
                        const SizedBox(width: 6),
                        const Text('Pengeluaran', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: CashWiseColors.slate500)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        '-${formatRupiah(_totalExpense)}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'monospace',
                          color: CashWiseColors.rose600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // Akun Saya
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Akun Saya',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: -0.2),
            ),
            GestureDetector(
              onTap: () => setState(() => _currentTab = 2),
              child: const Text(
                'Lihat Semua',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: CashWiseColors.indigo600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 86,
          child: _accounts.isEmpty
              ? const Center(child: Text('Belum ada akun', style: TextStyle(fontSize: 12, color: CashWiseColors.slate400)))
              : ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _accounts.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final acc = _accounts[i];
                    return Container(
                      width: 140,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? CashWiseColors.darkSurface : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isDark ? CashWiseColors.darkBorder : CashWiseColors.slate200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(acc['icon'] ?? '💳', style: const TextStyle(fontSize: 16)),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  acc['name'] ?? '',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            formatRupiah((acc['balance'] as num?)?.toDouble() ?? 0),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),

        const SizedBox(height: 20),

        // Transaksi Terakhir
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Transaksi Terakhir',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: -0.2),
            ),
            GestureDetector(
              onTap: () => setState(() => _currentTab = 1),
              child: const Text(
                'Lihat Semua',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: CashWiseColors.indigo600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (recentTx.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text('Belum ada transaksi', style: TextStyle(color: CashWiseColors.slate400, fontSize: 13)),
            ),
          )
        else
          ...recentTx.map((tx) => _txTile(tx)),
        const SizedBox(height: 70),
      ],
    );
  }

  // ─── TRANSACTIONS TAB ───
  Widget _buildTransactionsTab() {
    final subTabs = ['Daftar', 'Ringkasan'];
    final filtered = _txTypeFilter == 'ALL'
        ? _transactions
        : _transactions.where((t) => t['type'] == _txTypeFilter).toList();

    return Column(
      children: [
        // SubTabs switcher
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: List.generate(subTabs.length, (i) {
              final sel = _txSubTab == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _txSubTab = i),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: sel ? CashWiseColors.indigo600 : CashWiseColors.slate100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        subTabs[i],
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: sel ? CashWiseColors.pureWhite : CashWiseColors.slate600,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        // Filter chips (Semua, Pengeluaran, Pemasukan, Transfer)
        if (_txSubTab == 0)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                _filterChip('ALL', 'Semua'),
                const SizedBox(width: 6),
                _filterChip('EXPENSE', 'Pengeluaran', CashWiseColors.rose600),
                const SizedBox(width: 6),
                _filterChip('INCOME', 'Pemasukan', CashWiseColors.emerald600),
                const SizedBox(width: 6),
                _filterChip('TRANSFER', 'Transfer', CashWiseColors.blue600),
              ],
            ),
          ),
        // Summary bar
        Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardTheme.color ?? CashWiseColors.pureWhite,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CashWiseColors.slate200),
          ),
          child: Row(
            children: [
              _summaryCol('Pemasukan', '+${formatRupiah(_totalIncome)}', CashWiseColors.emerald600),
              Container(width: 1, height: 32, color: CashWiseColors.slate200),
              _summaryCol('Pengeluaran', '-${formatRupiah(_totalExpense)}', CashWiseColors.rose600),
              Container(width: 1, height: 32, color: CashWiseColors.slate200),
              _summaryCol('Saldo', formatRupiah(_totalBalance), Theme.of(context).colorScheme.onSurface),
            ],
          ),
        ),
        Expanded(
          child: _txSubTab == 1
              ? _buildSummarySubView()
              : filtered.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.receipt_long_rounded, size: 48, color: CashWiseColors.slate300),
                          SizedBox(height: 8),
                          Text('Belum ada transaksi', style: TextStyle(color: CashWiseColors.slate500, fontSize: 14)),
                          SizedBox(height: 4),
                          Text('Ketuk "Catat" untuk menambahkan', style: TextStyle(color: CashWiseColors.slate400, fontSize: 12)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: filtered.length,
                      itemBuilder: (_, i) => _txTile(filtered[i]),
                    ),
        ),
      ],
    );
  }

  Widget _filterChip(String type, String label, [Color? color]) {
    final sel = _txTypeFilter == type;
    final activeColor = color ?? CashWiseColors.indigo600;
    return GestureDetector(
      onTap: () => setState(() => _txTypeFilter = type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? activeColor.withValues(alpha: 0.15) : CashWiseColors.slate100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: sel ? activeColor : CashWiseColors.slate200,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            color: sel ? activeColor : CashWiseColors.slate600,
          ),
        ),
      ),
    );
  }

  Widget _summaryCol(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: CashWiseColors.slate500)),
          const SizedBox(height: 2),
          FittedBox(
            child: Text(value, style: TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace', color: color, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _txTile(Map<String, dynamic> tx) {
    final type = tx['type'] as String;
    final amount = (tx['amount'] as num).toDouble();
    final isExpense = type == 'EXPENSE';
    final isTransfer = type == 'TRANSFER';
    final note = tx['note'] as String? ?? '';
    final dateStr = tx['date'] as String? ?? '';
    final catId = tx['categoryId'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showTransactionForm(context, existing: tx),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: isTransfer
                      ? CashWiseColors.indigo50
                      : isExpense
                          ? CashWiseColors.rose50
                          : CashWiseColors.emerald50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    isTransfer ? '↔' : _catIcon(catId),
                    style: const TextStyle(fontSize: 18),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      note.isNotEmpty ? note : (isTransfer ? 'Transfer' : _catName(catId)),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: CashWiseColors.slate900),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isTransfer
                          ? '${_accName(tx['accountId'])} → ${_accName(tx['toAccountId'])}'
                          : '${_catIcon(catId)} ${_catName(catId)} · ${_accName(tx['accountId'])}',
                      style: const TextStyle(fontSize: 11, color: CashWiseColors.slate500),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    if (dateStr.isNotEmpty)
                      Text(
                        dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr,
                        style: const TextStyle(fontSize: 10, color: CashWiseColors.slate400),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    isExpense ? '-${formatRupiah(amount)}' : isTransfer ? formatRupiah(amount) : '+${formatRupiah(amount)}',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: isExpense ? CashWiseColors.rose600 : isTransfer ? CashWiseColors.blue600 : CashWiseColors.emerald600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  InkWell(
                    onTap: () => _confirmDelete(context, 'transaksi', () async {
                      await _txRepo.delete(tx['id'] as String);
                      await _reload();
                    }),
                    borderRadius: BorderRadius.circular(4),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.delete_outline_rounded, size: 16, color: CashWiseColors.slate400),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummarySubView() {
    final expenses = <String, double>{};
    for (final t in _transactions) {
      if (t['type'] == 'EXPENSE' && t['categoryId'] != null) {
        final cid = t['categoryId'] as String;
        expenses[cid] = (expenses[cid] ?? 0) + ((t['amount'] as num).toDouble());
      }
    }
    final sorted = expenses.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    if (sorted.isEmpty) {
      return const Center(child: Text('Belum ada data pengeluaran', style: TextStyle(color: CashWiseColors.slate500)));
    }
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TOTAL PENGELUARAN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: CashWiseColors.slate500, letterSpacing: 0.5)),
                const SizedBox(height: 4),
                Text('-${formatRupiah(_totalExpense)}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, fontFamily: 'monospace', color: CashWiseColors.rose600)),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                const Text('Per Kategori', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                const SizedBox(height: 8),
                ...sorted.map((e) {
                  final ratio = _totalExpense > 0 ? e.value / _totalExpense : 0.0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${_catIcon(e.key)} ${_catName(e.key)}', style: const TextStyle(fontSize: 13)),
                            Text('${formatRupiah(e.value)} (${(ratio * 100).toStringAsFixed(0)}%)',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace', fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: ratio,
                            minHeight: 6,
                            color: CashWiseColors.rose600,
                            backgroundColor: CashWiseColors.slate100,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── ACCOUNTS TAB ───
  Widget _buildAccountsTab() {
    final grouped = <String, List<Map<String, dynamic>>>{};
    for (final a in _accounts) {
      final g = a['group'] as String? ?? 'Accounts';
      grouped.putIfAbsent(g, () => []).add(a);
    }
    final order = ['Cash', 'Accounts', 'Savings', 'Investment'];
    final keys = grouped.keys.toList()..sort((a, b) {
      final ia = order.indexOf(a);
      final ib = order.indexOf(b);
      if (ia != -1 && ib != -1) return ia.compareTo(ib);
      if (ia != -1) return -1;
      if (ib != -1) return 1;
      return a.compareTo(b);
    });

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // Net worth card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TOTAL SALDO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: CashWiseColors.slate500, letterSpacing: 0.5)),
                const SizedBox(height: 4),
                Text(formatRupiah(_totalBalance), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, fontFamily: 'monospace', color: CashWiseColors.slate900)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Add button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () => _showAccountForm(context),
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Tambah Akun'),
          ),
        ),
        const SizedBox(height: 12),
        ...keys.map((grpKey) {
          final list = grouped[grpKey]!;
          final hidden = _hiddenGroups.contains(grpKey);
          final groupTotal = list.fold(0.0, (s, a) => s + ((a['balance'] as num?)?.toDouble() ?? 0));
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Column(
              children: [
                InkWell(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  onTap: () => setState(() {
                    hidden ? _hiddenGroups.remove(grpKey) : _hiddenGroups.add(grpKey);
                  }),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Icon(_groupIcon(grpKey), size: 18, color: CashWiseColors.slate600),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(grpKey, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                              Text('${list.length} akun', style: const TextStyle(fontSize: 11, color: CashWiseColors.slate500)),
                            ],
                          ),
                        ),
                        Text(formatRupiah(groupTotal), style: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace', fontSize: 13, color: CashWiseColors.slate900)),
                        const SizedBox(width: 8),
                        Icon(hidden ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18, color: CashWiseColors.slate400),
                      ],
                    ),
                  ),
                ),
                if (!hidden) ...[
                  const Divider(height: 1),
                  ...list.asMap().entries.map((entry) {
                    final acc = entry.value;
                    return InkWell(
                      onTap: () => _showAccountForm(context, existing: acc),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 36, height: 36,
                              decoration: BoxDecoration(
                                color: CashWiseColors.slate100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(child: Text(acc['icon'] ?? '💳', style: const TextStyle(fontSize: 18))),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(acc['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                  if ((acc['description'] ?? '').toString().isNotEmpty)
                                    Text(acc['description'], style: const TextStyle(fontSize: 11, color: CashWiseColors.slate500)),
                                ],
                              ),
                            ),
                            Text(formatRupiah((acc['balance'] as num?)?.toDouble() ?? 0),
                                style: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace', fontSize: 13)),
                            const SizedBox(width: 4),
                            PopupMenuButton<String>(
                              iconSize: 18,
                              icon: const Icon(Icons.more_vert_rounded, size: 18, color: CashWiseColors.slate400),
                              onSelected: (val) async {
                                if (val == 'top') {
                                  await _accRepo.moveToTop(acc['id'] as String);
                                  await _reload();
                                } else if (val == 'delete') {
                                  _confirmDelete(context, 'akun', () async {
                                    await _accRepo.delete(acc['id'] as String);
                                    await _reload();
                                  });
                                }
                              },
                              itemBuilder: (_) => [
                                const PopupMenuItem(value: 'top', child: Text('Geser ke paling atas')),
                                const PopupMenuItem(value: 'delete', child: Text('Hapus', style: TextStyle(color: CashWiseColors.rose600))),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ],
            ),
          );
        }),
      ],
    );
  }

  IconData _groupIcon(String g) {
    switch (g) {
      case 'Cash': return Icons.wallet_rounded;
      case 'Accounts': return Icons.account_balance_rounded;
      case 'Savings': return Icons.savings_rounded;
      case 'Investment': return Icons.trending_up_rounded;
      default: return Icons.credit_card_rounded;
    }
  }

  // ─── CATEGORIES HELPER ───
  Widget _catSection(String title, List<Map<String, dynamic>> cats, Color accent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(width: 3, height: 16, decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 8),
            Text('$title (${cats.length})', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: accent)),
          ],
        ),
        const SizedBox(height: 8),
        if (cats.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Center(child: Text('Belum ada kategori ${title.toLowerCase()}', style: const TextStyle(color: CashWiseColors.slate400, fontSize: 13))),
          )
        else
          ...cats.map((c) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => _showCategoryForm(context, existing: c),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(child: Text(c['icon'] ?? '🏷️', style: const TextStyle(fontSize: 20))),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(c['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline_rounded, size: 18, color: CashWiseColors.slate400),
                      onPressed: () => _confirmDelete(context, 'kategori', () async {
                        await _catRepo.delete(c['id'] as String);
                        await _reload();
                      }),
                    ),
                  ],
                ),
              ),
            ),
          )),
      ],
    );
  }

  void _showCategoriesSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final expCats = _categories.where((c) => c['type'] == 'EXPENSE').toList();
        final incCats = _categories.where((c) => c['type'] == 'INCOME').toList();
        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ListView(
                controller: scrollController,
                children: [
                  const SizedBox(height: 12),
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: CashWiseColors.slate300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Kategori Transaksi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          Text('Kelola pos pengeluaran & pemasukan', style: TextStyle(fontSize: 12, color: CashWiseColors.slate500)),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(ctx);
                          _showCategoryForm(context);
                        },
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: const Text('Tambah', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _catSection('Pengeluaran', expCats, CashWiseColors.rose600),
                  const SizedBox(height: 16),
                  _catSection('Pemasukan', incCats, CashWiseColors.emerald600),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showAppearanceSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        var currentPreset = customMobileBgNotifier.value;
        final isDark = Theme.of(context).brightness == Brightness.dark;
        var activeColors = isDark ? currentPreset.dark : currentPreset.light;

        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            final pBg = activeColors.primary;
            final cBg = activeColors.card;
            final sBg = activeColors.secondary;

            return DraggableScrollableSheet(
              initialChildSize: 0.9,
              maxChildSize: 0.95,
              minChildSize: 0.5,
              expand: false,
              builder: (_, scrollController) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: ListView(
                    controller: scrollController,
                    children: [
                      const SizedBox(height: 12),
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: CashWiseColors.slate300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Contextual Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.arrow_back_rounded, size: 20),
                                onPressed: () => Navigator.pop(ctx),
                              ),
                              const SizedBox(width: 4),
                              const Text('Appearance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                            ],
                          ),
                          TextButton(
                            onPressed: () {
                              setSheetState(() {
                                currentPreset = mobileBgPresets[0];
                                activeColors = isDark ? currentPreset.dark : currentPreset.light;
                              });
                            },
                            child: const Text('Reset', style: TextStyle(fontWeight: FontWeight.w700, color: CashWiseColors.slate500)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Live Mobile Preview
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardTheme.color,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: CashWiseColors.slate200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Live Preview', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: CashWiseColors.slate500)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: CashWiseColors.emerald50,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text('WCAG AA Pass', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: CashWiseColors.emerald600)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            // Mini Canvas
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: pBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: CashWiseColors.slate200),
                              ),
                              child: Column(
                                children: [
                                  // Secondary surface bar
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: sBg,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              width: 18,
                                              height: 18,
                                              decoration: BoxDecoration(
                                                color: CashWiseColors.indigo600,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Center(
                                                child: Text('C', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            const Text('CashWise', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                                          ],
                                        ),
                                        const Text('+ Add', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: CashWiseColors.indigo600)),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  // Card surface
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: cBg,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: CashWiseColors.slate200),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('Net Worth', style: TextStyle(fontSize: 10, color: CashWiseColors.slate500)),
                                            Text(
                                              formatRupiah(_totalBalance),
                                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, fontFamily: 'monospace'),
                                            ),
                                          ],
                                        ),
                                        const Text('+7.7%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: CashWiseColors.emerald600)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Presets Horizontal Scroll
                      const Text('Presets', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: CashWiseColors.slate600)),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 36,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: mobileBgPresets.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final p = mobileBgPresets[i];
                            final sel = currentPreset.key == p.key;
                            return GestureDetector(
                              onTap: () {
                                setSheetState(() {
                                  currentPreset = p;
                                  activeColors = isDark ? p.dark : p.light;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: sel ? CashWiseColors.indigo600 : Theme.of(context).cardTheme.color,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: sel ? CashWiseColors.indigo600 : CashWiseColors.slate200),
                                ),
                                child: Text(
                                  p.label,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
                                    color: sel ? Colors.white : CashWiseColors.slate700,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Three Vertical Color Controls
                      _mobileColorCard(
                        'Primary Background',
                        'Main page scaffold',
                        activeColors.hexPrimary,
                        activeColors.primary,
                        () => _pickMobileColor(ctx, 'Primary Background', activeColors.primary, (newC) {
                          setSheetState(() {
                            activeColors = MobileBgColors(primary: newC, card: activeColors.card, secondary: activeColors.secondary);
                          });
                        }),
                      ),
                      const SizedBox(height: 10),
                      _mobileColorCard(
                        'Card Background',
                        'Summary cards & panels',
                        activeColors.hexCard,
                        activeColors.card,
                        () => _pickMobileColor(ctx, 'Card Background', activeColors.card, (newC) {
                          setSheetState(() {
                            activeColors = MobileBgColors(primary: activeColors.primary, card: newC, secondary: activeColors.secondary);
                          });
                        }),
                      ),
                      const SizedBox(height: 10),
                      _mobileColorCard(
                        'Secondary Surface',
                        'Nested & highlighted areas',
                        activeColors.hexSecondary,
                        activeColors.secondary,
                        () => _pickMobileColor(ctx, 'Secondary Surface', activeColors.secondary, (newC) {
                          setSheetState(() {
                            activeColors = MobileBgColors(primary: activeColors.primary, card: activeColors.card, secondary: newC);
                          });
                        }),
                      ),
                      const SizedBox(height: 24),

                      // Apply CTA
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            final updatedPreset = MobileBgPreset(
                              key: currentPreset.key,
                              label: currentPreset.label,
                              light: isDark ? currentPreset.light : activeColors,
                              dark: isDark ? activeColors : currentPreset.dark,
                            );
                            customMobileBgNotifier.value = updatedPreset;
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Tema background berhasil diterapkan')),
                            );
                          },
                          child: const Text('Apply Changes', style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _mobileColorCard(String title, String desc, String hex, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CashWiseColors.slate200),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(fontSize: 11, color: CashWiseColors.slate500)),
              ],
            ),
            Row(
              children: [
                Text(hex, style: const TextStyle(fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: CashWiseColors.slate600)),
                const SizedBox(width: 8),
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: CashWiseColors.slate300),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _pickMobileColor(BuildContext ctx, String label, Color initial, Function(Color) onSelect) {
    final curated = [
      const Color(0xFFF8FAFC),
      const Color(0xFFFFFFFF),
      const Color(0xFFEEF2FF),
      const Color(0xFFF0F9FF),
      const Color(0xFFE0F2FE),
      const Color(0xFFF0FDF4),
      const Color(0xFFDCFCE7),
      const Color(0xFFFAF8F5),
      const Color(0xFFF3EFEA),
      const Color(0xFF0F172A),
      const Color(0xFF1E293B),
      const Color(0xFF334155),
      const Color(0xFF0C192C),
      const Color(0xFF132A4A),
      const Color(0xFF0B1F17),
      const Color(0xFF1C1917),
    ];

    showModalBottomSheet(
      context: ctx,
      builder: (pickerCtx) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Pilih Warna — $label', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: curated.map((c) {
                  return GestureDetector(
                    onTap: () {
                      onSelect(c);
                      Navigator.pop(pickerCtx);
                    },
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: c,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: CashWiseColors.slate300, width: 1.5),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  // ─── STATS TAB ───
  Widget _buildStatsTab() {
    final ranges = ['1H', '1M', '1B', '3B', '1T'];
    final rangeLabels = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', '3 Bulan', '1 Tahun'];
    final now = DateTime.now();
    DateTime start;
    switch (_statsRange) {
      case 0: start = DateTime(now.year, now.month, now.day); break;
      case 1: start = now.subtract(const Duration(days: 7)); break;
      case 2: start = DateTime(now.year, now.month, 1); break;
      case 3: start = DateTime(now.year, now.month - 3, now.day); break;
      case 4: start = DateTime(now.year - 1, now.month, now.day); break;
      default: start = DateTime(now.year, now.month, 1);
    }

    final filtered = _transactions.where((t) {
      final d = DateTime.tryParse(t['date'] as String? ?? '');
      return d != null && d.isAfter(start);
    }).toList();

    final income = filtered.where((t) => t['type'] == 'INCOME').fold(0.0, (s, t) => s + ((t['amount'] as num).toDouble()));
    final expense = filtered.where((t) => t['type'] == 'EXPENSE').fold(0.0, (s, t) => s + ((t['amount'] as num).toDouble()));

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Row(
          children: List.generate(ranges.length, (i) {
            final sel = _statsRange == i;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _statsRange = i),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: sel ? CashWiseColors.indigo600 : CashWiseColors.slate100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(ranges[i], style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: sel ? CashWiseColors.pureWhite : CashWiseColors.slate700)),
                  ),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 6),
        Center(child: Text(rangeLabels[_statsRange], style: const TextStyle(fontSize: 12, color: CashWiseColors.slate500))),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Pemasukan', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: CashWiseColors.slate500)),
                      const SizedBox(height: 4),
                      FittedBox(child: Text('+${formatRupiah(income)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, fontFamily: 'monospace', color: CashWiseColors.emerald600))),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Pengeluaran', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: CashWiseColors.slate500)),
                      const SizedBox(height: 4),
                      FittedBox(child: Text('-${formatRupiah(expense)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, fontFamily: 'monospace', color: CashWiseColors.rose600))),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Selisih Bersih', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: CashWiseColors.slate700)),
                Text(
                  formatRupiah(income - expense),
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, fontFamily: 'monospace', color: (income - expense) >= 0 ? CashWiseColors.emerald600 : CashWiseColors.rose600),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        _buildStatsBreakdown(filtered),
      ],
    );
  }

  Widget _buildStatsBreakdown(List<Map<String, dynamic>> filtered) {
    final exp = <String, double>{};
    for (final t in filtered) {
      if (t['type'] == 'EXPENSE' && t['categoryId'] != null) {
        final cid = t['categoryId'] as String;
        exp[cid] = (exp[cid] ?? 0) + ((t['amount'] as num).toDouble());
      }
    }
    final total = exp.values.fold(0.0, (s, v) => s + v);
    final sorted = exp.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Pengeluaran per Kategori', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 12),
            if (sorted.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: Text('Belum ada data', style: TextStyle(color: CashWiseColors.slate400))),
              )
            else
              ...sorted.map((e) {
                final ratio = total > 0 ? e.value / total : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${_catIcon(e.key)} ${_catName(e.key)}', style: const TextStyle(fontSize: 13)),
                          Text('${(ratio * 100).toStringAsFixed(0)}%', style: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace', fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(value: ratio, minHeight: 6, color: CashWiseColors.rose600, backgroundColor: CashWiseColors.slate100),
                      ),
                      const SizedBox(height: 2),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(formatRupiah(e.value), style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: CashWiseColors.slate600)),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  // ─── FORMS ───
  void _showTransactionForm(BuildContext ctx, {Map<String, dynamic>? existing}) {
    final isEdit = existing != null;
    var type = (existing?['type'] as String?) ?? 'EXPENSE';
    final dateCtl = TextEditingController(text: (existing?['date'] as String?)?.substring(0, 10) ?? DateFormat('yyyy-MM-dd').format(DateTime.now()));
    final amountCtl = TextEditingController(text: isEdit ? ((existing['amount'] as num?)?.toString() ?? '') : '');
    var accountId = (existing?['accountId'] as String?) ?? (_accounts.isNotEmpty ? _accounts.first['id'] as String : '');
    var toAccountId = (existing?['toAccountId'] as String?) ?? (_accounts.length > 1 ? _accounts[1]['id'] as String : '');
    var categoryId = (existing?['categoryId'] as String?) ?? '';
    final noteCtl = TextEditingController(text: existing?['note'] as String? ?? '');

    if (categoryId.isEmpty && _categories.isNotEmpty) {
      categoryId = _categories.firstWhere((c) => c['type'] == type, orElse: () => _categories.first)['id'] as String;
    }

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setLocal) {
          final relevantCats = _categories.where((c) => c['type'] == type).toList();
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom + 16, left: 16, right: 16, top: 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(isEdit ? 'Ubah Transaksi' : 'Catat Transaksi', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Type toggle
                  Row(
                    children: ['EXPENSE', 'INCOME', 'TRANSFER'].map((t) {
                      final sel = type == t;
                      final label = t == 'EXPENSE' ? 'Pengeluaran' : t == 'INCOME' ? 'Pemasukan' : 'Transfer';
                      final color = t == 'EXPENSE' ? CashWiseColors.rose600 : t == 'INCOME' ? CashWiseColors.emerald600 : CashWiseColors.blue600;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setLocal(() {
                            type = t;
                            if (t != 'TRANSFER' && relevantCats.isNotEmpty) {
                              categoryId = _categories.firstWhere((c) => c['type'] == t, orElse: () => _categories.first)['id'] as String;
                            }
                          }),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: sel ? color.withValues(alpha: 0.1) : CashWiseColors.slate100,
                              border: Border.all(color: sel ? color : CashWiseColors.slate200),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: sel ? color : CashWiseColors.slate600))),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                  TextField(controller: dateCtl, decoration: const InputDecoration(labelText: 'Tanggal', suffixIcon: Icon(Icons.calendar_today_rounded, size: 18)),
                    readOnly: true,
                    onTap: () async {
                      final d = await showDatePicker(context: ctx, firstDate: DateTime(2020), lastDate: DateTime(2030), initialDate: DateTime.tryParse(dateCtl.text) ?? DateTime.now());
                      if (d != null) dateCtl.text = DateFormat('yyyy-MM-dd').format(d);
                    },
                  ),
                  const SizedBox(height: 10),
                  TextField(controller: amountCtl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Nominal (Rp)', prefixText: 'Rp ')),
                  const SizedBox(height: 10),
                  if (type == 'TRANSFER') ...[
                    DropdownButtonFormField<String>(
                      initialValue: _accounts.any((a) => a['id'] == accountId) ? accountId : null,
                      decoration: const InputDecoration(labelText: 'Dari Akun'),
                      items: _accounts.map((a) => DropdownMenuItem(value: a['id'] as String, child: Text(a['name'] as String))).toList(),
                      onChanged: (v) => setLocal(() => accountId = v ?? ''),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: _accounts.any((a) => a['id'] == toAccountId) ? toAccountId : null,
                      decoration: const InputDecoration(labelText: 'Ke Akun'),
                      items: _accounts.map((a) => DropdownMenuItem(value: a['id'] as String, child: Text(a['name'] as String))).toList(),
                      onChanged: (v) => setLocal(() => toAccountId = v ?? ''),
                    ),
                  ] else ...[
                    DropdownButtonFormField<String>(
                      initialValue: relevantCats.any((c) => c['id'] == categoryId) ? categoryId : null,
                      decoration: const InputDecoration(labelText: 'Kategori'),
                      items: relevantCats.map((c) => DropdownMenuItem(value: c['id'] as String, child: Text('${c['icon']} ${c['name']}'))).toList(),
                      onChanged: (v) => setLocal(() => categoryId = v ?? ''),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: _accounts.any((a) => a['id'] == accountId) ? accountId : null,
                      decoration: const InputDecoration(labelText: 'Akun'),
                      items: _accounts.map((a) => DropdownMenuItem(value: a['id'] as String, child: Text(a['name'] as String))).toList(),
                      onChanged: (v) => setLocal(() => accountId = v ?? ''),
                    ),
                  ],
                  const SizedBox(height: 10),
                  TextField(controller: noteCtl, decoration: const InputDecoration(labelText: 'Catatan (opsional)')),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final amount = double.tryParse(amountCtl.text.replaceAll('.', '').replaceAll(',', '.'));
                        if (amount == null || amount <= 0) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nominal harus lebih dari 0')));
                          return;
                        }
                        final dateVal = '${dateCtl.text}T${DateTime.now().toIso8601String().substring(11)}';
                        try {
                          final id = existing?['id'] as String?;
                          if (isEdit && id != null) {
                            await _txRepo.update(id, type: type, accountId: accountId, toAccountId: type == 'TRANSFER' ? toAccountId : null, categoryId: type != 'TRANSFER' ? categoryId : null, amount: amount, date: dateVal, note: noteCtl.text.trim().isEmpty ? null : noteCtl.text.trim());
                          } else {
                            await _txRepo.create(type: type, accountId: accountId, toAccountId: type == 'TRANSFER' ? toAccountId : null, categoryId: type != 'TRANSFER' ? categoryId : null, amount: amount, date: dateVal, note: noteCtl.text.trim().isEmpty ? null : noteCtl.text.trim());
                          }
                          if (!ctx.mounted) return;
                          Navigator.pop(ctx);
                          await _reload();
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isEdit ? 'Transaksi diperbarui' : 'Transaksi tersimpan')));
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
                        }
                      },
                      child: Text(isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  void _showAccountForm(BuildContext ctx, {Map<String, dynamic>? existing}) {
    final isEdit = existing != null;
    var group = (existing?['group'] as String?) ?? 'Cash';
    final nameCtl = TextEditingController(text: existing?['name'] as String? ?? '');
    final amountCtl = TextEditingController(text: isEdit ? ((existing['balance'] as num?)?.toString() ?? '') : '');
    final descCtl = TextEditingController(text: existing?['description'] as String? ?? '');

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setLocal) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom + 16, left: 16, right: 16, top: 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(isEdit ? 'Ubah Akun' : 'Tambah Akun', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: group,
                    decoration: const InputDecoration(labelText: 'Group'),
                    items: ['Cash', 'Accounts', 'Savings', 'Investment'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                    onChanged: (v) => setLocal(() => group = v ?? 'Cash'),
                  ),
                  const SizedBox(height: 10),
                  TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Nama Akun')),
                  const SizedBox(height: 10),
                  TextField(controller: amountCtl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Saldo (Rp)', prefixText: 'Rp ')),
                  const SizedBox(height: 10),
                  TextField(controller: descCtl, decoration: const InputDecoration(labelText: 'Deskripsi (opsional)')),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (nameCtl.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nama akun wajib diisi')));
                          return;
                        }
                        final balance = double.tryParse(amountCtl.text.replaceAll('.', '').replaceAll(',', '.')) ?? 0;
                        try {
                          final id = existing?['id'] as String?;
                          if (isEdit && id != null) {
                            await _accRepo.update(id, name: nameCtl.text.trim(), group: group, balance: balance, description: descCtl.text.trim().isEmpty ? null : descCtl.text.trim());
                          } else {
                            final type = group == 'Cash' ? 'CASH' : group == 'Investment' ? 'INVESTMENT' : 'BANK';
                            await _accRepo.create(name: nameCtl.text.trim(), type: type, group: group, balance: balance, description: descCtl.text.trim().isEmpty ? null : descCtl.text.trim());
                          }
                          if (!ctx.mounted) return;
                          Navigator.pop(ctx);
                          await _reload();
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isEdit ? 'Akun diperbarui' : 'Akun ditambahkan')));
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
                        }
                      },
                      child: Text(isEdit ? 'Simpan Perubahan' : 'Tambah Akun'),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  void _showCategoryForm(BuildContext ctx, {Map<String, dynamic>? existing}) {
    final isEdit = existing != null;
    var type = (existing?['type'] as String?) ?? 'EXPENSE';
    final nameCtl = TextEditingController(text: existing?['name'] as String? ?? '');
    var icon = (existing?['icon'] as String?) ?? '🍔';

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setLocal) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom + 16, left: 16, right: 16, top: 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(isEdit ? 'Ubah Kategori' : 'Tambah Kategori', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: ['EXPENSE', 'INCOME'].map((t) {
                      final sel = type == t;
                      final label = t == 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan';
                      final color = t == 'EXPENSE' ? CashWiseColors.rose600 : CashWiseColors.emerald600;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setLocal(() => type = t),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: sel ? color.withValues(alpha: 0.1) : CashWiseColors.slate100,
                              border: Border.all(color: sel ? color : CashWiseColors.slate200),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: sel ? color : CashWiseColors.slate600))),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                  TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Nama Kategori')),
                  const SizedBox(height: 14),
                  const Text('Pilih Ikon', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: CashWiseColors.slate700)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        width: 48, height: 48,
                        decoration: BoxDecoration(
                          color: CashWiseColors.slate100,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: CashWiseColors.slate200),
                        ),
                        child: Center(child: Text(icon, style: const TextStyle(fontSize: 24))),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: SizedBox(
                          height: 48,
                          child: TextField(
                            decoration: const InputDecoration(hintText: 'Ketik emot...', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                            onChanged: (v) { if (v.isNotEmpty) setLocal(() => icon = v); },
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: CashWiseColors.slate50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: CashWiseColors.slate200),
                    ),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _presetEmojis.map((e) => GestureDetector(
                        onTap: () => setLocal(() => icon = e),
                        child: Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: icon == e ? CashWiseColors.indigo50 : Colors.transparent,
                            border: icon == e ? Border.all(color: CashWiseColors.indigo600, width: 2) : null,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(child: Text(e, style: const TextStyle(fontSize: 18))),
                        ),
                      )).toList(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (nameCtl.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nama kategori wajib diisi')));
                          return;
                        }
                        try {
                          final id = existing?['id'] as String?;
                          if (isEdit && id != null) {
                            await _catRepo.update(id, name: nameCtl.text.trim(), type: type, icon: icon);
                          } else {
                            await _catRepo.create(name: nameCtl.text.trim(), type: type, icon: icon, color: type == 'EXPENSE' ? '#F43F5E' : '#10B981');
                          }
                          if (!ctx.mounted) return;
                          Navigator.pop(ctx);
                          await _reload();
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isEdit ? 'Kategori diperbarui' : 'Kategori ditambahkan')));
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
                        }
                      },
                      child: Text(isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  void _confirmDelete(BuildContext ctx, String entity, Future<void> Function() onConfirm) {
    showDialog(
      context: ctx,
      builder: (ctx) => AlertDialog(
        title: Text('Hapus $entity?'),
        content: Text('$entity ini akan dihapus secara permanen.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await onConfirm();
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${entity[0].toUpperCase()}${entity.substring(1)} berhasil dihapus')));
            },
            child: const Text('Hapus', style: TextStyle(color: CashWiseColors.rose600)),
          ),
        ],
      ),
    );
  }
}

class CashWiseLogoMark extends StatelessWidget {
  final double size;
  const CashWiseLogoMark({super.key, this.size = 24});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _CashWiseLogoPainter(),
      ),
    );
  }
}

class _CashWiseLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 64.0;
    final strokePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.5 * scale
      ..strokeCap = StrokeCap.round;

    final dotPaint = Paint()
      ..color = const Color(0xFF059669)
      ..style = PaintingStyle.fill;

    final dotBorderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0 * scale;

    final path = Path();
    path.moveTo(41.5 * scale, 21.5 * scale);
    path.cubicTo(38.8 * scale, 18.8 * scale, 35.1 * scale, 17.0 * scale, 31.0 * scale, 17.0 * scale);
    path.cubicTo(22.72 * scale, 17.0 * scale, 16.0 * scale, 23.72 * scale, 16.0 * scale, 32.0 * scale);
    path.cubicTo(16.0 * scale, 40.28 * scale, 22.72 * scale, 47.0 * scale, 31.0 * scale, 47.0 * scale);
    path.cubicTo(35.1 * scale, 47.0 * scale, 38.8 * scale, 45.2 * scale, 41.5 * scale, 42.5 * scale);

    canvas.drawPath(path, strokePaint);
    canvas.drawCircle(Offset(40.5 * scale, 32.0 * scale), 5.5 * scale, dotPaint);
    canvas.drawCircle(Offset(40.5 * scale, 32.0 * scale), 5.5 * scale, dotBorderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
