# SETUP_INSTRUCTIONS.md - Orchestra React Native Windows

## ⚡ Quick Start (5 Minutes)

### Windows (PowerShell)
```powershell
cd c:\Users\hp\Desktop\red\create\Orchestra
.\setup.bat
```

### macOS / Linux
```bash
cd ~/path/to/Orchestra
chmod +x setup.sh
./setup.sh
```

---

## 📋 Prerequisites Checklist

Before running setup, verify you have:

- [ ] **Node.js LTS** installed
  ```powershell
  node --version
  ```
  Should show v16 or higher. [Download](https://nodejs.org/)

- [ ] **npm 7+** installed
  ```powershell
  npm --version
  ```
  Should show v7 or higher. (Comes with Node.js)

- [ ] **Visual Studio 2022** installed with these workloads:
  - [ ] Desktop development with C++
  - [ ] Universal Windows Platform development
  
  [Download VS 2022](https://visualstudio.microsoft.com/downloads/)

- [ ] **Windows SDK** installed (v1909 or later)
  - [ ] Install via Visual Studio Installer if not present

- [ ] **Git** (optional)
  ```powershell
  git --version
  ```

---

## 🚀 Installation Methods

### Method 1: Automated Setup (RECOMMENDED)

#### Windows (using setup.bat)
```powershell
cd c:\Users\hp\Desktop\red\create\Orchestra
.\setup.bat
```

#### macOS/Linux (using setup.sh)
```bash
cd ~/path/to/Orchestra
chmod +x setup.sh
./setup.sh
```

**What happens:**
1. ✅ Validates Node.js and npm
2. ✅ Installs npm dependencies
3. ✅ Initializes React Native Windows with C++ and WinUI 3
4. ✅ Displays completion message

### Method 2: Manual Commands (Step-by-Step)

#### Step 1: Install Dependencies
```powershell
cd c:\Users\hp\Desktop\red\create\Orchestra
npm install
```
*Wait for this to complete. It may take 2-5 minutes.*

#### Step 2: Add Windows Support
```powershell
npx react-native-windows-init --overwrite --language cpp --useWinUI3
```
*This creates the `windows/` directory with Visual Studio project files.*

#### Step 3: Start Development

**Option A: Using npm (Easiest)**
```powershell
npm run windows
```
- Starts Metro bundler
- Builds the app
- Launches the Windows app

**Option B: Using Visual Studio**
1. Open `windows/Orchestra.sln` in Visual Studio 2022
2. Set **Orchestra** as Startup Project (if not already)
3. Select **Release** or **Debug** from the configuration dropdown
4. Select **x64** from the platform dropdown (or **ARM64** for ARM devices)
5. Press **F5** or click **Run**

---

## ✅ Verification After Setup

### Verify Installation
```powershell
# Check Node.js
node --version

# Check npm
npm --version

# Check if windows directory was created
ls -la windows/

# Check if react-native-windows is installed
npm list react-native-windows
```

### Run the App

**Using npm:**
```powershell
npm run windows
```

**Expected outcome:**
- Metro bundler starts in terminal (shows "Loading dependency graph...")
- App window opens on your desktop
- App displays the React Native welcome screen

---

## 🔧 Configuration Files Explained

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and npm scripts |
| `metro.config.js` | Metro bundler configuration (handles .cjs files) |
| `babel.config.js` | JavaScript transpilation settings |
| `tsconfig.json` | TypeScript compiler settings |
| `.eslintrc.js` | Code linting rules |
| `react.config.js` | React Native CLI configuration |
| `windows/Orchestra.sln` | Visual Studio solution file |

All files are pre-configured. ✅ **No manual edits required.**

---

## 📁 Project Structure

```
Orchestra/
├── src/                        ← Add your components here
├── windows/                    ← ⚠️ Auto-generated (don't edit manually)
│   ├── Orchestra.sln           ← Open in Visual Studio
│   └── Orchestra/              ← C++/WinUI 3 project
├── App.tsx                     ← Root React component
├── index.js                    ← App entry point
├── package.json                ← Dependencies
├── metro.config.js             ← Bundler config (already configured)
├── setup.bat                   ← Setup script for Windows
├── setup.sh                    ← Setup script for macOS/Linux
├── README.md                   ← Full documentation
├── GETTING_STARTED.md          ← Quick start guide
├── BUILD_GUIDE.md              ← Build & deployment info
└── SETUP_INSTRUCTIONS.md       ← This file
```

---

## 🛠️ Available npm Scripts

```powershell
npm run start      # Start Metro bundler
npm run windows    # Build & run Windows app
npm run android    # Build & run Android (if configured)
npm run ios        # Build & run iOS (if configured)
npm test           # Run Jest unit tests
```

---

## ❌ Troubleshooting

### Problem: "npm: command not found"
**Solution:**
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Restart PowerShell
3. Verify: `node --version`

### Problem: "Cannot find Visual Studio / MSBuild"
**Solution:**
1. Install Visual Studio 2022 from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/)
2. Ensure workload "Desktop development with C++" is checked
3. Or use "Developer Command Prompt for VS 2022"

### Problem: "Windows SDK not found" or "WinUI 3 packages not found"
**Solution:**
1. Open Visual Studio Installer
2. Click **Modify** on your VS 2022 installation
3. Scroll down and check:
   - ✅ Windows 10/11 SDK (latest version)
   - ✅ Windows App SDK
4. Click **Modify** and wait for installation

### Problem: Metro bundler won't start
**Solution:**
```powershell
# Stop the current Metro process
# Then run with cache reset
npm run start -- --reset-cache
```

### Problem: "Address already in use :8081"
**Solution:**
```powershell
# Kill process on port 8081
netstat -ano | findstr :8081
# Note the PID, then:
taskkill /PID <PID> /F

# Or use a different port:
npm run start -- --port 8082
```

### Problem: Build fails with C++ compilation errors
**Solution:**
1. Delete the build folder: `rmdir /s windows\build`
2. Update Visual Studio to latest version
3. Ensure MSVC toolset is installed (v143 or later)
4. Try building from Visual Studio directly

---

## 📚 Documentation

- **README.md** - Full project documentation
- **GETTING_STARTED.md** - Detailed setup & development workflow
- **BUILD_GUIDE.md** - Advanced build configurations & optimization
- [React Native Docs](https://reactnative.dev)
- [React Native Windows Docs](https://microsoft.github.io/react-native-windows/)
- [WinUI 3 Docs](https://microsoft.github.io/microsoft-ui-xaml/)

---

## 💡 Development Tips

### Hot Reload
While app is running:
1. Press **Ctrl+M** to open developer menu
2. Select **Reload** or enable **Fast Refresh**
3. Save a file in your editor → App reloads automatically

### Debugging
1. Press **Ctrl+M** in app
2. Select **Open Debugger** to use Chrome DevTools
3. Or attach Visual Studio debugger to the running process

### Building for Release
```powershell
cd windows
msbuild Orchestra.sln /p:Configuration=Release /p:Platform=x64
```

---

## ✨ Next Steps After Setup

1. ✅ **Setup Complete?** Run `npm run windows` and verify the app launches
2. 🔨 **Start Coding:** Edit `App.tsx` to customize your UI
3. 📦 **Add Packages:** `npm install <package-name>` to add dependencies
4. 🚀 **Build for Release:** Follow BUILD_GUIDE.md for production builds
5. 🌐 **Deploy:** Package your app using Visual Studio or CI/CD

---

## 🆘 Still Having Issues?

1. **Check Prerequisites:** Verify all items in the checklist above
2. **Read Documentation:** Check README.md or GETTING_STARTED.md
3. **Search Issues:** Check [react-native-windows issues](https://github.com/microsoft/react-native-windows/issues)
4. **Ask Community:** React Native community channels on Slack

---

**Setup created on:** June 4, 2026  
**React Native Version:** 0.72.4  
**React Native Windows Version:** 0.72.0  
**Target:** Windows 10/11 with WinUI 3 (C++ / Windows App SDK)

Happy developing! 🚀
