import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Tokens from `Votera Civic App Design/src/styles/theme.css`.
///
/// Layout: white [card] surfaces on a white canvas; [muted] chip fills;
/// [primary] red only for buttons, links, and small accents — never page tint.
class CivicPalette {
  static const Color primary = Color(0xFFD64545);
  static const Color onPrimary = Color(0xFFFFFFFF);

  /// Figma `--card` / phone content area.
  static const Color card = Color(0xFFFFFFFF);

  /// Figma `--muted` — chip / pill backgrounds (not red).
  static const Color muted = Color(0xFFF5EDE9);

  /// Figma `--foreground`.
  static const Color ink = Color(0xFF1F1316);

  /// Figma `--muted-foreground`.
  static const Color mutedFg = Color(0xFF7A6B6E);

  /// Figma `--border` ≈ rgba(31,19,22,0.1).
  static const Color border = Color(0x191F1316);

  /// Solid status pill fills — saturated (Figma OPEN uses #D64545 + white).
  static const Color statusProposedSolid = Color(0xFFB45309);
  static const Color statusApprovedSolid = Color(0xFF047857);
  static const Color statusFrozenSolid = Color(0xFF0369A1);
  static const Color statusTallyingSolid = Color(0xFFC2410C);
  static const Color statusDecryptedSolid = Color(0xFF059669);
  static const Color statusFinishedSolid = Color(0xFF475569);

  static const Color statusAmberBg = Color(0xFFFEF3C7);
  static const Color statusAmberFg = Color(0xFF92400E);
  static const Color statusEmeraldBg = Color(0xFFD1FAE5);
  static const Color statusEmeraldFg = Color(0xFF065F46);
  static const Color statusEmeraldStrong = Color(0xFF059669);
  static const Color statusSkyBg = Color(0xFFE0F2FE);
  static const Color statusSkyFg = Color(0xFF075985);
  static const Color statusGrayBg = Color(0xFFF3F4F6);
  static const Color statusGrayFg = Color(0xFF6B7280);

  static const Color amberBannerBg = Color(0xFFFFFBEB);
  static const Color amberBannerFg = Color(0xFFB45309);
  static const Color amberBannerBorder = Color(0xFFFDE68A);
}

/// Light theme only — matches the Figma export (no Material red seed tint).
ThemeData buildCivicTheme() {
  const scheme = ColorScheme(
    brightness: Brightness.light,
    primary: CivicPalette.primary,
    onPrimary: CivicPalette.onPrimary,
    secondary: CivicPalette.muted,
    onSecondary: CivicPalette.ink,
    tertiary: CivicPalette.mutedFg,
    onTertiary: CivicPalette.ink,
    error: Color(0xFFB91C1C),
    onError: Colors.white,
    surface: CivicPalette.card,
    onSurface: CivicPalette.ink,
    surfaceContainerHighest: CivicPalette.muted,
    surfaceContainerHigh: CivicPalette.muted,
    surfaceContainer: CivicPalette.card,
    surfaceContainerLow: CivicPalette.card,
    surfaceContainerLowest: CivicPalette.card,
    onSurfaceVariant: CivicPalette.mutedFg,
    outline: CivicPalette.border,
    outlineVariant: CivicPalette.border,
    shadow: Colors.black,
    scrim: Colors.black54,
    inverseSurface: CivicPalette.ink,
    onInverseSurface: CivicPalette.card,
    inversePrimary: CivicPalette.primary,
    surfaceTint: Colors.transparent,
  );

  final baseText = _baseTextTheme();
  final textTheme = GoogleFonts.plusJakartaSansTextTheme(baseText);

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: CivicPalette.card,
    canvasColor: CivicPalette.card,
    cardColor: CivicPalette.card,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
    colorScheme: scheme,
    splashColor: CivicPalette.primary.withValues(alpha: 0.08),
    highlightColor: CivicPalette.primary.withValues(alpha: 0.06),
    textTheme: textTheme,
    appBarTheme: const AppBarTheme(
      backgroundColor: CivicPalette.card,
      foregroundColor: CivicPalette.ink,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: CivicPalette.card,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: CivicPalette.border),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: CivicPalette.primary,
        foregroundColor: CivicPalette.onPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        minimumSize: const Size(0, 50),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: CivicPalette.primary,
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: CivicPalette.primary,
        side: const BorderSide(color: CivicPalette.primary),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        minimumSize: const Size(0, 50),
      ),
    ),
    chipTheme: const ChipThemeData(
      backgroundColor: CivicPalette.muted,
      selectedColor: CivicPalette.card,
      disabledColor: CivicPalette.muted,
      labelStyle: TextStyle(
        color: CivicPalette.mutedFg,
        fontWeight: FontWeight.w700,
        fontSize: 13,
      ),
      secondaryLabelStyle: TextStyle(
        color: CivicPalette.primary,
        fontWeight: FontWeight.w700,
        fontSize: 13,
      ),
      side: BorderSide(color: CivicPalette.border),
      shape: StadiumBorder(),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: CivicPalette.card,
      indicatorColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: CivicPalette.ink,
      contentTextStyle: const TextStyle(color: CivicPalette.card, fontSize: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: CivicPalette.muted,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: CivicPalette.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: CivicPalette.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: CivicPalette.primary, width: 1.5),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: CivicPalette.border,
      thickness: 1,
      space: 1,
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: CivicPalette.primary,
    ),
    dropdownMenuTheme: DropdownMenuThemeData(
      textStyle: GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: CivicPalette.ink,
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: CivicPalette.card,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    ),
  );
}

TextTheme _baseTextTheme() {
  const ink = CivicPalette.ink;
  const muted = CivicPalette.mutedFg;
  return TextTheme(
    displaySmall: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.6,
      color: ink,
    ),
    headlineMedium: TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.4,
      color: ink,
      height: 1.15,
    ),
    headlineSmall: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w800,
      color: ink,
    ),
    titleLarge: TextStyle(
      fontSize: 17,
      fontWeight: FontWeight.w700,
      color: ink,
      height: 1.3,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w700,
      color: ink,
    ),
    titleSmall: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w700,
      color: ink,
    ),
    bodyLarge: TextStyle(fontSize: 15, color: ink, height: 1.45),
    bodyMedium: TextStyle(fontSize: 14, color: muted, height: 1.5),
    bodySmall: TextStyle(fontSize: 13, color: muted, height: 1.4),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w700,
      color: ink,
    ),
    labelMedium: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: muted,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w800,
      letterSpacing: 1.2,
      color: muted,
    ),
  );
}

/// Figma-style filter / toggle chip — muted when off, white + red ring when on.
class CivicFilterChip extends StatelessWidget {
  const CivicFilterChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.circular = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool circular;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? CivicPalette.card : CivicPalette.muted,
      shape: circular
          ? const CircleBorder()
          : RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(999),
              side: BorderSide(
                color: selected ? CivicPalette.primary : CivicPalette.border,
                width: selected ? 1.5 : 1,
              ),
            ),
      child: InkWell(
        onTap: onTap,
        customBorder: circular
            ? const CircleBorder()
            : RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: circular ? 0 : 12,
            vertical: circular ? 0 : 7,
          ),
          child: circular
              ? SizedBox(
                  width: 32,
                  height: 32,
                  child: Center(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: selected
                            ? CivicPalette.primary
                            : CivicPalette.mutedFg,
                      ),
                    ),
                  ),
                )
              : Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color:
                        selected ? CivicPalette.primary : CivicPalette.mutedFg,
                  ),
                ),
        ),
      ),
    );
  }
}
