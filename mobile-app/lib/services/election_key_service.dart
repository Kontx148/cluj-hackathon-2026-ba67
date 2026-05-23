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

  Future<ElectionPublicKey> fetchElectionPublicKey(String electionId) async {
    if (_baseUrl.isEmpty) {
      throw StateError('API_BASE must point to a gateway before fetching election keys.');
    }

    final uri = Uri.parse(
      '$_baseUrl/elections/${Uri.encodeComponent(electionId)}/public-key',
    );
    final response = await _client.get(uri).timeout(const Duration(seconds: 15));
    if (response.statusCode != 200) {
      throw Exception('Election public key API ${response.statusCode}: ${response.body}');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return ElectionPublicKey.fromJson(decoded);
  }
}
