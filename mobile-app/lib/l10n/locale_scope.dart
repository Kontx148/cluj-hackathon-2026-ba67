import 'package:flutter/widgets.dart';

import 'app_locale.dart';
import 'app_strings.dart';

class LocaleScope extends InheritedWidget {
  const LocaleScope({
    super.key,
    required this.locale,
    required this.onLocaleChanged,
    required super.child,
  });

  final AppLocale locale;
  final ValueChanged<AppLocale> onLocaleChanged;

  static LocaleScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<LocaleScope>();
    assert(scope != null, 'LocaleScope not found in widget tree');
    return scope!;
  }

  AppStrings get strings => AppStrings.of(locale);

  @override
  bool updateShouldNotify(LocaleScope oldWidget) =>
      oldWidget.locale != locale;
}

extension LocaleBuildContext on BuildContext {
  AppLocale get appLocale => LocaleScope.of(this).locale;

  AppStrings get strings => LocaleScope.of(this).strings;
}
