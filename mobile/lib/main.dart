import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:cashwise_mobile/core/theme.dart';
import 'package:cashwise_mobile/features/home/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb && (Platform.isMacOS || Platform.isLinux || Platform.isWindows)) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }
  runApp(const CashWiseApp());
}

class CashWiseApp extends StatelessWidget {
  const CashWiseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([themeModeNotifier, customMobileBgNotifier]),
      builder: (context, _) {
        final mode = themeModeNotifier.value;
        final bg = customMobileBgNotifier.value;
        return MaterialApp(
          title: 'CashWise',
          debugShowCheckedModeBanner: false,
          theme: CashWiseTheme.getLightTheme(bg.light),
          darkTheme: CashWiseTheme.getDarkTheme(bg.dark),
          themeMode: mode,
          home: const HomeScreen(),
        );
      },
    );
  }
}
