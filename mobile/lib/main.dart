import 'package:flutter/material.dart';
import 'package:cashwise_mobile/core/theme.dart';
import 'package:cashwise_mobile/features/home/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CashWiseApp());
}

class CashWiseApp extends StatelessWidget {
  const CashWiseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CashWise',
      debugShowCheckedModeBanner: false,
      theme: CashWiseTheme.lightTheme,
      home: const HomeScreen(),
    );
  }
}
