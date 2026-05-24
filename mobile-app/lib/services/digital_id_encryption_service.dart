import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:basic_utils/basic_utils.dart';
import 'package:pointycastle/export.dart';

class DigitalIdEncryptionService {
  /// Encrypts the raw digital ID locally on the device with the election
  /// public key. The raw digital ID must never be sent to the gateway.
  String encryptDigitalId({
    required String digitalId,
    required String electionPublicKeyPem,
  }) {
    final publicKey = CryptoUtils.rsaPublicKeyFromPem(electionPublicKeyPem);
    final engine = OAEPEncoding.withSHA256(RSAEngine())
      ..init(
        true,
        ParametersWithRandom<PublicKeyParameter<RSAPublicKey>>(
          PublicKeyParameter<RSAPublicKey>(publicKey),
          _secureRandom(),
        ),
      );

    final plaintext = Uint8List.fromList(utf8.encode(digitalId));
    final encrypted = engine.process(plaintext);
    return base64Encode(encrypted);
  }

  SecureRandom _secureRandom() {
    final random = Random.secure();
    final seed = Uint8List.fromList(
      List<int>.generate(32, (_) => random.nextInt(256)),
    );
    return FortunaRandom()..seed(KeyParameter(seed));
  }
}
