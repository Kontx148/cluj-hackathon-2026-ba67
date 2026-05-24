import 'package:flutter/material.dart';

/// Candidate portrait — network photo when [photoUrl] is set, else initials.
class CandidateAvatar extends StatelessWidget {
  const CandidateAvatar({
    super.key,
    required this.name,
    this.photoUrl,
    required this.fallbackColor,
    this.size = 44,
  });

  final String name;
  final String? photoUrl;
  final Color fallbackColor;
  final double size;

  @override
  Widget build(BuildContext context) {
    final url = photoUrl?.trim() ?? '';
    if (url.isNotEmpty) {
      return ClipOval(
        child: Image.network(
          url,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _initialsCircle(),
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return _initialsCircle(showSpinner: true);
          },
        ),
      );
    }
    return _initialsCircle();
  }

  Widget _initialsCircle({bool showSpinner = false}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: fallbackColor, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: showSpinner
          ? SizedBox(
              width: size * 0.4,
              height: size * 0.4,
              child: const CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Text(
              _initials(name),
              style: TextStyle(
                fontSize: size * 0.3,
                fontWeight: FontWeight.w800,
                color: Colors.white,
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
