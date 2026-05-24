import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';
import '../models/law_plain_summary.dart';

class LawSummaryBody extends StatelessWidget {
  const LawSummaryBody({
    super.key,
    required this.summary,
    required this.strings,
    required this.pending,
  });

  final LawPlainSummary? summary;
  final AppStrings strings;
  final bool pending;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (pending || summary == null) {
      return Text(
        strings.lawSummaryPending,
        style: theme.textTheme.bodyMedium?.copyWith(
          height: 1.5,
          fontStyle: FontStyle.italic,
          color: theme.colorScheme.onSurfaceVariant,
        ),
      );
    }

    final children = <Widget>[];

    if (summary!.hasTldr) {
      children.addAll([
        Text(
          strings.lawTldrHeading,
          style: theme.textTheme.titleLarge?.copyWith(fontSize: 14),
        ),
        const SizedBox(height: 8),
        _SummaryCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: summary!.tldr
                .map(
                  (point) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 7),
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            point,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              height: 1.45,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 16),
      ]);
    }

    final sections = summary!.sections;
    for (var i = 0; i < sections.length; i++) {
      final section = sections[i];
      if (section.title.isNotEmpty) {
        children.add(
          Text(
            section.title,
            style: theme.textTheme.titleLarge?.copyWith(fontSize: 14),
          ),
        );
        children.add(const SizedBox(height: 8));
      } else if (i == 0 && !summary!.hasTldr) {
        children.add(
          Text(
            strings.lawSummaryHeading,
            style: theme.textTheme.titleLarge?.copyWith(fontSize: 14),
          ),
        );
        children.add(const SizedBox(height: 8));
      }

      children.add(
        _SummaryCard(
          child: Text(
            section.body,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.55),
          ),
        ),
      );

      if (i < sections.length - 1) {
        children.add(const SizedBox(height: 16));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: child,
    );
  }
}
