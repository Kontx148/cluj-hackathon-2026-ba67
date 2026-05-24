import 'dart:convert';

class LawSummarySection {
  const LawSummarySection({required this.title, required this.body});

  final String title;
  final String body;

  factory LawSummarySection.fromJson(Map<String, dynamic> json) {
    return LawSummarySection(
      title: (json['title'] as String? ?? '').trim(),
      body: (json['body'] as String? ?? '').trim(),
    );
  }
}

/// Structured plain-language law summary (JSON in plain_summary / plain_summary_en).
class LawPlainSummary {
  const LawPlainSummary({
    required this.tldr,
    required this.sections,
  });

  final List<String> tldr;
  final List<LawSummarySection> sections;

  bool get hasTldr => tldr.isNotEmpty;

  /// Card preview — first TL;DR bullets or legacy prose.
  String get previewText {
    if (tldr.isNotEmpty) {
      final joined = tldr.take(2).join(' · ');
      return joined.length > 220 ? '${joined.substring(0, 217)}…' : joined;
    }
    if (sections.isNotEmpty && sections.first.body.isNotEmpty) {
      final body = sections.first.body;
      return body.length > 220 ? '${body.substring(0, 217)}…' : body;
    }
    return '';
  }

  static LawPlainSummary? parse(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;

    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) {
        final summary = LawPlainSummary.fromJson(decoded);
        if (summary.tldr.isNotEmpty || summary.sections.isNotEmpty) {
          return summary;
        }
      }
    } catch (_) {
      // Legacy: plain prose string stored before structured format.
    }

    return LawPlainSummary(
      tldr: const [],
      sections: [LawSummarySection(title: '', body: raw.trim())],
    );
  }

  factory LawPlainSummary.fromJson(Map<String, dynamic> json) {
    final tldr = (json['tldr'] as List<dynamic>? ?? [])
        .map((e) => e.toString().trim())
        .where((s) => s.isNotEmpty)
        .toList();

    final sections = (json['sections'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(LawSummarySection.fromJson)
        .where((s) => s.body.isNotEmpty)
        .toList();

    return LawPlainSummary(tldr: tldr, sections: sections);
  }
}
