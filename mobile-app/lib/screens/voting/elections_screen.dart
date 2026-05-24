import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../l10n/app_locale.dart';
import '../../l10n/app_strings.dart';
import '../../l10n/locale_scope.dart';
import '../../models/election.dart';
import '../../services/elections_service.dart';
import '../../theme.dart';
import '../../widgets/election_status_pill.dart';
import 'vote_flow_screen.dart';

class ElectionsScreen extends StatefulWidget {
  const ElectionsScreen({super.key});

  @override
  State<ElectionsScreen> createState() => _ElectionsScreenState();
}

class _ElectionsScreenState extends State<ElectionsScreen> {
  final _service = ElectionsService();
  late Future<ElectionsResult> _future;
  bool _refreshing = false;

  @override
  void initState() {
    super.initState();
    _future = _service.fetchElections();
  }

  Future<void> _reload() async {
    setState(() {
      _refreshing = true;
      _future = _service.fetchElections();
    });
    try {
      await _future;
    } finally {
      if (mounted) setState(() => _refreshing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final locale = context.appLocale;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: FutureBuilder<ElectionsResult>(
          future: _future,
          builder: (context, snapshot) {
            final result = snapshot.data;
            final loading = snapshot.connectionState == ConnectionState.waiting;
            final elections = result?.elections ?? const <Election>[];
            final offline = result?.offline ?? false;
            return RefreshIndicator(
              onRefresh: _reload,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  if (offline)
                    SliverToBoxAdapter(
                      child: _OfflineBanner(strings: strings),
                    ),
                  SliverToBoxAdapter(
                    child: _Header(
                      strings: strings,
                      locale: locale,
                      refreshing: _refreshing || loading,
                      onRefresh: _reload,
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                      child: _PrivacyStrip(strings: strings),
                    ),
                  ),
                  if (loading)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: EdgeInsets.only(top: 64),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                    )
                  else if (elections.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Text(
                            strings.electionsEmpty,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, i) {
                            final sorted = [...elections]..sort(_byVotability);
                            return Padding(
                              padding: EdgeInsets.only(
                                bottom: i == sorted.length - 1 ? 0 : 12,
                              ),
                              child: _ElectionCard(
                                election: sorted[i],
                                onTap: () => _openVoteFlow(sorted[i]),
                              ),
                            );
                          },
                          childCount: elections.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  int _byVotability(Election a, Election b) {
    final aOpen = a.status.acceptsVotes ? 0 : 1;
    final bOpen = b.status.acceptsVotes ? 0 : 1;
    if (aOpen != bOpen) return aOpen - bOpen;
    return b.startsAt.compareTo(a.startsAt);
  }

  Future<void> _openVoteFlow(Election election) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VoteFlowScreen(election: election),
      ),
    );
    if (mounted) _reload();
  }
}

// Header ----------------------------------------------------------------------

class _Header extends StatelessWidget {
  const _Header({
    required this.strings,
    required this.locale,
    required this.refreshing,
    required this.onRefresh,
  });

  final AppStrings strings;
  final AppLocale locale;
  final bool refreshing;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.votingHeadline,
                  style: theme.textTheme.headlineMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  strings.votingTagline,
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          _LangSwitch(locale: locale),
          const SizedBox(width: 4),
          _RefreshButton(refreshing: refreshing, onTap: onRefresh),
        ],
      ),
    );
  }
}

class _RefreshButton extends StatefulWidget {
  const _RefreshButton({required this.refreshing, required this.onTap});

  final bool refreshing;
  final Future<void> Function() onTap;

  @override
  State<_RefreshButton> createState() => _RefreshButtonState();
}

class _RefreshButtonState extends State<_RefreshButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _spin =
      AnimationController(vsync: this, duration: const Duration(seconds: 1))
        ..repeat();

  @override
  void dispose() {
    _spin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surfaceContainerHighest,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: widget.refreshing ? null : widget.onTap,
        child: SizedBox(
          width: 36,
          height: 36,
          child: Center(
            child: AnimatedBuilder(
              animation: _spin,
              builder: (_, child) {
                return Transform.rotate(
                  angle: widget.refreshing ? _spin.value * 6.2831 : 0,
                  child: child,
                );
              },
              child: HugeIcon(
                icon: HugeIcons.strokeRoundedRefresh,
                color: theme.textTheme.bodyMedium?.color ??
                    theme.colorScheme.onSurface,
                size: 16,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LangSwitch extends StatelessWidget {
  const _LangSwitch({required this.locale});

  final AppLocale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scope = LocaleScope.of(context);
    final next = locale == AppLocale.en ? AppLocale.ro : AppLocale.en;
    return InkWell(
      onTap: () => scope.onLocaleChanged(next),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          next.label.toUpperCase().substring(0, 2),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }
}

// Privacy strip ---------------------------------------------------------------

class _PrivacyStrip extends StatelessWidget {
  const _PrivacyStrip({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: theme.colorScheme.secondary,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          HugeIcon(
            icon: HugeIcons.strokeRoundedSquareLock02,
            color: theme.colorScheme.primary,
            size: 14,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              strings.privacyStrip,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Offline banner --------------------------------------------------------------

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: CivicPalette.amberBannerBg,
        border: Border(
          bottom: BorderSide(color: CivicPalette.amberBannerBorder),
        ),
      ),
      child: Row(
        children: [
          const HugeIcon(
            icon: HugeIcons.strokeRoundedWifiDisconnected02,
            color: CivicPalette.amberBannerFg,
            size: 13,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              strings.offlineBanner,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: CivicPalette.amberBannerFg,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Election card ---------------------------------------------------------------

class _ElectionCard extends StatelessWidget {
  const _ElectionCard({required this.election, required this.onTap});

  final Election election;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final canVote = election.status.acceptsVotes;

    return Opacity(
      opacity: canVote ? 1.0 : 0.6,
      child: Material(
        color: theme.colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: theme.colorScheme.outline),
        ),
        child: InkWell(
          onTap: canVote ? onTap : null,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ElectionStatusPill(status: election.status),
                    const Spacer(),
                    if (canVote)
                      Text(
                        strings.electionTapToVote,
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  election.name,
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        election.type,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 3,
                      height: 3,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.outline,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        _formatRange(election.startsAt, election.endsAt),
                        style: theme.textTheme.bodyMedium?.copyWith(fontSize: 11),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatRange(DateTime start, DateTime end) {
    String two(int v) => v.toString().padLeft(2, '0');
    String fmt(DateTime d) =>
        '${d.year}-${two(d.month)}-${two(d.day)}';
    return '${fmt(start.toLocal())} → ${fmt(end.toLocal())}';
  }
}
