/// CashWise Flutter Theme & Design Tokens (Material 3 Anti-Slop)
/// Single source of truth for colors, typography, and component styling in Dart.

import 'package:flutter/material.dart';

class CashWiseColors {
  // Brand & Slate Primary
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color pureWhite = Color(0xFFFFFFFF);

  // Semantics
  static const Color emerald600 = Color(0xFF059669); // Income & Safe
  static const Color emerald50 = Color(0xFFECFDF5);
  static const Color rose600 = Color(0xFFE11D48); // Expense & Danger
  static const Color rose50 = Color(0xFFFFF1F2);
  static const Color amber600 = Color(0xFFD97706); // Warning
  static const Color amber50 = Color(0xFFFFFBEB);
  static const Color indigo600 = Color(0xFF4F46E5); // CTA & Action
  static const Color indigo50 = Color(0xFFEEF2FF);
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
        surfaceContainerHighest: CashWiseColors.slate100,
        outline: CashWiseColors.slate200,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: CashWiseColors.pureWhite,
        foregroundColor: CashWiseColors.slate900,
        elevation: 0,
        scrolledUnderElevation: 1,
        titleTextStyle: TextStyle(
          color: CashWiseColors.slate900,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardTheme(
        color: CashWiseColors.pureWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: CashWiseColors.slate200, width: 1),
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CashWiseColors.indigo600,
          foregroundColor: CashWiseColors.pureWhite,
          elevation: 0,
          minimumSize: const Size(double.infinity, 48), // 48px touch target
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

/// Helper format Rupiah untuk Flutter
class CashWiseFormatter {
  static String formatRupiah(double amount, {bool showSign = false, bool isExpense = false}) {
    final bool negative = amount < 0 || isExpense;
    final int absValue = amount.abs().round();
    final String digits = absValue.toString();

    // Tambah pemisah titik ribuan
    final StringBuffer buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(digits[i]);
    }

    final String formatted = buffer.toString();
    if (showSign) {
      return negative ? '- Rp $formatted' : '+ Rp $formatted';
    }
    return negative ? '-Rp $formatted' : 'Rp $formatted';
  }
}
