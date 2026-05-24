import 'app_locale.dart';

class AppStrings {
  const AppStrings._(this._locale);

  final AppLocale _locale;

  factory AppStrings.of(AppLocale locale) => AppStrings._(locale);

  bool get _ro => _locale == AppLocale.ro;

  String get appName => 'Votera';

  // Tabs --------------------------------------------------------------------
  String get tabVote => _ro ? 'Votați' : 'Vote';
  String get tabCivic => _ro ? 'Civic' : 'Civic';

  // Voting tab header -------------------------------------------------------
  String get votingHeadline => _ro ? 'Votați sigur' : 'Vote securely';
  String get votingTagline => _ro
      ? 'Identitatea ta este criptată local și nu este niciodată transmisă în text clar.'
      : 'Your identity is encrypted on this device. It never leaves the phone in plaintext.';

  String get privacyStrip => _ro
      ? 'Criptare RSA-4096 · Token anonim · Blockchain imuabil'
      : 'RSA-4096 encryption · Anonymous token · Immutable blockchain';

  String get electionsLoadError =>
      _ro ? 'Nu s-au putut încărca alegerile' : 'Could not load elections';
  String get electionsEmpty =>
      _ro ? 'Nicio alegere disponibilă deocamdată.' : 'No elections yet.';
  String get electionTapToVote =>
      _ro ? 'Votați acum →' : 'Vote now →';
  String get electionNotOpen =>
      _ro ? 'Nu este deschis pentru vot' : 'Not open for voting';
  String get retry => _ro ? 'Reîncearcă' : 'Retry';

  String get offlineBanner => _ro
      ? 'Fără conexiune — date din cache local'
      : 'No connection — showing cached data';

  // Election statuses -------------------------------------------------------
  String get statusOpen => _ro ? 'DESCHIS' : 'OPEN';
  String get statusProposed => _ro ? 'PROPUS' : 'PROPOSED';
  String get statusApproved => _ro ? 'APROBAT' : 'APPROVED';
  String get statusFrozen => _ro ? 'SUSPENDAT' : 'FROZEN';
  String get statusTallying => _ro ? 'NUMĂRARE' : 'TALLYING';
  String get statusDecrypted => _ro ? 'DECRIPTAT' : 'DECRYPTED';
  String get statusFinished => _ro ? 'ÎNCHEIAT' : 'FINISHED';

  // Vote flow ---------------------------------------------------------------
  String get voteFlowTitle => _ro ? 'Depuneți votul' : 'Cast your vote';
  String get stepIdentity => _ro ? 'Identitate' : 'Identity';
  String get stepCandidate => _ro ? 'Candidat' : 'Candidate';
  String get stepConfirm => _ro ? 'Confirmare' : 'Confirm';
  String get stepReceipt => _ro ? 'Chitanță' : 'Receipt';

  // Identity step -----------------------------------------------------------
  String get identityCalloutTitle =>
      _ro ? 'Confidențialitate garantată' : 'Privacy guaranteed';
  String get identityCalloutBody => _ro
      ? 'Datele sunt procesate exclusiv pe dispozitivul tău. Niciun identificator nu este transmis în formă necriptată.'
      : 'All data is processed on this device. No identifier is ever sent in plaintext.';

  String get identityModeCEI => _ro ? 'Card CEI (NFC)' : 'CEI card (NFC)';
  String get identityModeDemo => _ro ? 'Mod demo' : 'Demo mode';

  String get identityCEITitle =>
      _ro ? 'Apropiați cardul CEI' : 'Hold the CEI card close';
  String get identityCEISubtitle => _ro
      ? 'Activați NFC și țineți cardul în spatele telefonului'
      : 'Enable NFC and place the card on the back of the phone';
  String get identityCEICta =>
      _ro ? 'Citire NFC via EidKit' : 'Read NFC via EidKit';
  String get identityCEIFallback => _ro
      ? 'NFC indisponibil? Folosiți modul demo →'
      : 'No NFC? Use demo mode →';
  String get eidkitStubMessage => _ro
      ? 'Integrarea EidKit reală necesită SDK-ul + NFC. Folosiți modul demo pentru prototip.'
      : 'Real EidKit integration needs the SDK + NFC. Use demo mode for the prototype.';

  String get devModeTitle => _ro ? 'Identitate demo' : 'Demo identity';
  String get devModeSubtitle => _ro
      ? 'Selectați un ID demo pentru a testa fluxul de vot.'
      : 'Pick a demo ID to test the voting flow.';

  String get identitySourceDemo => _ro ? 'demo' : 'demo';
  String get identitySourceCEI => _ro ? 'CEI' : 'CEI';

  // Candidate step ----------------------------------------------------------
  String get candidatePickTitle =>
      _ro ? 'Alegeți candidatul' : 'Pick your candidate';
  String get candidatePickSubtitle => _ro
      ? 'Selectați candidatul preferat. Alegerea va fi criptată înainte de transmitere.'
      : 'Pick your preferred candidate. Your choice will be encrypted before sending.';

  // Confirm step ------------------------------------------------------------
  String get confirmTitle => _ro ? 'Buletin de vot' : 'Ballot';
  String get confirmSubtitle => _ro
      ? 'Acesta este pasul final. Verifică detaliile, apoi trimite.'
      : 'This is the last step. Double-check the details, then send.';
  String get confirmElectionLabel => _ro ? 'Alegere' : 'Election';
  String get confirmIdentityLabel => _ro ? 'Identitate' : 'Identity';
  String get confirmCandidateLabel =>
      _ro ? 'Candidat ales' : 'Chosen candidate';
  String get ceiIdentityDescription => _ro
      ? 'Card electronic CEI (criptat on-device)'
      : 'Electronic CEI card (encrypted on-device)';
  String get confirmPrivacyTitle =>
      _ro ? 'Cum este protejat votul tău' : 'How your vote is protected';
  List<String> get confirmPrivacyBullets => _ro
      ? const [
          'Votul este criptat RSA-4096 înainte de orice transmitere',
          'Token anonim generat local — fără legătură cu identitatea',
          'Hash-ul blocului garantează imuabilitatea înregistrării',
        ]
      : const [
          'Vote encrypted with RSA-4096 before any transmission',
          'Anonymous token generated locally — never linked to identity',
          'Block hash guarantees immutability of the record',
        ];

  String get castVote => _ro ? 'Depuneți votul' : 'Cast vote';
  String get submitting => _ro ? 'Se transmite…' : 'Submitting…';
  String get back => _ro ? 'Înapoi' : 'Back';
  String get continueLabel => _ro ? 'Continuați' : 'Continue';

  // Receipt step ------------------------------------------------------------
  String get receiptHeadline =>
      _ro ? 'Vot înregistrat!' : 'Vote recorded!';
  String get receiptSubtitle => _ro
      ? 'Votul tău a fost înregistrat anonim și irevocabil pe blockchain. Nicio persoană nu poate asocia votul cu identitatea ta.'
      : 'Your vote has been recorded anonymously and irreversibly on the blockchain. No one can link the vote to your identity.';
  String get receiptCardTitle =>
      _ro ? 'Chitanță tranzacție' : 'Transaction receipt';
  String get receiptTxLabel => _ro ? 'Tip' : 'Type';
  String get receiptBlockLabel => _ro ? 'Bloc' : 'Block';
  String get receiptStatusLabel => _ro ? 'Status' : 'Status';
  String get receiptStatusConfirmed => _ro ? 'Confirmat ✓' : 'Confirmed ✓';
  String get receiptHashLabel => _ro ? 'Hash bloc' : 'Block hash';
  String get receiptHashHint => _ro
      ? 'Atingeți pentru a vizualiza blocul'
      : 'Tap to view the block';
  String get receiptDone => _ro ? 'Terminat' : 'Done';

  // Civic feed --------------------------------------------------------------
  String get eyebrow =>
      _ro ? 'REZUMATE GENERATE DE AI' : 'AI-GENERATED SUMMARIES';
  String get civicFeedTitle => _ro ? 'Feed civic' : 'Civic feed';
  String get tagline => _ro
      ? 'Voturi în curs și știri civice, rezumate inteligent pentru tine.'
      : 'Upcoming votes and civic news, intelligently summarized for you.';
  String get refresh => _ro ? 'Reîmprospătare' : 'Refresh';
  String get allLevels => _ro ? 'Toate' : 'All';
  String get allTags => _ro ? 'Toate topicurile' : 'All topics';
  String get allImportance => _ro ? 'Orice importanță' : 'Any importance';
  String get levelEu => _ro ? 'UE' : 'EU';
  String get levelRomania => _ro ? 'România' : 'Romania';
  String get levelLocal => _ro ? 'Local' : 'Local';
  String get sectionNews => _ro ? 'Știri civice' : 'Civic news';
  String get sectionLaws => _ro ? 'Voturi' : 'Votes';
  String get filterLevel => _ro ? 'Nivel' : 'Level';
  String get filterTopics => _ro ? 'Topic' : 'Topic';
  String get filterImportance => _ro ? 'Importanță' : 'Importance';
  String get filterLanguage => _ro ? 'Limbă' : 'Language';
  String get clearFilters =>
      _ro ? 'Ștergeți filtrele' : 'Clear filters';
  String resultsCount(int n) {
    if (_ro) return '$n ${n == 1 ? 'rezultat' : 'rezultate'}';
    return '$n ${n == 1 ? 'result' : 'results'}';
  }

  String get emptyFeedTitle =>
      _ro ? 'Nicio știre găsită' : 'No news found';
  String get emptyFeedSubtitle => _ro
      ? 'Modificați filtrele pentru a vedea conținut'
      : 'Change the filters to see more';
  String get resetFilters => _ro ? 'Resetați filtrele' : 'Reset filters';

  String get noResults => _ro
      ? 'Niciun rezultat pentru filtrele curente.'
      : 'No results for the current filters.';
  String get loadError =>
      _ro ? 'Nu s-a putut încărca fluxul' : 'Could not load feed';
  String get loadErrorHint => _ro
      ? 'Verifică dacă news-items.json și law-items.json sunt listate în pubspec.yaml.'
      : 'Check mobile-app/data/news-items.json and law-items.json are listed in pubspec.yaml assets.';
  String get civicAction => _ro
      ? 'Deschis consultării publice'
      : 'Open for public input';
  String get civicActionHint => _ro
      ? 'Consultare, petiție sau vot — cetățenii pot încă răspunde'
      : 'Consultation, petition, or vote — citizens can still respond';
  String get open => _ro ? 'Citiți' : 'Read';
  String get importance => _ro ? 'Importanță' : 'Importance';
  String get footer => 'Votera · Hackathon MVP · Cluj 2026';
  String get footerSlogan => _ro
      ? 'O persoană, un vot — transparent.'
      : 'One person, one vote — transparently.';
}
