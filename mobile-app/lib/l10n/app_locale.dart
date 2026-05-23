enum AppLocale {
  en('en', 'English'),
  ro('ro', 'Română');

  const AppLocale(this.code, this.label);

  final String code;
  final String label;

  static AppLocale fromCode(String code) {
    return switch (code) {
      'ro' => AppLocale.ro,
      _ => AppLocale.en,
    };
  }
}
