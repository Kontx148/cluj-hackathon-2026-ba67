import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import '../l10n/locale_scope.dart';
import 'feed_screen.dart';
import 'voting/elections_screen.dart';

/// Top-level shell with the Figma-styled two-tab bottom navbar.
///
/// Voting is the primary tab on the left (the headline action of this app).
/// The civic feed lives on the right, since it is informational/secondary.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;

    final pages = const [
      ElectionsScreen(),
      FeedScreen(),
    ];

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(
              top: BorderSide(color: theme.colorScheme.outline),
            ),
          ),
          child: Row(
            children: [
              _NavTab(
                label: strings.tabVote,
                icon: HugeIcons.strokeRoundedCheckmarkCircle02,
                active: _index == 0,
                onTap: () => setState(() => _index = 0),
              ),
              _NavTab(
                label: strings.tabCivic,
                icon: HugeIcons.strokeRoundedNews01,
                active: _index == 1,
                onTap: () => setState(() => _index = 1),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  const _NavTab({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  final String label;
  final List<List<dynamic>> icon;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = active
        ? theme.colorScheme.primary
        : theme.textTheme.bodyMedium?.color ?? theme.colorScheme.onSurface;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              HugeIcon(icon: icon, color: color, size: 22),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                width: 24,
                height: 3,
                decoration: BoxDecoration(
                  color: active ? theme.colorScheme.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
