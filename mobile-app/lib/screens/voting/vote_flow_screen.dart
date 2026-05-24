import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config.dart';
import '../../data/demo_identities.dart';
import '../../l10n/app_strings.dart';
import '../../l10n/locale_scope.dart';
import '../../models/election.dart';
import '../../services/election_vote_service.dart';
import '../../services/identity_service.dart';
import '../../services/vote_history_service.dart';
import '../../theme.dart';
import '../../widgets/candidate_avatar.dart';

enum _Step { identity, candidate, confirm, receipt }

const List<Color> _candidatePalette = [
  Color(0xFF4A7FC1),
  Color(0xFF27AE60),
  Color(0xFF16A085),
  Color(0xFF8E44AD),
  Color(0xFFE67E22),
  Color(0xFF2980B9),
];

class VoteFlowScreen extends StatefulWidget {
  const VoteFlowScreen({super.key, required this.election});

  final Election election;

  @override
  State<VoteFlowScreen> createState() => _VoteFlowScreenState();
}

class _VoteFlowScreenState extends State<VoteFlowScreen> {
  _Step _step = _Step.identity;

  _IdentityMode _mode = _IdentityMode.cei;
  VerifiedIdentity? _identity;
  DemoIdentity? _selectedDemo;
  ElectionCandidate? _candidate;

  bool _submitting = false;
  bool _duplicateVote = false;
  String? _errorMessage;
  VoteSubmissionResult? _result;

  final _identityService = IdentityService();
  final _voteService = ElectionVoteService();
  final _voteHistory = VoteHistoryService();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(
              title: strings.voteFlowTitle,
              showClose: _step == _Step.identity,
              onBack: _handleBack,
            ),
            if (_step != _Step.receipt) ...[
              _Stepper(currentStep: _step.index),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: _ElectionPill(name: widget.election.name),
              ),
            ],
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: KeyedSubtree(
                  key: ValueKey(_step),
                  child: _buildStep(context),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleBack() {
    if (_step == _Step.identity) {
      Navigator.of(context).pop();
      return;
    }
    setState(() {
      _errorMessage = null;
      _step = _Step.values[_step.index - 1];
    });
  }

  Widget _buildStep(BuildContext context) {
    switch (_step) {
      case _Step.identity:
        return _IdentityStep(
          mode: _mode,
          onModeChanged: (m) => setState(() => _mode = m),
          selected: _selectedDemo,
          onSelected: (d) => setState(() => _selectedDemo = d),
          onCEI: _handleEidkit,
          onContinue: _confirmIdentity,
        );
      case _Step.candidate:
        return _CandidateStep(
          election: widget.election,
          selected: _candidate,
          onSelected: (c) => setState(() => _candidate = c),
          onContinue: () => setState(() => _step = _Step.confirm),
        );
      case _Step.confirm:
        return _ConfirmStep(
          election: widget.election,
          identity: _identity!,
          identityMode: _mode,
          candidate: _candidate!,
          submitting: _submitting,
          duplicateVote: _duplicateVote,
          errorMessage: _errorMessage,
          onSubmit: _submit,
        );
      case _Step.receipt:
        return _ReceiptStep(
          election: widget.election,
          result: _result!,
          onDone: () => Navigator.of(context).pop(),
        );
    }
  }

  void _confirmIdentity() {
    if (_mode == _IdentityMode.demo && _selectedDemo != null) {
      final demo = _selectedDemo!;
      setState(() {
        _identity = VerifiedIdentity(
          digitalId: demo.digitalId,
          displayName: demo.name,
          source: IdentitySource.demo,
        );
        _step = _Step.candidate;
      });
    }
  }

  Future<void> _handleEidkit() async {
    final messenger = ScaffoldMessenger.of(context);
    final strings = context.strings;
    await _identityService.startEidkitFlow();
    if (!mounted) return;
    messenger.showSnackBar(SnackBar(content: Text(strings.eidkitStubMessage)));
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _errorMessage = null;
      _duplicateVote = false;
    });
    try {
      final result = await _voteService.submitVote(
        ElectionVoteRequest(
          election: widget.election,
          candidateId: _candidate!.id,
          digitalId: _identity!.digitalId,
          districtId: widget.election.districts.first,
        ),
      );
      if (!mounted) return;
      await _voteHistory.markVoted(widget.election.id);
      setState(() {
        _result = result;
        _step = _Step.receipt;
      });
    } on VoteSubmissionException catch (e) {
      if (!mounted) return;
      setState(() {
        _duplicateVote = e.statusCode == 409 &&
            (e.message.toLowerCase().contains('already voted') ||
                e.message.toLowerCase().contains('deja'));
        _errorMessage = _duplicateVote ? null : e.message;
      });
      if (_duplicateVote) {
        await _voteHistory.markVoted(widget.election.id);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

enum _IdentityMode { cei, demo }

// ─── Top bar ────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.title,
    required this.showClose,
    required this.onBack,
  });

  final String title;
  final bool showClose;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 4, 8, 4),
      child: Row(
        children: [
          Material(
            color: Colors.transparent,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onBack,
              child: SizedBox(
                width: 40,
                height: 40,
                child: Icon(
                  showClose ? Icons.close_rounded : Icons.chevron_left_rounded,
                  color: theme.colorScheme.onSurface,
                  size: showClose ? 22 : 26,
                ),
              ),
            ),
          ),
          Expanded(
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleLarge?.copyWith(fontSize: 16),
            ),
          ),
          const SizedBox(width: 40),
        ],
      ),
    );
  }
}

// ─── Stepper ────────────────────────────────────────────────────────────────

class _Stepper extends StatelessWidget {
  const _Stepper({required this.currentStep});

  final int currentStep;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final labels = [
      strings.stepIdentity,
      strings.stepCandidate,
      strings.stepConfirm,
      strings.stepReceipt,
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Row(
        children: List.generate(labels.length, (i) {
          final isDone = i < currentStep;
          final isActive = i == currentStep;
          final node = Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: CivicPalette.card,
                  border: Border.all(
                    color: isDone || isActive
                        ? CivicPalette.primary
                        : CivicPalette.border,
                    width: isActive ? 2.5 : 1.5,
                  ),
                ),
                alignment: Alignment.center,
                child: isDone
                    ? const Icon(
                        Icons.check_rounded,
                        color: CivicPalette.primary,
                        size: 14,
                      )
                    : Text(
                        '${i + 1}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: isActive
                              ? CivicPalette.primary
                              : CivicPalette.mutedFg,
                        ),
                      ),
              ),
              const SizedBox(height: 4),
              Text(
                labels[i],
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: isActive
                      ? theme.colorScheme.primary
                      : theme.textTheme.bodyMedium?.color,
                ),
              ),
            ],
          );
          if (i == labels.length - 1) return node;
          return Expanded(
            child: Row(
              children: [
                node,
                Expanded(
                  child: Container(
                    height: 1,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    color: isDone
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outline,
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// ─── Election context pill ──────────────────────────────────────────────────

class _ElectionPill extends StatelessWidget {
  const _ElectionPill({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        name,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: theme.textTheme.bodyMedium?.color,
        ),
      ),
    );
  }
}

// ─── Step 1: Identity ───────────────────────────────────────────────────────

class _IdentityStep extends StatelessWidget {
  const _IdentityStep({
    required this.mode,
    required this.onModeChanged,
    required this.selected,
    required this.onSelected,
    required this.onCEI,
    required this.onContinue,
  });

  final _IdentityMode mode;
  final ValueChanged<_IdentityMode> onModeChanged;
  final DemoIdentity? selected;
  final ValueChanged<DemoIdentity> onSelected;
  final Future<void> Function() onCEI;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final canProceed = mode == _IdentityMode.demo && selected != null;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _PrivacyCallout(
                  title: strings.identityCalloutTitle,
                  body: strings.identityCalloutBody,
                ),
                const SizedBox(height: 16),
                _ModeToggle(
                  mode: mode,
                  onChanged: onModeChanged,
                  ceiLabel: strings.identityModeCEI,
                  demoLabel: strings.identityModeDemo,
                ),
                const SizedBox(height: 16),
                if (mode == _IdentityMode.cei)
                  _CEICard(
                    title: strings.identityCEITitle,
                    subtitle: strings.identityCEISubtitle,
                    cta: strings.identityCEICta,
                    fallback: strings.identityCEIFallback,
                    onCEI: onCEI,
                    onFallback: () => onModeChanged(_IdentityMode.demo),
                  )
                else
                  _DemoIdentityList(
                    selected: selected,
                    onSelected: onSelected,
                  ),
              ],
            ),
          ),
        ),
        _BottomCta(
          label: strings.continueLabel,
          onTap: canProceed ? onContinue : null,
        ),
      ],
    );
  }
}

class _PrivacyCallout extends StatelessWidget {
  const _PrivacyCallout({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          HugeIcon(
            icon: HugeIcons.strokeRoundedShield02,
            color: theme.colorScheme.primary,
            size: 19,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(fontSize: 13),
                ),
                const SizedBox(height: 2),
                Text(body, style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeToggle extends StatelessWidget {
  const _ModeToggle({
    required this.mode,
    required this.onChanged,
    required this.ceiLabel,
    required this.demoLabel,
  });

  final _IdentityMode mode;
  final ValueChanged<_IdentityMode> onChanged;
  final String ceiLabel;
  final String demoLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _pill(context, _IdentityMode.cei, ceiLabel)),
        const SizedBox(width: 8),
        Expanded(child: _pill(context, _IdentityMode.demo, demoLabel)),
      ],
    );
  }

  Widget _pill(BuildContext context, _IdentityMode value, String label) {
    return CivicFilterChip(
      label: label,
      selected: mode == value,
      onTap: () => onChanged(value),
    );
  }
}

class _CEICard extends StatelessWidget {
  const _CEICard({
    required this.title,
    required this.subtitle,
    required this.cta,
    required this.fallback,
    required this.onCEI,
    required this.onFallback,
  });

  final String title;
  final String subtitle;
  final String cta;
  final String fallback;
  final Future<void> Function() onCEI;
  final VoidCallback onFallback;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: HugeIcon(
                icon: HugeIcons.strokeRoundedSmartPhone01,
                color: theme.colorScheme.primary,
                size: 28,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(onPressed: onCEI, child: Text(cta)),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: onFallback,
            child: Text(
              fallback,
              style: theme.textTheme.bodySmall?.copyWith(
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DemoIdentityList extends StatelessWidget {
  const _DemoIdentityList({required this.selected, required this.onSelected});

  final DemoIdentity? selected;
  final ValueChanged<DemoIdentity> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(
              strings.devModeTitle.toUpperCase(),
              style: theme.textTheme.labelSmall,
            ),
          ),
          for (var i = 0; i < demoIdentities.length; i++) ...[
            _DemoIdentityTile(
              identity: demoIdentities[i],
              selected: selected?.digitalId == demoIdentities[i].digitalId,
              onTap: () => onSelected(demoIdentities[i]),
            ),
            if (i < demoIdentities.length - 1)
              Divider(height: 1, color: theme.colorScheme.outline),
          ],
        ],
      ),
    );
  }
}

class _DemoIdentityTile extends StatelessWidget {
  const _DemoIdentityTile({
    required this.identity,
    required this.selected,
    required this.onTap,
  });

  final DemoIdentity identity;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final initials = _initials(identity.name);
    return InkWell(
      onTap: onTap,
      child: Container(
        color: selected
            ? theme.colorScheme.surfaceContainerHighest
            : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: CivicPalette.muted,
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? CivicPalette.primary : CivicPalette.border,
                  width: selected ? 2 : 1,
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                initials,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: selected
                      ? CivicPalette.primary
                      : CivicPalette.mutedFg,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(identity.name, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(
                    '${identity.digitalId} · ${identity.note ?? ''}',
                    style: theme.textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _RadioDot(selected: selected),
          ],
        ),
      ),
    );
  }

  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }
}

class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? theme.colorScheme.primary : Colors.transparent,
        border: Border.all(
          color: selected
              ? theme.colorScheme.primary
              : (theme.textTheme.bodyMedium?.color ?? theme.colorScheme.outline),
          width: 2,
        ),
      ),
      child: selected
          ? const Center(
              child: Icon(
                Icons.check_rounded,
                size: 10,
                color: Colors.white,
              ),
            )
          : null,
    );
  }
}

// ─── Step 2: Candidate ──────────────────────────────────────────────────────

class _CandidateStep extends StatelessWidget {
  const _CandidateStep({
    required this.election,
    required this.selected,
    required this.onSelected,
    required this.onContinue,
  });

  final Election election;
  final ElectionCandidate? selected;
  final ValueChanged<ElectionCandidate> onSelected;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(strings.candidatePickSubtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(fontSize: 13)),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: theme.colorScheme.outline),
                  ),
                  child: Column(
                    children: [
                      for (var i = 0; i < election.candidates.length; i++) ...[
                        _CandidateTile(
                          candidate: election.candidates[i],
                          color: _candidatePalette[i % _candidatePalette.length],
                          selected: selected?.id == election.candidates[i].id,
                          onTap: () => onSelected(election.candidates[i]),
                        ),
                        if (i < election.candidates.length - 1)
                          Divider(height: 1, color: theme.colorScheme.outline),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        _BottomCta(
          label: strings.continueLabel,
          onTap: selected == null ? null : onContinue,
        ),
      ],
    );
  }
}

class _CandidateTile extends StatelessWidget {
  const _CandidateTile({
    required this.candidate,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final ElectionCandidate candidate;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subline = candidate.displaySubtext ?? candidate.id;
    return InkWell(
      onTap: onTap,
      child: Container(
        color: selected
            ? theme.colorScheme.surfaceContainerHighest
            : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            CandidateAvatar(
              name: candidate.name,
              photoUrl: candidate.photoUrl,
              fallbackColor: color,
              size: 44,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(candidate.name, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(
                    subline,
                    style: theme.textTheme.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            _RadioDot(selected: selected),
          ],
        ),
      ),
    );
  }
}

// ─── Step 3: Confirm ────────────────────────────────────────────────────────

class _ConfirmStep extends StatelessWidget {
  const _ConfirmStep({
    required this.election,
    required this.identity,
    required this.identityMode,
    required this.candidate,
    required this.submitting,
    required this.duplicateVote,
    required this.errorMessage,
    required this.onSubmit,
  });

  final Election election;
  final VerifiedIdentity identity;
  final _IdentityMode identityMode;
  final ElectionCandidate candidate;
  final bool submitting;
  final bool duplicateVote;
  final String? errorMessage;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return Column(
      children: [
        if (duplicateVote)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: _DuplicateVoteCallout(strings: strings),
          )
        else if (errorMessage != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: _ErrorBox(message: errorMessage!),
          ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _BallotCard(
                  election: election,
                  identity: identity,
                  identityMode: identityMode,
                  candidate: candidate,
                  strings: strings,
                ),
                const SizedBox(height: 16),
                _ProtectionCard(strings: strings),
              ],
            ),
          ),
        ),
        _BottomCta(
          label: submitting ? strings.submitting : strings.castVote,
          onTap: submitting ? null : onSubmit,
          submitting: submitting,
        ),
      ],
    );
  }
}

class _BallotCard extends StatelessWidget {
  const _BallotCard({
    required this.election,
    required this.identity,
    required this.identityMode,
    required this.candidate,
    required this.strings,
  });

  final Election election;
  final VerifiedIdentity identity;
  final _IdentityMode identityMode;
  final ElectionCandidate candidate;
  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            strings.confirmTitle.toUpperCase(),
            style: theme.textTheme.labelSmall,
          ),
          const SizedBox(height: 14),
          _BallotRow(
            label: strings.confirmElectionLabel,
            value: election.name,
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: theme.colorScheme.outline),
          const SizedBox(height: 12),
          _BallotRow(
            label: strings.confirmIdentityLabel,
            value: identityMode == _IdentityMode.cei
                ? strings.ceiIdentityDescription
                : identity.displayName,
            sub: identityMode == _IdentityMode.demo
                ? identity.digitalId
                : null,
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: theme.colorScheme.outline),
          const SizedBox(height: 12),
          _BallotRow(
            label: strings.confirmCandidateLabel,
            value: candidate.name,
            sub: candidate.displaySubtext ?? candidate.id,
          ),
        ],
      ),
    );
  }
}

class _BallotRow extends StatelessWidget {
  const _BallotRow({required this.label, required this.value, this.sub});

  final String label;
  final String value;
  final String? sub;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
        ),
        const SizedBox(height: 2),
        Text(value, style: theme.textTheme.titleMedium),
        if (sub != null) ...[
          const SizedBox(height: 1),
          Text(sub!, style: theme.textTheme.bodySmall?.copyWith(fontSize: 11)),
        ],
      ],
    );
  }
}

class _ProtectionCard extends StatelessWidget {
  const _ProtectionCard({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              HugeIcon(
                icon: HugeIcons.strokeRoundedSquareLock02,
                color: theme.colorScheme.primary,
                size: 14,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  strings.confirmPrivacyTitle,
                  style: theme.textTheme.titleMedium?.copyWith(fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          for (final bullet in strings.confirmPrivacyBullets)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      bullet,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _DuplicateVoteCallout extends StatelessWidget {
  const _DuplicateVoteCallout({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CivicPalette.statusAmberBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CivicPalette.amberBannerBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const HugeIcon(
            icon: HugeIcons.strokeRoundedAlert02,
            color: CivicPalette.amberBannerFg,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.duplicateVoteTitle,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: CivicPalette.amberBannerFg,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  strings.duplicateVoteBody,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontSize: 13,
                    color: CivicPalette.amberBannerFg,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.colorScheme.error.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          HugeIcon(
            icon: HugeIcons.strokeRoundedAlert02,
            color: theme.colorScheme.error,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Step 4: Receipt ────────────────────────────────────────────────────────

class _ReceiptStep extends StatelessWidget {
  const _ReceiptStep({
    required this.election,
    required this.result,
    required this.onDone,
  });

  final Election election;
  final VoteSubmissionResult result;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final block = (result.body['block'] as Map?) ?? const {};
    // Backend returns { blockNumber, blockHash }; older mocks may use index/hash.
    final blockHash =
        (block['blockHash'] ?? block['hash'])?.toString();
    final blockNumber =
        (block['blockNumber'] ?? block['index'])?.toString();

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),
                Center(child: _SuccessGlyph()),
                const SizedBox(height: 18),
                Text(
                  strings.receiptHeadline,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineSmall?.copyWith(fontSize: 22),
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    strings.receiptSubtitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(fontSize: 13),
                  ),
                ),
                const SizedBox(height: 20),
                _ReceiptCard(
                  transactionType: result.transactionType,
                  blockNumber: blockNumber,
                  blockHash: blockHash,
                  electionId: election.id,
                ),
              ],
            ),
          ),
        ),
        _BottomCta(label: strings.receiptDone, onTap: onDone),
      ],
    );
  }
}

class _SuccessGlyph extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.primary.withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
        ),
        Positioned(
          top: -4,
          right: -4,
          child: Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: Color(0xFF10B981),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              size: 12,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}

class _ReceiptCard extends StatelessWidget {
  const _ReceiptCard({
    required this.transactionType,
    required this.blockNumber,
    required this.blockHash,
    required this.electionId,
  });

  final String transactionType;
  final String? blockNumber;
  final String? blockHash;
  final String electionId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              HugeIcon(
                icon: HugeIcons.strokeRoundedHashtag,
                color: theme.textTheme.bodyMedium?.color ??
                    theme.colorScheme.onSurface,
                size: 13,
              ),
              const SizedBox(width: 8),
              Text(
                strings.receiptCardTitle.toUpperCase(),
                style: theme.textTheme.labelSmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          _ReceiptRow(
            label: strings.receiptTxLabel,
            value: transactionType,
            mono: true,
          ),
          const SizedBox(height: 10),
          if (blockNumber != null) ...[
            _ReceiptRow(
              label: strings.receiptBlockLabel,
              value: '#$blockNumber',
              mono: true,
            ),
            const SizedBox(height: 10),
          ],
          _ReceiptRow(
            label: strings.receiptStatusLabel,
            value: strings.receiptStatusConfirmed,
            valueColor: const Color(0xFF059669),
          ),
          if (blockHash != null) ...[
            const SizedBox(height: 12),
            Divider(height: 1, color: theme.colorScheme.outline),
            const SizedBox(height: 12),
            Text(
              strings.receiptHashLabel,
              style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
            ),
            const SizedBox(height: 6),
            _HashChip(hash: blockHash!, electionId: electionId),
            const SizedBox(height: 6),
            Text(
              strings.receiptHashHint,
              style: theme.textTheme.bodySmall?.copyWith(
                fontSize: 10,
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  const _ReceiptRow({
    required this.label,
    required this.value,
    this.mono = false,
    this.valueColor,
  });

  final String label;
  final String value;
  final bool mono;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: theme.textTheme.bodyMedium?.copyWith(fontSize: 12)),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontFamily: mono ? 'monospace' : null,
            fontWeight: FontWeight.w700,
            color: valueColor ?? theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}

/// Tappable monospace hash chip — opens the chain explorer at port 5173 with
/// `?electionId=...&hash=...`. Long-press copies the full hash.
class _HashChip extends StatelessWidget {
  const _HashChip({required this.hash, required this.electionId});

  final String hash;
  final String electionId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: () => _openExplorer(context),
      onLongPress: () async {
        await Clipboard.setData(ClipboardData(text: hash));
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Block hash copied')),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          '0x$hash',
          style: const TextStyle(
            fontSize: 11,
            fontFamily: 'monospace',
            height: 1.5,
          ),
        ),
      ),
    );
  }

  Future<void> _openExplorer(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final explorer = _explorerUri(gatewayBase, electionId, hash);
    if (explorer == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('No gateway host configured.')),
      );
      return;
    }
    final launched =
        await launchUrl(explorer, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      messenger.showSnackBar(
        SnackBar(content: Text('Could not open ${explorer.toString()}')),
      );
    }
  }
}

/// Builds `http://<gateway-host>:5173/chain?electionId=...&hash=...`
/// for the chain explorer running alongside the gateway. Returns `null`
/// when the gateway URL is empty or malformed.
Uri? _explorerUri(String gatewayUrl, String electionId, String blockHash) {
  if (gatewayUrl.isEmpty) return null;
  final base = Uri.tryParse(gatewayUrl);
  if (base == null || base.host.isEmpty) return null;
  return Uri(
    scheme: base.scheme.isEmpty ? 'http' : base.scheme,
    host: base.host,
    port: 5173,
    path: '/chain',
    queryParameters: {
      'electionId': electionId,
      'hash': blockHash,
    },
  );
}

// ─── Bottom CTA button ──────────────────────────────────────────────────────

class _BottomCta extends StatelessWidget {
  const _BottomCta({
    required this.label,
    required this.onTap,
    this.submitting = false,
  });

  final String label;
  final VoidCallback? onTap;
  final bool submitting;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: FilledButton(
          onPressed: onTap,
          child: submitting
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: theme.colorScheme.onPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(label),
                  ],
                )
              : Text(label),
        ),
      ),
    );
  }
}
