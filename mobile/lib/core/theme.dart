import 'package:flutter/material.dart';

class CashWiseColors {
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color pureWhite = Color(0xFFFFFFFF);

  static const Color emerald600 = Color(0xFF059669);
  static const Color emerald50 = Color(0xFFECFDF5);
  static const Color rose600 = Color(0xFFE11D48);
  static const Color rose50 = Color(0xFFFFF1F2);
  static const Color amber600 = Color(0xFFD97706);
  static const Color amber50 = Color(0xFFFFFBEB);
  static const Color indigo600 = Color(0xFF4F46E5);
}

class CashWiseTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: CashWiseColors.slate50,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: CashWiseColors.slate900,
        onPrimary: CashWiseColors.pureWhite,
        secondary: CashWiseColors.indigo600,
        onSecondary: CashWiseColors.pureWhite,
        error: CashWiseColors.rose600,
        onError: CashWiseColors.pureWhite,
        surface: CashWiseColors.pureWhite,
        onSurface: CashWiseColors.slate900,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: CashWiseColors.pureWhite,
        foregroundColor: CashWiseColors.slate900,
        elevation: 0,
        titleTextStyle: TextStyle(
          color: CashWiseColors.slate900,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
