# ✅ Orchestra Setup Checklist

## Pre-Setup Verification

### System Requirements
- [ ] **Node.js LTS installed**
  ```powershell
  node --version    # Should be v16.0.0 or higher
  ```

- [ ] **npm v7+ installed**
  ```powershell
  npm --version     # Should be v7.0.0 or higher
  ```

- [ ] **Visual Studio 2022 Community/Professional installed**
  - [ ] "Desktop development with C++" workload
  - [ ] "Universal Windows Platform development" workload

- [ ] **Windows SDK** (v1909 or later) available
  - Check via Visual Studio Installer

- [ ] **Git installed** (optional but recommended)
  ```powershell
  git --version
  ```

---

## Automated Setup Checklist

### Step 1: Navigate to Project
```powershell
cd c:\Users\hp\Desktop\red\create\Orchestra
```
- [ ] Command executed without errors

### Step 2: Run Setup Script
```powershell
.\setup.bat
```
- [ ] setup.bat executed successfully
- [ ] Script verified Node.js installation
- [ ] Script verified npm installation
- [ ] npm dependencies installed (wait 2-5 minutes)
- [ ] React Native Windows initialized with C++/WinUI3
- [ ] Setup script completed successfully

### Step 3: Verify Installation
```powershell
ls -la windows/
npm list react-native-windows
```
- [ ] `windows/` directory exists
- [ ] `windows/Orchestra.sln` file present
- [ ] `react-native-windows` shows as installed dependency

---

## Post-Setup Verification

### Verify Project Structure
```powershell
# Check key files exist
Test-Path package.json              # Should be $true
Test-Path App.tsx                   # Should be $true
Test-Path metro.config.js           # Should be $true
Test-Path windows/Orchestra.sln     # Should be $true
```
- [ ] All key files verified as present

### Test Metro Bundler
```powershell
npm run start
```
- [ ] Metro bundler starts without errors
- [ ] Shows "Loaded dependencies" message
- [ ] Ready to accept requests on port 8081
- [ ] Press Ctrl+C to stop when done

### Build and Run the App
```powershell
npm run windows
```
- [ ] Metro bundler starts (or connects to running instance)
- [ ] Build starts in Visual Studio
- [ ] Build completes successfully
- [ ] Windows app launches
- [ ] React Native welcome screen visible

---

## Configuration Verification

### metro.config.js
```powershell
findstr /C:".cjs" metro.config.js
```
- [ ] Output shows `.cjs` in sourceExts

### package.json
```powershell
findstr /C:"react-native" package.json
findstr /C:"react-native-windows" package.json
```
- [ ] Both packages listed in dependencies

### TypeScript Support
```powershell
Test-Path App.tsx
Test-Path tsconfig.json
```
- [ ] App.tsx uses TypeScript syntax
- [ ] tsconfig.json configured

### ESLint & Prettier
```powershell
Test-Path .eslintrc.js
Test-Path .prettierrc.json
```
- [ ] Both configuration files present

---

## Development Readiness Checklist

### Can start Metro bundler
```powershell
npm run start
```
- [ ] Metro starts successfully
- [ ] No dependency errors
- [ ] Can stop with Ctrl+C

### Can build and run Windows app
```powershell
npm run windows
```
- [ ] App builds successfully
- [ ] App window opens
- [ ] Welcome screen displays

### Can edit and reload
- [ ] Edit App.tsx or any component
- [ ] Save file
- [ ] App hot-reloads (Fast Refresh)
- [ ] Changes visible in app window

### Can open debugging menu
- [ ] App running on screen
- [ ] Press Ctrl+M
- [ ] Developer menu appears with options:
  - [ ] Reload
  - [ ] Open Debugger
  - [ ] Toggle Slow Animations
  - [ ] Enable Fast Refresh

### Can run tests
```powershell
npm test
```
- [ ] Jest runs
- [ ] Sample test completes
- [ ] Test results display

---

## Visual Studio Verification

### Solution Opens
- [ ] Open `windows/Orchestra.sln` in Visual Studio 2022
- [ ] Solution loads without errors
- [ ] Project tree visible

### Build Configuration
- [ ] **Orchestra** is set as Startup Project
- [ ] Configuration dropdown shows "Debug" / "Release"
- [ ] Platform dropdown shows "x64" / "Win32" / "ARM64"
- [ ] Current selection: **Debug + x64**

### Can Build
- [ ] Select Debug + x64
- [ ] Press Ctrl+Shift+B
- [ ] Build completes: "Build succeeded"
- [ ] Output shows no errors

### Can Run from Visual Studio
- [ ] Press F5
- [ ] App launches
- [ ] Welcome screen visible
- [ ] Can close app normally

---

## First Time Development Checklist

### Setup is Complete?
- [ ] All above checklists verified
- [ ] App launches successfully
- [ ] No errors in console

### Ready to Start Coding?

1. **Edit App.tsx**
   - [ ] Open `App.tsx` in editor
   - [ ] Change the text in Section title
   - [ ] Save file
   - [ ] App reloads with changes

2. **Create First Component**
   - [ ] Create `src/components/` directory
   - [ ] Create `src/components/HelloWorld.tsx`
   - [ ] Write simple React component
   - [ ] Import and use in `App.tsx`
   - [ ] Verify component renders

3. **Add First Dependency**
   - [ ] Run: `npm install react-native-gesture-handler`
   - [ ] Check package.json updated
   - [ ] Build runs successfully

4. **Write First Test**
   - [ ] Edit `__tests__/App-test.tsx`
   - [ ] Run: `npm test`
   - [ ] Test passes

---

## Troubleshooting Checklist

### If setup.bat fails:

**"Node.js is not installed"**
- [ ] Download Node.js from nodejs.org
- [ ] Run installer
- [ ] Restart PowerShell
- [ ] Retry setup.bat

**"npm install failed"**
- [ ] Check internet connection
- [ ] Run: `npm cache clean --force`
- [ ] Try again: `npm install`

**"react-native-windows-init failed"**
- [ ] Check Visual Studio 2022 installed with C++ workload
- [ ] Run: `npx react-native-windows-init --overwrite --language cpp --useWinUI3` manually

### If app won't launch:

**"Metro bundler won't start"**
- [ ] Run: `npm run start -- --reset-cache`
- [ ] Check port 8081 is free: `netstat -ano | findstr :8081`
- [ ] Kill process if needed: `taskkill /PID <PID> /F`

**"Build fails with MSVC errors"**
- [ ] Open VS Installer
- [ ] Check "Desktop development with C++" workload is installed
- [ ] Update MSVC toolset if available
- [ ] Delete `windows\build` folder
- [ ] Rebuild

**"WinUI 3 packages not found"**
- [ ] Open `windows/Orchestra.sln` in Visual Studio
- [ ] Wait for NuGet package restore
- [ ] If stuck, go to Tools → NuGet Package Manager → Restore Packages
- [ ] Rebuild solution

---

## Success Indicators ✅

All of these should be true:

- [ ] Project directory: `c:\Users\hp\Desktop\red\create\Orchestra`
- [ ] Files created: 24+ configuration and documentation files
- [ ] Directories created: `src/`, `windows/`, `__tests__/`
- [ ] `package.json` contains react and react-native dependencies
- [ ] `windows/Orchestra.sln` exists and opens in Visual Studio
- [ ] Metro bundler starts without errors: `npm run start`
- [ ] App builds and launches: `npm run windows`
- [ ] App displays React Native welcome screen
- [ ] Hot reload works: Edit App.tsx → save → app updates
- [ ] Developer menu opens: Ctrl+M in app
- [ ] Tests run: `npm test` executes successfully

---

## Next Actions

1. **Immediate** (Complete setup)
   - [ ] Run `.\setup.bat`
   - [ ] Verify with `npm run windows`
   - [ ] See app launch

2. **Short Term** (Start developing)
   - [ ] Edit `App.tsx`
   - [ ] Create first component
   - [ ] Add npm package

3. **Medium Term** (Build app)
   - [ ] Design app structure
   - [ ] Create screens/components
   - [ ] Write unit tests
   - [ ] Integrate with backend

4. **Long Term** (Production)
   - [ ] Optimize performance
   - [ ] Build release version
   - [ ] Prepare for distribution

---

## Documentation Quick Links

| Document | Purpose |
|----------|---------|
| **SETUP_INSTRUCTIONS.md** | Start here - setup checklist |
| **GETTING_STARTED.md** | Development workflow & tips |
| **README.md** | Full documentation |
| **BUILD_GUIDE.md** | Building & deployment |
| **PROJECT_SUMMARY.md** | Overview of what was created |

---

**Checklist Version:** 1.0  
**Created:** June 4, 2026  
**Status:** Ready for use  

**All set? Run this command:**
```powershell
.\setup.bat
```

Then after it completes:
```powershell
npm run windows
```

Enjoy! 🚀
