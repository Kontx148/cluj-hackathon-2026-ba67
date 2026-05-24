import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/election.dart';
import 'digital_id_encryption_service.dart';
import 'election_key_service.dart';

class ElectionVoteRequest {
  const ElectionVoteRequest({
    required this.election,
    required this.candidateId,
    required this.digitalId,
    required this.districtId,
    this.anonymousTokenHash,
    this.voterProof,
    this.timestamp,
  });

  final Election election;
  final String candidateId;
  final String digitalId;
  final String districtId;

  /// Optional overrides — when omitted, the service generates plausible
  /// mock values that are accepted by the validator.
  final String? anonymousTokenHash;
  final String? voterProof;
  final DateTime? timestamp;
}

class VoteSubmissionResult {
  const VoteSubmissionResult({
    required this.transactionType,
    required this.candidateId,
    required this.body,
  });

  final String transactionType;
  final String candidateId;
  final Map<String, dynamic> body;
}

class VoteSubmissionException implements Exception {
  VoteSubmissionException({
    required this.statusCode,
    required this.body,
    required this.message,
  });

  final int statusCode;
  final Map<String, dynamic> body;
  final String message;

  @override
  String toString() => message;
}

class ElectionVoteService {
  ElectionVoteService({
    http.Client? client,
    ElectionKeyService? keyService,
    DigitalIdEncryptionService? encryptionService,
    String? baseUrl,
  })  : _client = client ?? http.Client(),
        _keyService =
            keyService ?? ElectionKeyService(client: client, baseUrl: baseUrl),
        _encryptionService = encryptionService ?? DigitalIdEncryptionService(),
        _baseUrl = baseUrl ?? apiBase;

  final http.Client _client;
  final ElectionKeyService _keyService;
  final DigitalIdEncryptionService _encryptionService;
  final String _baseUrl;

  Future<VoteSubmissionResult> submitVote(ElectionVoteRequest request) async {
    if (_baseUrl.isEmpty) {
      throw StateError(
        'API_BASE must point to a gateway before submitting votes.',
      );
    }

    final electionId = request.election.id;
    final publicKey = await _keyService.fetchElectionPublicKey(electionId);

    if (!_isPemKey(publicKey.publicKey)) {
      throw VoteSubmissionException(
        statusCode: 0,
        body: const {},
        message:
            'This election is using a legacy mock key. The deployed gateway '
            'needs the latest backend (with /elections/:id/public-key + '
            'eligibility list). Redeploy and try again.',
      );
    }

    final encryptedDigitalId = _encryptionService.encryptDigitalId(
      digitalId: request.digitalId,
      electionPublicKeyPem: publicKey.publicKey,
    );

    final encryptedVote = _buildEncryptedVote(request.election, request.candidateId);
    final token = request.anonymousTokenHash ?? _randomHex(32);
    // #region agent log
    try {
      await http.post(
        Uri.parse(
          'http://127.0.0.1:7528/ingest/9b39a962-5f44-4917-9c64-0e70bdd0a08a',
        ),
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '3c82ea',
        },
        body: jsonEncode({
          'sessionId': '3c82ea',
          'location': 'election_vote_service.dart:submitVote',
          'message': 'client vote token generation',
          'data': {
            'electionId': electionId,
            'tokenFromRequest': request.anonymousTokenHash != null,
            'anonymousTokenHashPrefix': token.length >= 12
                ? token.substring(0, 12)
                : token,
            'generatesFreshTokenEachSubmit': request.anonymousTokenHash == null,
          },
          'timestamp': DateTime.now().millisecondsSinceEpoch,
          'hypothesisId': 'B',
          'runId': 'pre-fix',
        }),
      );
    } catch (_) {}
    // #endregion
    final proof = request.voterProof ?? 'mock-voter-proof:${_randomHex(8)}';
    final timestamp = (request.timestamp ?? DateTime.now()).toUtc();

    final payload = {
      'electionId': electionId,
      'districtId': request.districtId,
      'anonymousTokenHash': token,
      'candidateId': request.candidateId,
      'encryptedVote': encryptedVote,
      'encryptedDigitalId': encryptedDigitalId,
      'voterProof': proof,
      'timestamp': timestamp.toIso8601String(),
    };

    final uri = Uri.parse('$_baseUrl/votes');
    final response = await _client
        .post(
          uri,
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode(payload),
        )
        .timeout(const Duration(seconds: 20));

    Map<String, dynamic> decoded;
    try {
      decoded = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      decoded = {'raw': response.body};
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw VoteSubmissionException(
        statusCode: response.statusCode,
        body: decoded,
        message: _humanError(response.statusCode, decoded),
      );
    }

    return VoteSubmissionResult(
      transactionType:
          (decoded['transaction'] as Map?)?['type']?.toString() ?? 'VOTE_CAST',
      candidateId: request.candidateId,
      body: decoded,
    );
  }

  String _buildEncryptedVote(Election election, String candidateId) {
    final idx = election.candidates.indexWhere((c) => c.id == candidateId);
    if (idx < 0) {
      throw ArgumentError(
        'Candidate $candidateId is not part of election ${election.id}',
      );
    }
    final vector = List<int>.filled(election.candidates.length, 0);
    vector[idx] = 1;
    return 'mock-enc:${election.id}:${jsonEncode(vector)}';
  }

  bool _isPemKey(String key) {
    return key.contains('-----BEGIN') && key.contains('PUBLIC KEY-----');
  }

  String _humanError(int status, Map<String, dynamic> body) {
    final raw = (body['error'] ?? body['message'] ?? body).toString();
    return switch (status) {
      403 => 'Voter not eligible. The decrypted digital ID is not on the '
          'validator allowlist.',
      409 => raw.contains('Digital ID already voted')
          ? 'You have already voted in this election.'
          : 'This anonymous token has already been used to vote.',
      400 => 'Vote rejected: $raw',
      502 => 'Validators could not reach consensus: $raw',
      _ => 'Vote API $status: $raw',
    };
  }

  String _randomHex(int bytes) {
    final r = Random.secure();
    final out = StringBuffer();
    for (var i = 0; i < bytes; i++) {
      out.write(r.nextInt(256).toRadixString(16).padLeft(2, '0'));
    }
    return out.toString();
  }
}
