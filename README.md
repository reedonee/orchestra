# Orchestra 🎼

AI-powered task orchestration app with infinite canvas — built with React Native, Expo, and Skia. Runs on Windows, Web, iOS, and Android.

## ✨ Features

### 🎨 Infinite Canvas
- **Pan/zoom** with smooth gestures (Skia-powered)
- **Nodes** with drag, drop, connect, and edit
- **Real-time collaboration** ready architecture
- **Export/import** canvas state as JSON

### 🤖 AI Orchestration
- **Gemini integration** — task decomposition, planning, execution
- **BYOK (Bring Your Own Key)** — secure API key storage via react-native-secure-store
- **Audio input** — voice commands with react-native-audio-recorder-player
- **Task executor** — runs multi-step plans with progress tracking

### 🛠 Technical Stack
| Layer | Tech |
|-------|------|
| Framework | React Native 0.74 + Expo 51 |
| Canvas | @shopify/react-native-skia |
| State | Zustand + Immer |
| AI | @google/generative-ai (Gemini) |
| Storage | AsyncStorage + SecureStore |
| Build | EAS / GitHub Actions (Windows MSIX) |

## 🚀 Quick Start

```bash
# Clone & install
git clone <repo>
cd Orchestra
npm install

# Start dev (web)
npm run web

# Start dev (Windows)
npm run dev:windows

# Build Windows MSIX (local)
npm run windows

# Build web
npm run build:web
```

## 📱 Platform Support

| Platform | Status | Build |
|----------|--------|-------|
| Windows 10/11 | ✅ Primary | MSIX via GitHub Actions |
| Web | ✅ Full | Expo export → dist-web |
| Android | ✅ Ready | EAS / `npm run android` |
| iOS | ✅ Ready | EAS / `npm run ios` |

## 🔐 BYOK Security

API keys never leave your device:
- Stored in **encrypted SecureStore** (Keychain/Keystore)
- Never synced, never logged
- Per-session in-memory only during execution

## 🏗 Project Structure

```
Orchestra/
├── src/
│   ├── components/       # UI + Canvas (Skia)
│   ├── hooks/            # useOrchestrator, useTaskExecutor, etc.
│   ├── services/         # geminiService, orchestratorService, audioRecorder
│   ├── store/            # canvasStore (Zustand), byokStore (secure)
│   ├── screens/          # Demo screens
│   ├── theme/            # Design tokens, animations
│   ├── types/            # TypeScript types
│   └── utils/            # Export, persistence, platform, secureStorage
├── windows/              # react-native-windows (C++, WinUI 3)
├── .github/workflows/    # CI: build-windows.yml (MSIX signing)
├── app.config.js         # Expo config
└── eas.json              # EAS Build config
```

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `src/services/orchestratorService.ts` | Gemini task planning + decomposition |
| `src/services/taskExecutor.ts` | Step-by-step plan execution |
| `src/store/canvasStore.ts` | Infinite canvas state (nodes, edges, viewport) |
| `src/store/byokStore.ts` | Secure API key management |
| `src/hooks/useOrchestrator.ts` | React hook for AI orchestration |
| `src/components/InfiniteCanvas.tsx` | Main Skia canvas component |

## 🔧 Windows Build (GitHub Actions)

MSIX packages are built and signed on every push:

```yaml
# .github/workflows/build-windows.yml
# - installs VS 2022 Build Tools + Windows SDK
# - runs rnw-dependencies.ps1 for RNW setup
# - MSBuild → AppPackages/
# - creates self-signed cert → signs with signtool (dynamic path)
# - uploads .msix + .msixbundle + installer.cer as artifact
```

**Artifact:** `orchestra-windows-Release` (30-day retention)

## 🧪 Testing

```bash
npm run test       # Jest
npm run lint       # ESLint + TypeScript
```

## 📚 Docs

- `WINDOWS_SETUP.md` — Local Windows dev environment
- `EAS_SETUP.md` — EAS Build configuration
- `BUILD_GUIDE.md` — Build troubleshooting
- `INFINITE_CANVAS_SUMMARY.md` — Canvas architecture deep-dive

## 🤝 Contributing

1. Fork → feature branch → PR
2. `npm run lint` passes
3. TypeScript strict mode clean
4. Windows build verified (GitHub Actions)

## 📄 License

MIT — build something cool with it.
