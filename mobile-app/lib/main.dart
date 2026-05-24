import 'package:flutter/material.dart';

import 'l10n/app_locale.dart';
import 'l10n/locale_scope.dart';
import 'screens/main_shell.dart';
import 'theme.dart';

void main() {
  runApp(const CivicApp());
}

class CivicApp extends StatefulWidget {
  const CivicApp({super.key});

  @override
  State<CivicApp> createState() => _CivicAppState();
}

class _CivicAppState extends State<CivicApp> {
  AppLocale _locale = AppLocale.en;

  void _setLocale(AppLocale locale) {
    setState(() => _locale = locale);
  }

  @override
  Widget build(BuildContext context) {
    return LocaleScope(
      locale: _locale,
      onLocaleChanged: _setLocale,
      child: MaterialApp(
        title: 'Votera',
        debugShowCheckedModeBanner: false,
        theme: buildCivicTheme(),
        themeMode: ThemeMode.light,
        home: const MainShell(),
      ),
    );
  }
}
