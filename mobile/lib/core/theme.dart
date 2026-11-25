import 'package:flutter/material.dart';

class CashWiseColors {
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
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
  static const Color indigo50 = Color(0xFFEEF2FF);
  static const Color blue600 = Color(0xFF2563EB);
  static const Color purple600 = Color(0xFF7C3AED);
  static const Color cyan600 = Color(0xFF0891B2);

  // Dark palette tokens
  static const Color darkBackground = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkSurfaceSubtle = Color(0xFF334155);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkText = Color(0xFFF8FAFC);
  static const Color darkTextMuted = Color(0xFF94A3B8);
  static const Color darkPrimary = Color(0xFF6366F1);
  static const Color darkIncome = Color(0xFF34D399);
  static const Color darkExpense = Color(0xFFFB7185);
}

class MobileBgColors {
  final Color primary;
  final Color card;
  final Color secondary;

  const MobileBgColors({
    required this.primary,
    required this.card,
    required this.secondary,
  });

  String get hexPrimary => '#${(primary.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0').toUpperCase()}';
  String get hexCard => '#${(card.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0').toUpperCase()}';
  String get hexSecondary => '#${(secondary.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0').toUpperCase()}';
}

class MobileBgPreset {
  final String key;
  final String label;
  final MobileBgColors light;
  final MobileBgColors dark;

  const MobileBgPreset({
    required this.key,
    required this.label,
    required this.light,
    required this.dark,
  });
}

final mobileBgPresets = [
  const MobileBgPreset(
    key: 'original',
    label: 'Original',
    light: MobileBgColors(primary: Color(0xFFF8FAFC), card: Color(0xFFFFFFFF), secondary: Color(0xFFEEF2FF)),
    dark: MobileBgColors(primary: Color(0xFF0F172A), card: Color(0xFF1E293B), secondary: Color(0xFF334155)),
  ),
  const MobileBgPreset(
    key: 'ocean',
    label: 'Ocean Blue',
    light: MobileBgColors(primary: Color(0xFFF0F9FF), card: Color(0xFFFFFFFF), secondary: Color(0xFFE0F2FE)),
    dark: MobileBgColors(primary: Color(0xFF0C192C), card: Color(0xFF132A4A), secondary: Color(0xFF1E3A5F)),
  ),
  const MobileBgPreset(
    key: 'forest',
    label: 'Forest Green',
    light: MobileBgColors(primary: Color(0xFFF0FDF4), card: Color(0xFFFFFFFF), secondary: Color(0xFFDCFCE7)),
    dark: MobileBgColors(primary: Color(0xFF0B1F17), card: Color(0xFF132E22), secondary: Color(0xFF1E4635)),
  ),
  const MobileBgPreset(
    key: 'warm',
    label: 'Warm Neutral',
    light: MobileBgColors(primary: Color(0xFFFAF8F5), card: Color(0xFFFFFFFF), secondary: Color(0xFFF3EFEA)),
    dark: MobileBgColors(primary: Color(0xFF1C1917), card: Color(0xFF292524), secondary: Color(0xFF44403C)),
  ),
];

final themeModeNotifier = ValueNotifier<ThemeMode>(ThemeMode.light);
final customMobileBgNotifier = ValueNotifier<MobileBgPreset>(mobileBgPresets[0]);

class CashWiseTheme {
  static ThemeData getDarkTheme([MobileBgColors? custom]) {
    final bg = custom?.primary ?? CashWiseColors.darkBackground;
    final surface = custom?.card ?? CashWiseColors.darkSurface;
    final secondary = custom?.secondary ?? CashWiseColors.darkSurfaceSubtle;

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme(
        brightness: Brightness.dark,
        primary: CashWiseColors.darkPrimary,
        onPrimary: CashWiseColors.slate900,
        secondary: CashWiseColors.darkIncome,
        onSecondary: CashWiseColors.slate900,
        error: CashWiseColors.darkExpense,
        onError: CashWiseColors.slate900,
        surface: surface,
        onSurface: CashWiseColors.darkText,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: CashWiseColors.darkText,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: const TextStyle(
          color: CashWiseColors.darkText,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        indicatorColor: CashWiseColors.darkPrimary.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: CashWiseColors.darkPrimary,
            );
          }
          return const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: CashWiseColors.darkTextMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: CashWiseColors.darkPrimary, size: 22);
          }
          return const IconThemeData(color: CashWiseColors.darkTextMuted, size: 22);
        }),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: CashWiseColors.darkBorder),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: const DividerThemeData(
        color: CashWiseColors.darkBorder,
        thickness: 1,
        space: 1,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: secondary,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: CashWiseColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: CashWiseColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: CashWiseColors.darkPrimary, width: 2),
        ),
        labelStyle: const TextStyle(fontSize: 13, color: CashWiseColors.darkTextMuted),
        hintStyle: const TextStyle(fontSize: 13, color: CashWiseColors.slate500),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: CashWiseColors.darkPrimary,
        foregroundColor: CashWiseColors.pureWhite,
        elevation: 2,
        shape: StadiumBorder(),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CashWiseColors.darkPrimary,
          foregroundColor: CashWiseColors.pureWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: CashWiseColors.darkText,
          side: const BorderSide(color: CashWiseColors.darkBorder),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
      ),
    );
  }

  static ThemeData get darkTheme => getDarkTheme();

  static ThemeData getLightTheme([MobileBgColors? custom]) {
    final bg = custom?.primary ?? CashWiseColors.slate50;
    final surface = custom?.card ?? CashWiseColors.pureWhite;
    final secondary = custom?.secondary ?? CashWiseColors.indigo50;

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme(
        brightness: Brightness.light,
        primary: CashWiseColors.indigo600,
        onPrimary: CashWiseColors.pureWhite,
        secondary: CashWiseColors.emerald600,
        onSecondary: CashWiseColors.pureWhite,
        error: CashWiseColors.rose600,
        onError: CashWiseColors.pureWhite,
        surface: surface,
        onSurface: CashWiseColors.slate900,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: CashWiseColors.slate900,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: const TextStyle(
          color: CashWiseColors.slate900,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        indicatorColor: CashWiseColors.indigo600.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: CashWiseColors.indigo600,
            );
          }
          return const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: CashWiseColors.slate500,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: CashWiseColors.indigo600, size: 22);
          }
          return const IconThemeData(color: CashWiseColors.slate500, size: 22);
        }),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: CashWiseColors.slate200),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: const DividerThemeData(
        color: CashWiseColors.slate200,
        thickness: 1,
        space: 1,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: secondary,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: CashWiseColors.slate300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: CashWiseColors.slate300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: CashWiseColors.indigo600, width: 2),
        ),
        labelStyle: const TextStyle(fontSize: 13, color: CashWiseColors.slate600),
        hintStyle: const TextStyle(fontSize: 13, color: CashWiseColors.slate400),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CashWiseColors.indigo600,
          foregroundColor: CashWiseColors.pureWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: CashWiseColors.slate700,
          side: const BorderSide(color: CashWiseColors.slate300),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: CashWiseColors.indigo600,
        foregroundColor: CashWiseColors.pureWhite,
        elevation: 2,
        shape: StadiumBorder(),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: CashWiseColors.slate800,
        contentTextStyle: const TextStyle(color: CashWiseColors.pureWhite, fontSize: 13),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: CashWiseColors.slate100,
        side: const BorderSide(color: CashWiseColors.slate200),
        labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      ),
    );
  }

  static ThemeData get lightTheme => getLightTheme();
}

String formatRupiah(double amount) {
  final isNeg = amount < 0;
  final abs = amount.abs();
  final str = abs.toStringAsFixed(0);
  final buf = StringBuffer();
  for (var i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 == 0) buf.write('.');
    buf.write(str[i]);
  }
  return '${isNeg ? '-' : ''}Rp $buf';
}
