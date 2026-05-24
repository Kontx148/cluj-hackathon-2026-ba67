enum ElectionStatus {
  proposed,
  approved,
  open,
  frozen,
  tallying,
  decrypted,
  finished,
  unknown;

  static ElectionStatus parse(String? raw) {
    return switch (raw) {
      'PROPOSED' => ElectionStatus.proposed,
      'APPROVED' => ElectionStatus.approved,
      'OPEN' => ElectionStatus.open,
      'FROZEN' => ElectionStatus.frozen,
      'TALLYING' => ElectionStatus.tallying,
      'DECRYPTED' => ElectionStatus.decrypted,
      'FINISHED' => ElectionStatus.finished,
      _ => ElectionStatus.unknown,
    };
  }

  bool get acceptsVotes => this == ElectionStatus.open;
}

class ElectionCandidate {
  const ElectionCandidate({
    required this.id,
    required this.name,
    this.subtext,
    this.photoUrl,
  });

  final String id;
  final String name;
  final String? subtext;
  final String? photoUrl;

  /// Line shown under the name in the ballot (party, list, etc.).
  String? get displaySubtext {
    final s = subtext?.trim();
    if (s != null && s.isNotEmpty) return s;
    return null;
  }

  factory ElectionCandidate.fromJson(Map<String, dynamic> json) {
    return ElectionCandidate(
      id: json['id'] as String,
      name: json['name'] as String,
      subtext: json['subtext'] as String?,
      photoUrl: json['photoUrl'] as String?,
    );
  }
}

/// Public election summary returned by the gateway.
class Election {
  const Election({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    required this.districts,
    required this.candidates,
    required this.startsAt,
    required this.endsAt,
    this.electionPublicKey,
    this.publishedTally,
  });

  final String id;
  final String name;
  final String type;
  final ElectionStatus status;
  final List<String> districts;
  final List<ElectionCandidate> candidates;
  final DateTime startsAt;
  final DateTime endsAt;

  /// RSA public key (PEM) for encrypting the voter digital ID before submit.
  final String? electionPublicKey;

  final Map<String, dynamic>? publishedTally;

  factory Election.fromJson(Map<String, dynamic> json) {
    final candidates = (json['candidates'] as List<dynamic>? ?? [])
        .map((e) => ElectionCandidate.fromJson(e as Map<String, dynamic>))
        .toList();
    final districts = (json['districts'] as List<dynamic>? ?? [])
        .map((e) => e.toString())
        .toList();
    return Election(
      id: json['electionId'] as String,
      name: (json['name'] as String?) ?? json['electionId'] as String,
      type: (json['type'] as String?) ?? 'UNKNOWN',
      status: ElectionStatus.parse(json['status'] as String?),
      districts: districts,
      candidates: candidates,
      startsAt: DateTime.parse(json['startsAt'] as String),
      endsAt: DateTime.parse(json['endsAt'] as String),
      electionPublicKey: json['electionPublicKey'] as String?,
      publishedTally: json['publishedTally'] as Map<String, dynamic>?,
    );
  }
}
