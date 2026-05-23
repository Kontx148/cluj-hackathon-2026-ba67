import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../data/demo_identities.dart';
import '../../l10n/locale_scope.dart';
import '../../models/election.dart';
import '../../services/election_vote_service.dart';
import '../../services/identity_service.dart';

enum _Step { identity, candidate, confirm, receipt }

class VoteFlowScreen extends StatefulWidget {
  const VoteFlowScreen({super.key, required this.election});

  final Election election;

  @override
  State<VoteFlowScreen> createState() => _VoteFlowScreenState();
}

class _VoteFlowScreenState extends State<VoteFlowScreen> {
  _Step _step = _Step.identity;

  VerifiedIdentity? _identity;
  ElectionCandidate? _candidate;

  bool _submitting = false;
  String? _errorMessage;
  VoteSubmissionResult? _result;

  final _identityService = IdentityService();
  final _voteService = ElectionVoteService();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: HugeIcon(
            icon: HugeIcons.strokeRoundedArrowLeft01,
            color: theme.colorScheme.onSurface,
            size: 22,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(strings.voteFlowTitle),
        titleTextStyle: theme.textTheme.titleLarge,
      ),
      body: SafeArea(
        child: Column(
          children: [
            _Stepper(step: _step),
            const SizedBox(height: 8),
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

  Widget _buildStep(BuildContext context) {
    switch (_step) {
      case _Step.identity:
        return _IdentityStep(
          onCEI: _handleEidkit,
          onDemoPicked: (demo) {
            setState(() {
              _identity = VerifiedIdentity(
                digitalId: demo.digitalId,
                displayName: demo.name,
                source: IdentitySource.demo,
              );
              _step = _Step.candidate;
            });
          },
        );
      case _Step.candidate:
        return _CandidateStep(
          election: widget.election,
          identity: _identity!,
          selected: _candidate,
          onSelected: (c) => setState(() => _candidate = c),
          onContinue: () => setState(() => _step = _Step.confirm),
          onBack: () => setState(() => _step = _Step.identity),
        );
      case _Step.confirm:
        return _ConfirmStep(
          election: widget.election,
          identity: _identity!,
          candidate: _candidate!,
          submitting: _submitting,
          errorMessage: _errorMessage,
          onSubmit: _submit,
          onBack: () => setState(() {
            _errorMessage = null;
            _step = _Step.candidate;
          }),
        );
      case _Step.receipt:
        return _ReceiptStep(
          election: widget.election,
          candidate: _candidate!,
          result: _result!,
          onDone: () => Navigator.of(context).pop(),
        );
    }
  }

  Future<void> _handleEidkit() async {
    final messenger = ScaffoldMessenger.of(context);
    final strings = context.strings;
    await _identityService.startEidkitFlow();
    if (!mounted) return;
    messenger.showSnackBar(
      SnackBar(content: Text(strings.eidkitStubMessage)),
    );
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _errorMessage = null;
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
      setState(() {
        _result = result;
        _step = _Step.receipt;
      });
    } on VoteSubmissionException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _Stepper extends StatelessWidget {
  const _Stepper({required this.step});

  final _Step step;

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
    final activeIdx = _Step.values.indexOf(step);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: List.generate(labels.length * 2 - 1, (i) {
          if (i.isOdd) {
            final filled = (i ~/ 2) < activeIdx;
            return Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 6),
                height: 2,
                color: filled
                    ? theme.colorScheme.primary
                    : theme.colorScheme.outline,
              ),
            );
          }
          final idx = i ~/ 2;
          final done = idx < activeIdx;
          final active = idx == activeIdx;
          final fg = done || active
              ? theme.colorScheme.primary
              : theme.colorScheme.onSurface.withValues(alpha: 0.5);
          final bg = active
              ? theme.colorScheme.primary
              : (done
                  ? theme.colorScheme.primaryContainer
                  : theme.colorScheme.surface);
          final fgIcon = active ? theme.colorScheme.onPrimary : fg;
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: bg,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: theme.colorScheme.primary.withValues(
                      alpha: done || active ? 1 : 0.3,
                    ),
                  ),
                ),
                alignment: Alignment.center,
                child: done
                    ? HugeIcon(
                        icon: HugeIcons.strokeRoundedTickDouble03,
                        color: theme.colorScheme.primary,
                        size: 14,
                      )
                    : Text(
                        '${idx + 1}',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: fgIcon,
                        ),
                      ),
              ),
              const SizedBox(height: 4),
              SizedBox(
                width: 70,
                child: Text(
                  labels[idx],
                  textAlign: TextAlign.center,
                  style: theme.textTheme.labelSmall?.copyWith(color: fg),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}

// Identity step ---------------------------------------------------------------

class _IdentityStep extends StatefulWidget {
  const _IdentityStep({required this.onCEI, required this.onDemoPicked});

  final Future<void> Function() onCEI;
  final ValueChanged<DemoIdentity> onDemoPicked;

  @override
  State<_IdentityStep> createState() => _IdentityStepState();
}

class _IdentityStepState extends State<_IdentityStep> {
  bool _devMode = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _CalloutCard(
            icon: HugeIcons.strokeRoundedShieldKey,
            color: theme.colorScheme.primary,
            title: strings.identityCalloutTitle,
            body: strings.identityCalloutBody,
          ),
          const SizedBox(height: 16),
          _PrimaryActionCard(
            icon: HugeIcons.strokeRoundedIdentityCard,
            title: strings.identityCEITitle,
            subtitle: strings.identityCEISubtitle,
            cta: strings.identityCEICta,
            onTap: widget.onCEI,
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 12, 6),
              child: Row(
                children: [
                  HugeIcon(
                    icon: HugeIcons.strokeRoundedDeveloper,
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          strings.devModeTitle,
                          style: theme.textTheme.titleMedium,
                        ),
                        Text(
                          strings.devModeSubtitle,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _devMode,
                    onChanged: (v) => setState(() => _devMode = v),
                  ),
                ],
              ),
            ),
          ),
          if (_devMode) ...[
            const SizedBox(height: 12),
            Text(
              strings.devModePickIdentity,
              style: theme.textTheme.labelSmall,
            ),
            const SizedBox(height: 8),
            for (final id in demoIdentities) ...[
              _DemoIdentityTile(
                identity: id,
                onTap: () => widget.onDemoPicked(id),
              ),
              const SizedBox(height: 8),
            ],
          ],
        ],
      ),
    );
  }
}

class _DemoIdentityTile extends StatelessWidget {
  const _DemoIdentityTile({required this.identity, required this.onTap});

  final DemoIdentity identity;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = identity.eligible
        ? const Color(0xFF2F9E44)
        : theme.colorScheme.error;
    final icon = identity.eligible
        ? HugeIcons.strokeRoundedIdVerified
        : HugeIcons.strokeRoundedIdNotVerified;
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: HugeIcon(icon: icon, color: color, size: 22),
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
                    ),
                  ],
                ),
              ),
              HugeIcon(
                icon: HugeIcons.strokeRoundedArrowRight01,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Candidate step --------------------------------------------------------------

class _CandidateStep extends StatelessWidget {
  const _CandidateStep({
    required this.election,
    required this.identity,
    required this.selected,
    required this.onSelected,
    required this.onContinue,
    required this.onBack,
  });

  final Election election;
  final VerifiedIdentity identity;
  final ElectionCandidate? selected;
  final ValueChanged<ElectionCandidate> onSelected;
  final VoidCallback onContinue;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _IdentitySummaryStrip(identity: identity),
                const SizedBox(height: 14),
                Text(
                  strings.candidatePickTitle,
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  strings.candidatePickSubtitle,
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                for (final c in election.candidates)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _CandidateTile(
                      candidate: c,
                      selected: c.id == selected?.id,
                      onTap: () => onSelected(c),
                    ),
                  ),
              ],
            ),
          ),
        ),
        _StepFooter(
          backLabel: strings.back,
          continueLabel: strings.continueLabel,
          onBack: onBack,
          onContinue: selected == null ? null : onContinue,
        ),
      ],
    );
  }
}

class _CandidateTile extends StatelessWidget {
  const _CandidateTile({
    required this.candidate,
    required this.selected,
    required this.onTap,
  });

  final ElectionCandidate candidate;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fill = selected
        ? theme.colorScheme.primaryContainer
        : theme.colorScheme.surface;
    final border = selected
        ? theme.colorScheme.primary
        : theme.colorScheme.outline.withValues(alpha: 0.6);

    return Material(
      color: fill,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: border, width: selected ? 1.5 : 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.15),
                foregroundColor: theme.colorScheme.primary,
                child: Text(
                  _initials(candidate.name),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      candidate.name,
                      style: theme.textTheme.titleMedium,
                    ),
                    Text(
                      candidate.id,
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              if (selected)
                HugeIcon(
                  icon: HugeIcons.strokeRoundedCheckmarkCircle02,
                  color: theme.colorScheme.primary,
                  size: 24,
                )
              else
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: theme.colorScheme.outline),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }
}

// Confirm step ----------------------------------------------------------------

class _ConfirmStep extends StatelessWidget {
  const _ConfirmStep({
    required this.election,
    required this.identity,
    required this.candidate,
    required this.submitting,
    required this.errorMessage,
    required this.onSubmit,
    required this.onBack,
  });

  final Election election;
  final VerifiedIdentity identity;
  final ElectionCandidate candidate;
  final bool submitting;
  final String? errorMessage;
  final VoidCallback onSubmit;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  strings.confirmTitle,
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  strings.confirmSubtitle,
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                _SummaryCard(
                  rows: [
                    _SummaryRow(
                      icon: HugeIcons.strokeRoundedShield02,
                      label: strings.confirmElectionLabel,
                      value: election.name,
                    ),
                    _SummaryRow(
                      icon: HugeIcons.strokeRoundedUserCheck01,
                      label: strings.confirmIdentityLabel,
                      value: '${identity.displayName} · ${identity.digitalId}',
                    ),
                    _SummaryRow(
                      icon: HugeIcons.strokeRoundedCheckmarkCircle02,
                      label: strings.confirmCandidateLabel,
                      value: candidate.name,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _CalloutCard(
                  icon: HugeIcons.strokeRoundedSecurityLock,
                  color: theme.colorScheme.primary,
                  title: strings.confirmPrivacyTitle,
                  body: strings.confirmPrivacyBody,
                ),
                if (errorMessage != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.error.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: theme.colorScheme.error.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        HugeIcon(
                          icon: HugeIcons.strokeRoundedAlert02,
                          color: theme.colorScheme.error,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            errorMessage!,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        _StepFooter(
          backLabel: strings.back,
          continueLabel: submitting ? strings.submitting : strings.castVote,
          onBack: submitting ? null : onBack,
          onContinue: submitting ? null : onSubmit,
          continueIcon: submitting ? null : HugeIcons.strokeRoundedTickDouble03,
          showSpinner: submitting,
        ),
      ],
    );
  }
}

// Receipt step ----------------------------------------------------------------

class _ReceiptStep extends StatelessWidget {
  const _ReceiptStep({
    required this.election,
    required this.candidate,
    required this.result,
    required this.onDone,
  });

  final Election election;
  final ElectionCandidate candidate;
  final VoteSubmissionResult result;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final block = (result.body['block'] as Map?) ?? const {};
    final blockHash = block['hash']?.toString();
    final blockIndex = block['index']?.toString();

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    children: [
                      HugeIcon(
                        icon: HugeIcons.strokeRoundedTaskDone02,
                        color: theme.colorScheme.primary,
                        size: 48,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        strings.receiptHeadline,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        strings.receiptBody(election.name, candidate.name),
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _SummaryCard(
                  rows: [
                    _SummaryRow(
                      icon: HugeIcons.strokeRoundedShield02,
                      label: strings.receiptTxLabel,
                      value: result.transactionType,
                    ),
                    if (blockIndex != null)
                      _SummaryRow(
                        icon: HugeIcons.strokeRoundedInboxCheck,
                        label: strings.receiptBlockLabel,
                        value: '#$blockIndex',
                      ),
                    if (blockHash != null)
                      _SummaryRow(
                        icon: HugeIcons.strokeRoundedSecurityLock,
                        label: strings.receiptHashLabel,
                        value: '${blockHash.substring(0, 16)}…',
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onDone,
              child: Text(strings.receiptDone),
            ),
          ),
        ),
      ],
    );
  }
}

// Shared building blocks -----------------------------------------------------

class _StepFooter extends StatelessWidget {
  const _StepFooter({
    required this.backLabel,
    required this.continueLabel,
    required this.onBack,
    required this.onContinue,
    this.continueIcon,
    this.showSpinner = false,
  });

  final String backLabel;
  final String continueLabel;
  final VoidCallback? onBack;
  final VoidCallback? onContinue;
  final List<List<dynamic>>? continueIcon;
  final bool showSpinner;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: OutlinedButton(
              onPressed: onBack,
              child: Text(backLabel),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 3,
            child: FilledButton(
              onPressed: onContinue,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (showSpinner) ...[
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: theme.colorScheme.onPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Flexible(
                    child: Text(
                      continueLabel,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (continueIcon != null) ...[
                    const SizedBox(width: 6),
                    HugeIcon(
                      icon: continueIcon!,
                      color: theme.colorScheme.onPrimary,
                      size: 18,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CalloutCard extends StatelessWidget {
  const _CalloutCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });

  final List<List<dynamic>> icon;
  final Color color;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          HugeIcon(icon: icon, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(color: color),
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

class _PrimaryActionCard extends StatelessWidget {
  const _PrimaryActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.cta,
    required this.onTap,
  });

  final List<List<dynamic>> icon;
  final String title;
  final String subtitle;
  final String cta;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.primary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: HugeIcon(
                      icon: icon,
                      color: theme.colorScheme.onPrimary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title,
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: theme.colorScheme.onPrimary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onPrimary.withValues(alpha: 0.85),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Text(
                    cta,
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: theme.colorScheme.onPrimary,
                    ),
                  ),
                  const SizedBox(width: 6),
                  HugeIcon(
                    icon: HugeIcons.strokeRoundedArrowRight01,
                    color: theme.colorScheme.onPrimary,
                    size: 20,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.rows});

  final List<_SummaryRow> rows;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: [
            for (var i = 0; i < rows.length; i++) ...[
              if (i > 0) const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: rows[i],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final List<List<dynamic>> icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HugeIcon(
          icon: icon,
          color: theme.colorScheme.primary,
          size: 22,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: theme.textTheme.labelSmall),
              const SizedBox(height: 2),
              Text(value, style: theme.textTheme.titleMedium),
            ],
          ),
        ),
      ],
    );
  }
}

class _IdentitySummaryStrip extends StatelessWidget {
  const _IdentitySummaryStrip({required this.identity});

  final VerifiedIdentity identity;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final src = identity.source == IdentitySource.demo
        ? strings.identitySourceDemo
        : strings.identitySourceCEI;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          HugeIcon(
            icon: HugeIcons.strokeRoundedUserCheck01,
            color: theme.colorScheme.primary,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${identity.displayName} · $src',
                  style: theme.textTheme.titleMedium,
                ),
                Text(
                  identity.digitalId,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
