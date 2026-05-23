import 'app_locale.dart';

class AppStrings {
  const AppStrings._(this._locale);

  final AppLocale _locale;

  factory AppStrings.of(AppLocale locale) => AppStrings._(locale);

  bool get _ro => _locale == AppLocale.ro;

  String get appName => 'Votera';

  // Tabs --------------------------------------------------------------------
  String get tabVote => _ro ? 'Vot' : 'Vote';
  String get tabCivic => _ro ? 'Civic' : 'Civic';

  // Voting tab header -------------------------------------------------------
  String get votingHeadline =>
      _ro ? 'Votează în siguranță' : 'Vote securely';
  String get votingTagline => _ro
      ? 'Identitatea ta este criptată pe telefon. Nu părăsește dispozitivul niciodată în clar.'
      : 'Your identity is encrypted on this device. It never leaves the phone in plaintext.';
  String get electionsLoadError =>
      _ro ? 'Nu s-au putut încărca alegerile' : 'Could not load elections';
  String get electionsEmpty =>
      _ro ? 'Nicio alegere disponibilă deocamdată.' : 'No elections yet.';
  String get electionTapToVote =>
      _ro ? 'Apasă pentru a vota' : 'Tap to vote';
  String get electionNotOpen =>
      _ro ? 'Nu este deschis pentru vot' : 'Not open for voting';
  String get retry => _ro ? 'Reîncearcă' : 'Retry';

  String get offlineBanner => _ro
      ? 'Backend inaccesibil — se afișează date demo. Apasă ↺ pentru a reîncerca.'
      : 'Backend unreachable — showing demo data. Tap ↺ to retry.';

  // Election statuses -------------------------------------------------------
  String get statusOpen => _ro ? 'DESCHIS' : 'OPEN';
  String get statusProposed => _ro ? 'PROPUS' : 'PROPOSED';
  String get statusApproved => _ro ? 'APROBAT' : 'APPROVED';
  String get statusFrozen => _ro ? 'ÎNGHEȚAT' : 'FROZEN';
  String get statusTallying => _ro ? 'NUMĂRARE' : 'TALLYING';
  String get statusDecrypted => _ro ? 'DECRIPTAT' : 'DECRYPTED';
  String get statusFinished => _ro ? 'FINALIZAT' : 'FINISHED';

  // Vote flow ---------------------------------------------------------------
  String get voteFlowTitle => _ro ? 'Votează' : 'Cast your vote';
  String get stepIdentity => _ro ? 'Identitate' : 'Identity';
  String get stepCandidate => _ro ? 'Candidat' : 'Candidate';
  String get stepConfirm => _ro ? 'Confirmă' : 'Confirm';
  String get stepReceipt => _ro ? 'Chitanță' : 'Receipt';

  // Identity step -----------------------------------------------------------
  String get identityCalloutTitle =>
      _ro ? 'Identitatea ta rămâne privată' : 'Your identity stays private';
  String get identityCalloutBody => _ro
      ? 'Telefonul criptează ID-ul tău digital cu cheia publică a alegerilor. '
          'Doar validatorii pot verifica eligibilitatea — gateway-ul nu îți vede ID-ul.'
      : 'Your phone encrypts your digital ID with this election\'s public key. '
          'Only validators can check eligibility — the gateway never sees your ID.';

  String get identityCEITitle =>
      _ro ? 'Cartea de Identitate Electronică' : 'Electronic ID Card (CEI)';
  String get identityCEISubtitle => _ro
      ? 'Citește cardul prin EidKit (NFC) și autentifică-te cu MAI.'
      : 'Read your card with EidKit (NFC) and authenticate via MAI.';
  String get identityCEICta => _ro ? 'Continuă cu CEI' : 'Continue with CEI';
  String get eidkitStubMessage => _ro
      ? 'Integrarea EidKit reală necesită SDK-ul + NFC. Folosește modul demo mai jos pentru prototip.'
      : 'Real EidKit integration needs the SDK + NFC. Use developer mode below for the demo.';

  String get devModeTitle => _ro ? 'Mod dezvoltator' : 'Developer mode';
  String get devModeSubtitle => _ro
      ? 'Selectează un ID demo pentru a testa fluxul de vot.'
      : 'Pick a demo ID to test the voting flow.';
  String get devModePickIdentity =>
      (_ro ? 'ALEGE O IDENTITATE DEMO' : 'PICK A DEMO IDENTITY');

  String get identitySourceDemo => _ro ? 'demo' : 'demo';
  String get identitySourceCEI => _ro ? 'CEI' : 'CEI';

  // Candidate step ----------------------------------------------------------
  String get candidatePickTitle =>
      _ro ? 'Alege candidatul tău' : 'Pick your candidate';
  String get candidatePickSubtitle => _ro
      ? 'Vei putea revizui alegerea înainte de trimitere.'
      : 'You can review your choice before sending.';

  // Confirm step ------------------------------------------------------------
  String get confirmTitle => _ro ? 'Verifică votul' : 'Review your ballot';
  String get confirmSubtitle => _ro
      ? 'Acesta este pasul final. Verifică detaliile, apoi trimite.'
      : 'This is the last step. Double-check the details, then send.';
  String get confirmElectionLabel => _ro ? 'Alegeri' : 'Election';
  String get confirmIdentityLabel => _ro ? 'Identitate' : 'Identity';
  String get confirmCandidateLabel => _ro ? 'Candidat' : 'Candidate';
  String get confirmPrivacyTitle => _ro ? 'Cum este protejat votul tău' : 'How your vote is protected';
  String get confirmPrivacyBody => _ro
      ? 'ID-ul tău digital este criptat RSA-OAEP local pe telefon. '
          'Doar validatorii pot verifica că ești pe lista electorală — '
          'gateway-ul vede doar token anonim + buletin criptat.'
      : 'Your digital ID is encrypted with RSA-OAEP on this phone. '
          'Only validators can check that you\'re on the electoral roll — '
          'the gateway only sees an anonymous token and an encrypted ballot.';
  String get castVote => _ro ? 'Trimite votul' : 'Cast vote';
  String get submitting => _ro ? 'Se trimite…' : 'Submitting…';
  String get back => _ro ? 'Înapoi' : 'Back';
  String get continueLabel => _ro ? 'Continuă' : 'Continue';

  // Receipt step ------------------------------------------------------------
  String get receiptHeadline =>
      _ro ? 'Vot înregistrat' : 'Vote recorded';
  String receiptBody(String election, String candidate) => _ro
      ? 'Votul pentru "$candidate" la "$election" este pe blockchain.'
      : 'Your vote for "$candidate" in "$election" is on the chain.';
  String get receiptTxLabel => _ro ? 'Tip tranzacție' : 'Transaction type';
  String get receiptBlockLabel => _ro ? 'Bloc' : 'Block';
  String get receiptHashLabel => _ro ? 'Hash bloc' : 'Block hash';
  String get receiptDone => _ro ? 'Gata' : 'Done';

  // Civic feed (kept) --------------------------------------------------------
  String get eyebrow =>
      _ro ? 'REZUMATE GENERATE DE AI' : 'AI-GENERATED SUMMARIES';
  String get tagline => _ro
      ? 'Voturi viitoare, știri naționale și locale care îți afectează viața de zi cu zi.'
      : 'Upcoming votes and national & local news that affect everyday life.';
  String get refresh => _ro ? 'Reîmprospătare' : 'Refresh';
  String get allLevels => _ro ? 'Toate' : 'All';
  String get allTags => _ro ? 'Toate topicurile' : 'All topics';
  String get allImportance => _ro ? 'Orice importanță' : 'Any importance';
  String get levelEu => _ro ? 'UE' : 'EU';
  String get levelRomania => _ro ? 'România' : 'Romania';
  String get levelLocal => _ro ? 'Local' : 'Local';
  String get sectionNews => _ro ? 'Știri civice' : 'Civic news';
  String get sectionLaws => _ro ? 'Voturi viitoare' : 'Upcoming votes';
  String get filterLevel => _ro ? 'Nivel' : 'Level';
  String get filterTopics => _ro ? 'Topic' : 'Topic';
  String get filterImportance => _ro ? 'Importanță' : 'Importance';
  String get filterLanguage => _ro ? 'Limbă' : 'Language';
  String get noResults => _ro
      ? 'Niciun rezultat pentru filtrele curente.'
      : 'No results for the current filters.';
  String get loadError =>
      _ro ? 'Nu s-a putut încărca fluxul' : 'Could not load feed';
  String get loadErrorHint => _ro
      ? 'Verifică dacă news-items.json și law-items.json sunt listate în pubspec.yaml.'
      : 'Check mobile-app/data/news-items.json and law-items.json are listed in pubspec.yaml assets.';
  String get civicAction => _ro
      ? 'Deschis pentru consultare publică'
      : 'Open for public input';
  String get civicActionHint => _ro
      ? 'Consultare, petiție sau vot — cetățenii pot încă răspunde'
      : 'Consultation, petition, or vote — citizens can still respond';
  String get open => _ro ? 'Deschide' : 'Open';
  String get importance => _ro ? 'Importanță' : 'Importance';
  String get footer => 'Votera · Hackathon MVP · Cluj 2026';
}
