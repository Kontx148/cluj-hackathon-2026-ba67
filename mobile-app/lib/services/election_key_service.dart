import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';

class ElectionPublicKey {
  const ElectionPublicKey({
    required this.electionId,
    required this.publicKey,
  });

  final String electionId;
  final String publicKey;

  factory ElectionPublicKey.fromJson(Map<String, dynamic> json) {
    return ElectionPublicKey(
      electionId: json['electionId'] as String,
      publicKey: json['publicKey'] as String,
    );
  }
}

class ElectionKeyService {
  ElectionKeyService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? apiBase;

  final http.Client _client;
  final String _baseUrl;

  /// Loads the election RSA public key.
  ///
  /// Tries `GET /elections/:id/public-key` first. Older gateways omit that
  /// route but still return `electionPublicKey` on `GET /elections/:id`.
  Future<ElectionPublicKey> fetchElectionPublicKey(
    String electionId, {
    String? cachedPem,
  }) async {
    if (_baseUrl.isEmpty) {
      throw StateError(
        'GATEWAY_BASE (or API_BASE) must point to the chain gateway.',
      );
    }

    final fromCache = cachedPem?.trim();
    if (fromCache != null && fromCache.isNotEmpty && _isPemKey(fromCache)) {
      return ElectionPublicKey(electionId: electionId, publicKey: fromCache);
    }

    final dedicated = await _tryDedicatedPublicKeyEndpoint(electionId);
    if (dedicated != null) return dedicated;

    return _fetchFromElectionDetail(electionId);
  }

  Future<ElectionPublicKey?> _tryDedicatedPublicKeyEndpoint(
    String electionId,
  ) async {
    final uri = Uri.parse(
      '$_baseUrl/elections/${Uri.encodeComponent(electionId)}/public-key',
    );
    final response =
        await _client.get(uri).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final pem = (decoded['publicKey'] as String?)?.trim();
      if (pem != null && pem.isNotEmpty) {
        return ElectionPublicKey(
          electionId: decoded['electionId'] as String? ?? electionId,
          publicKey: pem,
        );
      }
    }

    if (response.statusCode == 404) {
      return null;
    }

    throw Exception(
      'Election public key API ${response.statusCode}: ${response.body}',
    );
  }

  Future<ElectionPublicKey> _fetchFromElectionDetail(String electionId) async {
    final uri = Uri.parse(
      '$_baseUrl/elections/${Uri.encodeComponent(electionId)}',
    );
    final response =
        await _client.get(uri).timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw Exception(
        'Election detail API ${response.statusCode}: ${response.body}',
      );
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final election = decoded['election'] as Map<String, dynamic>? ?? decoded;
    final pem = (election['electionPublicKey'] as String?)?.trim();
    if (pem == null || pem.isEmpty) {
      throw Exception(
        'Election $electionId has no electionPublicKey on the gateway. '
        'Propose the election again with a current backend.',
      );
    }

    return ElectionPublicKey(
      electionId: election['electionId'] as String? ?? electionId,
      publicKey: pem,
    );
  }

  static bool isPemPublicKey(String key) {
    return key.contains('-----BEGIN') && key.contains('PUBLIC KEY-----');
  }

  static bool _isPemKey(String key) => isPemPublicKey(key);
}
