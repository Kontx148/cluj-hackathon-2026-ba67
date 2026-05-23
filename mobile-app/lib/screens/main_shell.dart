import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import '../l10n/locale_scope.dart';
import 'feed_screen.dart';
import 'voting/elections_screen.dart';

/// Top-level shell with a two-tab bottom navbar.
///
/// Voting is the primary tab on the left (the headline action of this app).
/// CivicAI lives on the right, since it is informational/secondary.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final strings = context.strings;

    final pages = const [
      ElectionsScreen(),
      FeedScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
            icon: HugeIcon(
              icon: HugeIcons.strokeRoundedCheckmarkCircle02,
              color: scheme.onSurface.withValues(alpha: 0.7),
              size: 24,
            ),
            selectedIcon: HugeIcon(
              icon: HugeIcons.strokeRoundedCheckmarkCircle02,
              color: scheme.primary,
              size: 24,
            ),
            label: strings.tabVote,
          ),
          NavigationDestination(
            icon: HugeIcon(
              icon: HugeIcons.strokeRoundedNews01,
              color: scheme.onSurface.withValues(alpha: 0.7),
              size: 24,
            ),
            selectedIcon: HugeIcon(
              icon: HugeIcons.strokeRoundedNews01,
              color: scheme.primary,
              size: 24,
            ),
            label: strings.tabCivic,
          ),
        ],
      ),
    );
  }
}
