import 'package:flutter/material.dart';

import 'screens/feed_screen.dart';
import 'theme.dart';

void main() {
  runApp(const CivicApp());
}

class CivicApp extends StatelessWidget {
  const CivicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CivicAI',
      theme: buildCivicTheme(dark: false),
      darkTheme: buildCivicTheme(dark: true),
      themeMode: ThemeMode.system,
      home: const FeedScreen(),
    );
  }
}
