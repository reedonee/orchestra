# Testing Alternatives — Skip Windows for Now

If you don't want to install Visual Studio + .NET SDKs right now, you can test the Orchestra app on **web** or **Android** immediately.

---

## Option 1: Test on Web (Fastest — ~30 seconds)

No additional installation needed beyond what's already set up.

```bash
npm run web
```

**What happens:**
1. Expo development server starts (5–10 seconds)
2. Browser opens to http://localhost:19006
3. App renders with hot reload enabled
4. You can test all features

**To stop:** Press Ctrl+C in terminal

**Note:** Some React Native features (camera, gestures) may not work identically to mobile, but UI logic, state management, and API calls all work fine.

---

## Option 2: Test on Android Emulator

Requires Android Studio + emulator setup (one-time, ~30 minutes).

### Prerequisites
1. **Install Android Studio** from https://developer.android.com/studio
2. **Create a virtual device** (emulator)
3. **Start the emulator** before running the app

### First Time Setup (Android Studio)
```bash
# Install Android Studio, then:
# 1. Open Android Studio
# 2. Tools → Device Manager → Create Virtual Device
# 3. Select a device (e.g., Pixel 5) and download the image
# 4. Click play to start emulator
```

### Run App on Android
```bash
npm run android
```

**What happens:**
1. Metro bundler starts
2. App builds and deploys to emulator (2–5 minutes first time)
3. App launches in emulator
4. Full touch/UI testing works

---

## Option 3: Test on Physical Android Phone

If you have an Android phone:

### Prerequisites
1. Enable Developer Mode on phone (Settings → About → tap Build Number 7 times)
2. Enable USB Debugging (Settings → Developer Options → USB Debugging)
3. Connect phone via USB

### Run App on Phone
```bash
npm run android
```

**Expected:** App installs and runs on your phone (3–10 minutes first time)

---

## Which to Choose?

| Option | Speed | Setup | Best For |
|--------|-------|-------|----------|
| **Web** | ~30 sec | None | Quick testing, UI verification |
| **Android Emulator** | 2–5 min | Android Studio (30 min one-time) | Full mobile testing |
| **Android Phone** | 2–5 min | Enable USB Debugging | Real device testing |
| **Windows** | 5–20 min | VS 2022 + .NET (60 min one-time) | Windows-native app |

---

## Quick Web Test Now

```bash
npm run web
```

Then:
1. Click "📦 Load Sample" in the app
2. Paste your Gemini API key
3. Click "▶️ Execute"
4. Watch real-time task execution

All features work on web, so you can fully test Orchestra without installing heavy Windows toolchain.

---

## After You're Ready for Windows

When you want to set up Windows builds, run:

```bash
.\WINDOWS_SETUP.md    # Follow the guide
# OR manually:
npm run windows
```

---

**Pro Tip:** Develop and test on web/Android, then once ready, set up Windows for final builds. This saves setup time upfront.
