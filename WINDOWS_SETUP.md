# Windows Setup Guide for Orchestra

## Summary
To build and run the Windows app, your machine needs:
1. **Visual Studio 2022** (Community or Enterprise) with specific workloads
2. **.NET SDK 8.0**
3. **Windows Developer Mode** enabled
4. **Long Paths** enabled in Windows

These are system-level requirements that take 30–60+ minutes to install (mostly waiting for VS installation).

---

## Why It Takes Time
- **Visual Studio 2022**: ~500 MB – 2 GB download + installation (20–40 minutes)
- **.NET SDK 8.0**: ~500 MB download + installation (5–10 minutes)
- **Windows configuration**: <5 minutes

**Total estimated time: 30–60 minutes** on first setup.

---

## Option A: Auto-Install (Recommended) — Run This as Administrator

**Step 1:** Open **PowerShell as Administrator**

1. Right-click PowerShell or search for "PowerShell"
2. Select "Run as Administrator"

**Step 2:** Copy and paste this entire script into the admin PowerShell:

```powershell
# Enable Developer Mode
Write-Host "Enabling Developer Mode..." -ForegroundColor Cyan
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense /t REG_DWORD /d 1 /f

# Enable Long Paths
Write-Host "Enabling Long Paths support..." -ForegroundColor Cyan
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f

# Install .NET SDK 8.0
Write-Host "Installing .NET SDK 8.0..." -ForegroundColor Cyan
winget install Microsoft.DotNet.SDK.8 -e -s winget

# Install Visual Studio 2022 Community (this may pop installer UI)
Write-Host "Installing Visual Studio 2022 Community..." -ForegroundColor Cyan
Write-Host "(The Visual Studio installer will appear. Select the workloads mentioned below.)" -ForegroundColor Yellow
winget install --id Microsoft.VisualStudio.2022.Community -e

# Run RNW dependency auto-installer to add required components
Write-Host "Configuring Visual Studio components..." -ForegroundColor Cyan
PowerShell -ExecutionPolicy Bypass -File "$PSScriptRoot\node_modules\react-native-windows\scripts\rnw-dependencies.ps1" -Install

Write-Host "Setup complete! You can now run: npm run windows" -ForegroundColor Green
```

**Step 3:** Press Enter and wait. This will:
- Enable Developer Mode
- Enable Long Paths
- Install .NET SDK 8.0 (2–10 min)
- Install Visual Studio 2022 Community (20–40 min; may pop UI)
- Configure Visual Studio with required workloads

---

## Option B: Manual Install

If the script above doesn't work or you prefer manual steps:

### 1. Enable Developer Mode
- Windows Settings → For developers → Toggle "Developer Mode" ON

### 2. Enable Long Paths
- Open **Registry Editor** (`regedit`)
- Navigate to: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem`
- Set `LongPathsEnabled` to `1` (create if not present)

### 3. Install .NET SDK 8.0
```powershell
winget install Microsoft.DotNet.SDK.8 -e -s winget
```

### 4. Install Visual Studio 2022 Community
```powershell
winget install --id Microsoft.VisualStudio.2022.Community -e
```

During installation, select these workloads:
- **Desktop development with C++**
- **Universal Windows Platform development**
- **Node.js development** (optional)

After VS installs, select these additional components:
- **MSVC v143 or later** (C++ compiler)
- **Windows 11 SDK** (or Windows 10 SDK 19041)
- **UWP tools** (Windows App SDK support)

### 5. Verify Installation
```powershell
# From your Orchestra project root, run:
.\node_modules\react-native-windows\scripts\rnw-dependencies.ps1 -ListChecks -NoPrompt
```

All items should now show as installed (green check).

---

## Now Run the Windows Build

Once all prerequisites are installed, return to your project and run:

```bash
npm run windows
```

**Expected:** 
- Metro bundler starts (5–10 seconds)
- App builds with MSBuild (5–20 minutes on first build, ~30 seconds after)
- Windows app window opens
- TaskExecutor demo renders

**Total build time: 5–20 minutes (first run); 30 seconds (subsequent runs)**

---

## Troubleshooting

### "Couldn't determine Windows app config"
- Cause: `windows/` folder or solution file missing
- Fix: Already created by us; if error persists, run:
```bash
npx react-native-windows-init@0.83.0 --overwrite
npm run windows
```

### "MSBuild not found"
- Cause: Visual Studio not installed or not in PATH
- Fix: Install Visual Studio 2022 Community (Option A, Step 2) and select "Desktop development with C++"

### ".NET SDK not found"
- Cause: .NET 8.0 not installed
- Fix:
```powershell
winget install Microsoft.DotNet.SDK.8 -e -s winget
```

### "Long Paths error"
- Cause: Long path support not enabled
- Fix: Run as Administrator:
```powershell
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
```

### Build hangs or is very slow
- Likely: First build; MSBuild is compiling the app
- Expected time: 10–20 minutes
- Fix: Be patient. Subsequent builds are ~30 seconds.
- Alternative: Switch to web/Android in the meantime (see `TESTING_ALTERNATIVES.md`)

---

## Faster Alternatives (While Waiting for Windows Setup)

Don't want to install VS now? Test the app on Android or web instead:

### Test on Web (Fastest)
```bash
npm run web
```
Opens in http://localhost:19006 (Expo web)

### Test on Android (If emulator/device available)
```bash
npm run android
```

---

## After Setup is Complete

You can now use:
```bash
npm run windows              # Run Windows app
npm start                    # Start Metro bundler
npm run android              # Run Android
npm run web                  # Run web
npm test                     # Run tests
```

---

## Additional Resources

- [React Native Windows Docs](https://microsoft.github.io/react-native-windows/docs/getting-started)
- [Visual Studio Installation](https://visualstudio.microsoft.com/downloads/)
- [.NET SDK Downloads](https://dotnet.microsoft.com/en-us/download/dotnet)

---

**Still stuck?** Check the full RNW dependency output:
```powershell
.\node_modules\react-native-windows\scripts\rnw-dependencies.ps1 -Verbose -ListChecks -NoPrompt
```
