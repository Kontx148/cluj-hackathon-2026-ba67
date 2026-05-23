# CivicAI mobile app (Flutter)

English UI for the civic feed (EU / Romania / Local). Everything for this app lives under `mobile-app/`.

Feed data is bundled from `data/feed-items.json` — no backend required.

## Layout

| Path | Purpose |
|------|---------|
| `lib/` | Flutter source |
| `data/` | Feed JSON + schemas (bundled into the app; n8n can update the file) |
| `design/` | UI specs and reference |
| `tools/feed-api/` | Optional local API for n8n ingest (not needed for normal runs) |

## One-time setup

```bash
cd mobile-app
flutter create . --project-name civicai --org com.clujhackathon.civicai
flutter pub get
```

| Step | Why |
|------|-----|
| `flutter create .` | Adds `ios/`, `android/`, etc. |
| `flutter pub get` | Resolves dependencies |

After you change `data/feed-items.json`, run a **new release build** (see below) so the app picks up the data.

---

## Run on iOS (physical iPhone, works unplugged)

Do **not** use debug mode for a demo on a real phone. On iOS 14+, debug apps cannot be opened from the home screen after you disconnect the Mac.

### Option 1 — Terminal (recommended)

1. Connect the iPhone (USB), unlock it, tap **Trust** on the phone.
2. List devices and copy your iPhone id (middle column):

```bash
flutter devices
```

Example:

```
My iPhone (mobile) • 00008110-000425E80A8A601E • ios • iOS 26.0.1
```

3. Build and install **release**:

```bash
cd mobile-app
flutter pub get
flutter build ios --release
flutter install --release -d 00008110-000425E80A8A601E
```

If only one device is connected, you can omit `-d`:

```bash
flutter install --release
```

4. Unplug the cable and open **CivicAI** from the home screen.

**Signing:** the first `flutter build ios --release` may open Xcode or fail until signing is set. Open `ios/Runner.xcworkspace` → **Runner** target → **Signing & Capabilities** → select your **Team**, then run the commands again.

**Free Apple ID:** the app may expire after about **7 days**; repeat `flutter install --release` to reinstall.

### Option 2 — Xcode

1. Open `ios/Runner.xcworkspace`.
2. **Runner** → **Signing & Capabilities** → choose your **Team**.
3. Device dropdown → select your iPhone.
4. Confirm **Product → Scheme → Edit Scheme → Run → Build Configuration → Release** (this repo defaults to Release).
5. **Product → Run** (▶), then unplug and use the app from the home screen.

### iOS Simulator (quick check only)

```bash
flutter run -d "iPhone 16"   # use a name from `flutter devices`
```

Simulator is fine for UI checks; use a **release install on a real device** for the unplugged demo.

---

## Run on Android (physical phone or emulator)

### Physical phone (works unplugged) — release APK

1. On the phone: **Settings → Developer options → USB debugging** on.
2. Connect via USB, accept the debugging prompt.
3. Find the device id:

```bash
flutter devices
```

Example:

```
Pixel 7 (mobile) • emulator-5554 • android • Android 14 (API 34)
```

4. Build and install:

```bash
cd mobile-app
flutter pub get
flutter build apk --release
flutter install --release -d <android-device-id>
```

Or install the APK manually:

```bash
# APK path after build:
# build/app/outputs/flutter-apk/app-release.apk
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

5. Disconnect USB and open **CivicAI** from the app drawer.

### Android Emulator

```bash
flutter emulators                  # list emulators
flutter emulators --launch <id>    # start one
flutter run --release              # or: flutter install --release
```

Emulator uses bundled JSON; no laptop API needed.

### Android Studio (alternative)

1. Open the `mobile-app` folder in Android Studio.
2. **Build → Flutter → Build APK** (release), or run with the release configuration.
3. Install `app-release.apk` on the device.

---

## Development (hot reload, Mac/PC must stay connected)

Debug is only for active coding — not for an offline demo.

```bash
flutter run -d <device-id>
```

| Platform | Debug limitation |
|----------|------------------|
| iOS | Do not launch debug builds from the home screen |
| Android | Debug build usually works unplugged, but use **release** for demos |

---

## Optional: remote feed API (n8n)

Only if you run `tools/feed-api` and want live JSON instead of bundled assets:

```bash
cd mobile-app/tools/feed-api && npm install && npm start
```

| Platform | `API_BASE` for local server |
|----------|-----------------------------|
| Android emulator | `http://10.0.2.2:3001` |
| iOS Simulator | `http://localhost:3001` |
| Physical device (same Wi‑Fi as laptop) | `http://<laptop-LAN-IP>:3001` |

```bash
flutter run --release --dart-define=API_BASE=http://10.0.2.2:3001
```

Default (no `API_BASE`): loads `data/feed-items.json` from app assets.

## Data / n8n

- Schema: `data/schemas/feed-item.schema.json`
- Update `data/feed-items.json`, then rebuild release for iOS/Android
- Or `POST` to `tools/feed-api` when using `API_BASE`
