# 🚀 Orchestra — Task Execution Engine

A React Native + TypeScript app for parallel task execution with real-time canvas visualization, powered by Google Gemini 3.5 Flash.

---

## ⚡ Quick Start (Choose One)

### **Option 1: Web (Fastest — No Setup)**
```bash
npm run web
```
Opens http://localhost:19006 in browser. Full app testing, ~30 seconds.

### **Option 2: Android (If Android Studio installed)**
```bash
npm run android
```
Builds and runs on emulator or device. ~2–5 minutes first time.

### **Option 3: Windows (Full Toolchain)**
First-time setup: Install VS 2022 + .NET SDK (see `WINDOWS_SETUP.md`). Then:
```bash
npm run windows
```

---

## 📋 Project Structure

```
src/
├── services/
│   ├── taskExecutor.ts           # Parallel task execution engine
│   ├── orchestratorService.ts    # Task decomposition with Gemini
│   ├── geminiService.ts          # Google Gemini API wrapper
│   └── audioRecorderService.ts   # Voice recording service
├── hooks/
│   ├── useTaskExecutor.ts        # Task execution state management
│   ├── useOrchestrator.ts        # Task decomposition hook
│   └── useAudioGemini.ts         # Audio + Gemini integration
├── screens/
│   ├── TaskExecutorDemo.tsx      # Main task execution UI
│   ├── OrchestratorDemo.tsx      # Task decomposition demo
│   ├── InfiniteCanvasDemo.tsx    # Real-time canvas visualization
│   └── AudioGeminiDemoScreen.tsx # Voice input demo
├── store/
│   ├── canvasStore.ts           # Zustand canvas state
│   └── byokStore.ts             # API key management
└── App.tsx                       # Main app component
```

---

## 🎯 Core Features

✅ **Parallel Task Execution** — Run multiple tasks concurrently with dependency resolution  
✅ **Real-Time Streaming** — Gemini 3.5 Flash generates content in real-time via `generateContentStream`  
✅ **Canvas Visualization** — Watch tasks execute and update on an infinite canvas  
✅ **Token Tracking** — See API usage stats and performance metrics  
✅ **Error Recovery** — Graceful per-task error handling  
✅ **Voice Input** — Record audio, transcribe with Gemini, and decompose into tasks  

---

## 🧪 Test the App

### Web
```bash
npm run web
```

1. Click **"📦 Load Sample"** to populate test tasks
2. Paste your **Gemini API key** (get one free: https://makersuite.google.com/app/apikeys)
3. Click **"▶️ Execute"** to start parallel task execution
4. Watch **real-time progress** (0% → 100%)
5. Review **results and statistics**

### Android
```bash
npm run android
```
Same steps, but runs on Android emulator/device.

### Windows
See `WINDOWS_SETUP.md` for prerequisite installation, then:
```bash
npm run windows
```

---

## 📚 Documentation

- **`WINDOWS_SETUP.md`** — Windows build prerequisites and installation
- **`TESTING_ALTERNATIVES.md`** — Web / Android testing without Windows setup
- **`docs/TASK_EXECUTOR_GUIDE.md`** — Complete API reference
- **`docs/TASK_EXECUTOR_QUICK_REFERENCE.md`** — Quick API overview
- **`STARTUP_GUIDE.md`** — Step-by-step startup walkthrough

---

## 🔑 API Key Setup

1. Get a free Gemini API key: https://makersuite.google.com/app/apikeys
2. In the app, paste your key in the **"API Key"** field
3. Key is stored locally (BYOK — Bring Your Own Key)

---

## 🛠️ Commands

| Command | Runs On |
|---------|---------|
| `npm run web` | Browser (Expo web) |
| `npm run android` | Android emulator/device |
| `npm run windows` | Windows (after setup) |
| `npm start` | Metro bundler only |
| `npm test` | Jest tests |

---

## 🚀 What's Inside

### Services
- **`taskExecutor.ts`** — Execute tasks in parallel with Gemini streaming
- **`orchestratorService.ts`** — Break down complex tasks into subtasks
- **`geminiService.ts`** — Google Gemini API client
- **`audioRecorderService.ts`** — Record and transcribe voice

### Hooks
- **`useTaskExecutor`** — Manage task execution state
- **`useOrchestrator`** — Manage task decomposition state
- **`useAudioGemini`** — Voice input → transcription → decomposition

### Stores (Zustand)
- **`canvasStore`** — Real-time canvas node updates
- **`byokStore`** — API key persistence

### UI Components
- **`TaskExecutorDemo`** — Interactive demo for parallel execution
- **`OrchestratorDemo`** — Interactive demo for task decomposition
- **`InfiniteCanvasDemo`** — Real-time canvas with streaming nodes

---

## 🎯 Example Workflow

1. **Input** → Paste Gemini API key
2. **Decompose** → Click "Load Sample" (8 test tasks)
3. **Execute** → Click "Execute" button
4. **Stream** → Watch tasks run in parallel with real-time canvas updates
5. **Results** → See completion status, token count, and execution time
6. **Export** → Save results as JSON

---

## 📊 Performance

- **First Build:** 2–5 minutes (web/Android) or 5–20 minutes (Windows)
- **Subsequent Builds:** ~30 seconds
- **Hot Reload:** Changes reflect instantly
- **Task Execution:** 30–60 seconds for 8 sample tasks (depends on Gemini API)

---

## ⚙️ System Requirements

### For Web / Android
- Node.js >= 20 (you have 24.11.1 ✅)
- npm >= 11 (you have 11.6.2 ✅)
- No additional system dependencies

### For Windows
- Windows 10/11 (17763+)
- Visual Studio 2022 (Community or Enterprise)
- .NET SDK 8.0
- Developer Mode enabled
- Long Paths enabled

See `WINDOWS_SETUP.md` for detailed installation.

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install --legacy-peer-deps
```

### Metro bundler hangs
```bash
npm start -- --reset-cache
```

### Windows build fails
See `WINDOWS_SETUP.md` — likely missing Visual Studio or .NET SDK.

### API key not working
1. Verify key is from https://makersuite.google.com/app/apikeys
2. Ensure quota available (check Gemini API console)
3. Paste full key (no extra spaces)

---

## 📄 License

MIT

---

## 🎉 Ready to Test?

```bash
npm run web
```

App opens in ~30 seconds. Load samples, add API key, execute parallel tasks, watch real-time streaming!

**Windows setup can wait.** Test on web/Android first, set up Windows later when you need it.
