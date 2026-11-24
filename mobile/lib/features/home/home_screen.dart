import 'package:flutter/material.dart';
import 'package:cashwise_mobile/core/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  double totalBalance = 500000.0;
  List<Map<String, dynamic>> transactions = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.account_balance_wallet, color: CashWiseColors.emerald600),
            SizedBox(width: 8),
            Text('CashWise', style: TextStyle(fontWeight: FontWeight.bold)),
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
                Text('SQLite Lokal', style: TextStyle(fontSize: 12, color: CashWiseColors.slate700)),
              ],
            ),
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Net Worth Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: CashWiseColors.pureWhite,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: CashWiseColors.slate200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'TOTAL KEKAYAAN BERSIH',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: CashWiseColors.slate500,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Rp ${totalBalance.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    color: CashWiseColors.slate900,
                  ),
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: CashWiseColors.slate100),
                const SizedBox(height: 16),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Akun Aktif: Dompet Tunai', style: TextStyle(fontSize: 13, color: CashWiseColors.slate600)),
                    Text('IDR', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CashWiseColors.slate700)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Transaksi Terkini',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: CashWiseColors.slate900),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: CashWiseColors.pureWhite,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CashWiseColors.slate200),
            ),
            child: const Center(
              child: Text(
                'Belum ada transaksi di database lokal.',
                style: TextStyle(fontSize: 14, color: CashWiseColors.slate500),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Pencatatan transaksi kilat siap digunakan')),
          );
        },
        backgroundColor: CashWiseColors.indigo600,
        foregroundColor: CashWiseColors.pureWhite,
        icon: const Icon(Icons.add),
        label: const Text('Catat Transaksi', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
