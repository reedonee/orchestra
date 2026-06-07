# EAS Build Setup for Orchestra

## IMPORTANT: Windows Builds via GitHub Actions

**Current EAS CLI (v20.1.0) does NOT support Windows builds via `--platform` flag.**
The `--platform` only accepts `android|ios|all` - Windows is excluded.

**Use GitHub Actions for Windows builds** (see `.github/workflows/build-windows.yml`).

---

## What Works in EAS

| Platform | EAS Support |
|----------|-------------|
| Android  | Full support |
| iOS      | Full support |
| Web      | Via `npx expo export --platform web` |
| Windows  | Not via CLI flag |

---

## Quick EAS Setup (Android/iOS only)

```bash
# 1. Login
npx eas-cli login

# 2. Project already linked! (c74e6f3e-a884-4bcc-bea8-ca8cbfd3460e)

# 3. Build Android/iOS
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

---

## Windows Build: Use GitHub Actions (Recommended)

### Setup (one-time):

```bash
# 1. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/orchestra.git
git push -u origin main

# 2. Go to GitHub > Settings > Actions > General
#    Enable "Allow all actions and reusable workflows"

# 3. Trigger build:
#    GitHub > Actions > "Build Windows" > Run workflow
```

### What the workflow does:
- Windows runner with VS Build Tools 2022
- Windows SDK 10.1
- Caches node_modules for speed
- Builds Release MSIX package
- Uploads artifact

---

## Local Windows Build (if you want to try)

Requires VS Build Tools 2022 + Windows SDK:
```bash
# Install prerequisites (run in Admin PowerShell)
choco install -y visualstudio2022buildtools windows-sdk-10.1

# Build
npm run windows -- --configuration Release
```

---

## Project Status

- Linked to EAS: @reedonee/orchestra (ID: c74e6f3e-a884-4bcc-bea8-ca8cbfd3460e)
- app.config.js: Windows config ready
- eas.json: Profiles configured
- Git repo: Initialized & committed
- GitHub Actions: Windows workflow ready

---

## Next Steps

1. Push to GitHub - triggers Windows build automatically
2. Wait ~10-15 min - download MSIX from Actions artifacts
3. Install & test on your Windows machine
4. Optional: Submit to Microsoft Store via EAS (when supported)
