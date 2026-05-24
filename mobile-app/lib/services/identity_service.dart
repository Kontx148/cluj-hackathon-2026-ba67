import 'package:url_launcher/url_launcher.dart';

/// A "verified" digital identity ready to vote with.
class VerifiedIdentity {
  const VerifiedIdentity({
    required this.digitalId,
    required this.displayName,
    required this.source,
  });

  final String digitalId;
  final String displayName;
  final IdentitySource source;
}

enum IdentitySource { eidkit, demo }

/// Glue around the eIDKit (https://eidkit.ro) flow.
///
/// Real production usage would call into the EidKit Flutter SDK to read the
/// Romanian Electronic Identity Card over NFC and return a verified digital
/// ID + signed challenge. That SDK requires a signed app, NFC permissions,
/// and physical hardware — out of scope for this hackathon prototype.
///
/// Until the real SDK is wired in, this method opens the eidkit.ro landing
/// page in the user's browser as a clear placeholder, and signals to the UI
/// that no identity was captured.
class IdentityService {
  static const String eidkitUrl = 'https://eidkit.ro/';

  /// Returns `null` when the placeholder flow finishes (no real ID captured).
  Future<VerifiedIdentity?> startEidkitFlow() async {
    final uri = Uri.parse(eidkitUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    // TODO(eidkit): replace with EidKit SDK call once integrated.
    return null;
  }
}
