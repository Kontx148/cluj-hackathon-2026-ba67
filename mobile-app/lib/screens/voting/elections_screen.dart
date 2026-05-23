import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../l10n/app_locale.dart';
import '../../l10n/app_strings.dart';
import '../../l10n/locale_scope.dart';
import '../../models/election.dart';
import '../../services/elections_service.dart';
import 'vote_flow_screen.dart';

class ElectionsScreen extends StatefulWidget {
  const ElectionsScreen({super.key});

  @override
  State<ElectionsScreen> createState() => _ElectionsScreenState();
}

class _ElectionsScreenState extends State<ElectionsScreen> {
  final _service = ElectionsService();
  late Future<ElectionsResult> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.fetchElections();
  }

  Future<void> _reload() async {
    setState(() {
      _future = _service.fetchElections();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final locale = context.appLocale;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _reload,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _Header(strings: strings, locale: locale),
              ),
              FutureBuilder<ElectionsResult>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }

                  // ElectionsService never throws — it falls back to demo data.
                  final result = snapshot.data ??
                      const ElectionsResult(
                        elections: [],
                        offline: false,
                      );
                  final elections = result.elections;
                  final offline = result.offline;

                  if (elections.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Text(
                          strings.electionsEmpty,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    );
                  }

                  final sorted = [...elections]..sort(_byVotability);

                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        if (offline) ...[
                          _OfflineBanner(onRetry: _reload),
                          const SizedBox(height: 12),
                        ],
                        for (var i = 0; i < sorted.length; i++) ...[
                          if (i > 0) const SizedBox(height: 12),
                          _ElectionCard(
                            election: sorted[i],
                            onTap: () => _openVoteFlow(sorted[i]),
                          ),
                        ],
                      ]),
                    ),
                  );
                },
              ),
            ],
          ),
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

// Offline banner --------------------------------------------------------------

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.error.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: theme.colorScheme.error.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          HugeIcon(
            icon: HugeIcons.strokeRoundedAlert02,
            color: theme.colorScheme.error,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              strings.offlineBanner,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onRetry,
            child: HugeIcon(
              icon: HugeIcons.strokeRoundedRefresh,
              color: theme.colorScheme.error,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}

// Header ----------------------------------------------------------------------

class _Header extends StatelessWidget {
  const _Header({required this.strings, required this.locale});

  final AppStrings strings;
  final AppLocale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: HugeIcon(
                  icon: HugeIcons.strokeRoundedShield02,
                  color: theme.colorScheme.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      strings.appName.toUpperCase(),
                      style: theme.textTheme.labelSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      strings.votingHeadline,
                      style: theme.textTheme.headlineMedium,
                    ),
                  ],
                ),
              ),
              _LangSwitch(locale: locale),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            strings.votingTagline,
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _LangSwitch extends StatelessWidget {
  const _LangSwitch({required this.locale});

  final AppLocale locale;

  @override
  Widget build(BuildContext context) {
    final scope = LocaleScope.of(context);
    final next = locale == AppLocale.en ? AppLocale.ro : AppLocale.en;
    return TextButton(
      onPressed: () => scope.onLocaleChanged(next),
      child: Text(next.label.toUpperCase()),
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
    final accent = canVote
        ? theme.colorScheme.primary
        : theme.colorScheme.onSurface.withValues(alpha: 0.7);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: canVote ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _StatusBadge(status: election.status, strings: strings),
                  const Spacer(),
                  Text(
                    election.type,
                    style: theme.textTheme.labelSmall,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                election.name,
                style: theme.textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                _formatRange(election.startsAt, election.endsAt),
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final c in election.candidates.take(4))
                    Chip(
                      label: Text(c.name),
                      visualDensity: VisualDensity.compact,
                    ),
                  if (election.candidates.length > 4)
                    Chip(
                      label: Text('+${election.candidates.length - 4}'),
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      canVote
                          ? strings.electionTapToVote
                          : strings.electionNotOpen,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: accent,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (canVote)
                    HugeIcon(
                      icon: HugeIcons.strokeRoundedArrowRight01,
                      color: accent,
                      size: 22,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatRange(DateTime start, DateTime end) {
    String two(int v) => v.toString().padLeft(2, '0');
    String fmt(DateTime d) =>
        '${d.year}-${two(d.month)}-${two(d.day)} ${two(d.hour)}:${two(d.minute)}';
    return '${fmt(start.toLocal())} → ${fmt(end.toLocal())}';
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status, required this.strings});

  final ElectionStatus status;
  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (label, color) = switch (status) {
      ElectionStatus.open => (strings.statusOpen, theme.colorScheme.primary),
      ElectionStatus.proposed => (
        strings.statusProposed,
        const Color(0xFFE0A800)
      ),
      ElectionStatus.approved => (
        strings.statusApproved,
        const Color(0xFF2F9E44)
      ),
      ElectionStatus.frozen => (
        strings.statusFrozen,
        theme.colorScheme.onSurface.withValues(alpha: 0.6)
      ),
      ElectionStatus.tallying => (
        strings.statusTallying,
        const Color(0xFFE0A800)
      ),
      ElectionStatus.decrypted => (
        strings.statusDecrypted,
        const Color(0xFF2F9E44)
      ),
      ElectionStatus.finished => (
        strings.statusFinished,
        theme.colorScheme.onSurface.withValues(alpha: 0.6)
      ),
      ElectionStatus.unknown => (
        status.name.toUpperCase(),
        theme.colorScheme.onSurface.withValues(alpha: 0.6)
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
