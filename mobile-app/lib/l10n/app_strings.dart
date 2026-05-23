import 'app_locale.dart';

class AppStrings {
  const AppStrings._(this._locale);

  final AppLocale _locale;

  factory AppStrings.of(AppLocale locale) => AppStrings._(locale);

  String get eyebrow => _locale == AppLocale.ro
      ? 'REZUMATE GENERATE DE AI (DEMO)'
      : 'AI-GENERATED SUMMARIES (DEMO)';

  String get title => 'CivicAI';

  String get tagline => _locale == AppLocale.ro
      ? 'Politica UE, românească și locală într-un singur loc — explicată clar.'
      : 'EU, Romanian, and local politics in one place — explained clearly.';

  String get refresh =>
      _locale == AppLocale.ro ? 'Reîmprospătare' : 'Refresh';

  String get allLevels => _locale == AppLocale.ro ? 'Toate' : 'All';

  String get allTags =>
      _locale == AppLocale.ro ? 'Toate topicurile' : 'All topics';

  String get allImportance => _locale == AppLocale.ro
      ? 'Orice importanță'
      : 'Any importance';

  String get levelEu => _locale == AppLocale.ro ? 'UE' : 'EU';

  String get levelRomania =>
      _locale == AppLocale.ro ? 'România' : 'Romania';

  String get levelLocal => _locale == AppLocale.ro ? 'Local' : 'Local';

  String get sectionNews => _locale == AppLocale.ro ? 'Știri' : 'News';

  String get sectionLaws =>
      _locale == AppLocale.ro ? 'Legi și proiecte' : 'Laws & bills';

  String get filterLevel => _locale == AppLocale.ro ? 'Nivel' : 'Level';

  String get filterTopics => _locale == AppLocale.ro ? 'Topic' : 'Topic';

  String get filterImportance =>
      _locale == AppLocale.ro ? 'Importanță' : 'Importance';

  String get filterLanguage => _locale == AppLocale.ro ? 'Limbă' : 'Language';

  String get noResults => _locale == AppLocale.ro
      ? 'Niciun rezultat pentru filtrele curente.'
      : 'No results for the current filters.';

  String get loadError => _locale == AppLocale.ro
      ? 'Nu s-a putut încărca fluxul'
      : 'Could not load feed';

  String get loadErrorHint => _locale == AppLocale.ro
      ? 'Verifică dacă news-items.json și law-items.json sunt listate în pubspec.yaml.'
      : 'Check mobile-app/data/news-items.json and law-items.json are listed in pubspec.yaml assets.';

  String get retry => _locale == AppLocale.ro ? 'Reîncearcă' : 'Retry';

  String get civicAction => _locale == AppLocale.ro
      ? 'Deschis pentru consultare publică'
      : 'Open for public input';

  String get civicActionHint => _locale == AppLocale.ro
      ? 'Consultare, petiție sau vot — cetățenii pot încă răspunde'
      : 'Consultation, petition, or vote — citizens can still respond';

  String get open => _locale == AppLocale.ro ? 'Deschide' : 'Open';

  String get importance =>
      _locale == AppLocale.ro ? 'Importanță' : 'Importance';

  String get footer => 'CivicAI · Hackathon MVP · Cluj 2026';
}
