# CivicAI — Cluj Hackathon 2026

Decentralized civic engagement platform (vision): digital-ID-based anonymous voting, law explainability, and AI-assisted political news — starting with an English MVP **feed** (EU / Romania / Local).

## Repo layout

| Path | Description |
|------|-------------|
| `mobile-app/` | Flutter app, [`data/`](mobile-app/data/) (feed JSON), [`design/`](mobile-app/design/) specs, [`n8n/`](mobile-app/n8n/) + [`feed-api`](mobile-app/tools/feed-api/) for ingest |
| `mobile-app.zip` | Original design bundle archive (optional) |

The mobile app is self-contained (no separate `services/` folder).

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- **iOS:** Mac with Xcode, Apple ID for signing
- **Android:** Android Studio or SDK + USB debugging on the device

One-time in the app folder:

```bash
cd mobile-app
flutter create . --project-name civicai --org com.clujhackathon.civicai
flutter pub get
```

## Run on iOS (iPhone, works after unplugging)

Use a **release** build (not debug). Full steps: [mobile-app/README.md — Run on iOS](mobile-app/README.md#run-on-ios-physical-iphone-works-unplugged)

```bash
cd mobile-app
flutter devices                                    # copy your iPhone id
flutter build ios --release
flutter install --release -d <your-iphone-id>      # omit -d if only one device
```

Unplug and open **CivicAI** from the home screen. Set signing in `ios/Runner.xcworkspace` if the build fails.

## Run on Android (phone or emulator)

Full steps: [mobile-app/README.md — Run on Android](mobile-app/README.md#run-on-android-physical-phone-or-emulator)

```bash
cd mobile-app
flutter devices
flutter build apk --release
flutter install --release -d <android-device-id>
```

Unplug (physical phone) and open the app from the launcher.

## Design reference

Inside `mobile-app/design/`: `DESIGN.md`, `FLUTTER_SPEC.md`
