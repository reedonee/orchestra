# EAS Build Setup for Orchestra

## One-time Setup (Run These Commands)

```bash
# 1. Login to Expo (creates account if needed)
npx eas-cli login

# 2. Initialize EAS project (creates eas.json + links project)
npx eas-cli project:init

# 3. Build for Windows (specify platform via flag, not in config)
npx eas-cli build --platform windows --profile production
```

## What's Configured

- ✅ `eas.json` - Build profiles (development, preview, production)
- ✅ `app.config.js` - Complete Windows config (package name, versions, etc.)
- ✅ `package.json` - All dependencies ready

## How Windows Build Works

You specify platform **at build time** via `--platform windows`, not in eas.json. The `app.config.js` already has the Windows config that EAS reads.

## Build Output

After build completes (~10-15 min):
- MSIX package in EAS dashboard → download
- Or auto-upload to Microsoft Store (configure `storeId` in eas.json submit section)

## Free Tier Limits

- 30 builds/month (includes Windows)
- 2 GB artifact storage
- 1 concurrent build

## Need Icons?

Replace placeholder files in `assets/` with real icons:
- `icon.png` (1024×1024)
- `splash.png` (2732×2732)  
- `adaptive-icon.png` (1024×1024)
- `favicon.png` (48×48)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build hangs | Check EAS dashboard logs |
| Windows SDK missing | EAS provides it automatically |
| Metro bundler error | `npx expo install --fix` |
| Version conflicts | Clear caches: `npx expo install --fix && rm -rf .expo` |

## After First Build

1. Download `.msix` from EAS dashboard
2. Double-click to install locally
3. Or submit to Store: `npx eas-cli submit --platform windows`

Done! 🚀
