# 🚀 QUICK COMMAND REFERENCE

## Start the App
```bash
npm run windows
```
**Time:** 30-60 seconds | **Result:** App launches with TaskExecutor demo

---

## Essential Commands

| Command | Purpose | When to Use |
|---------|---------|------------|
| `npm run windows` | Start Windows app | Main development |
| `npm start` | Start Metro bundler only | If you want to see bundler logs |
| `npm run android` | Start Android app | For Android testing |
| `npm run ios` | Start iOS app | For macOS iOS testing |
| `npm test` | Run tests | To verify code |

---

## Troubleshooting Commands

| Problem | Solution |
|---------|----------|
| Metro bundler hangs | Press Ctrl+C, then `npm start -- --reset-cache` |
| Port 8081 in use | Find: `Get-NetTCPConnection -LocalPort 8081` \| Stop: `Stop-Process -Id <PID>` |
| npm install fails | `npm install --legacy-peer-deps` |
| Module not found | `npm install --legacy-peer-deps` again |
| TypeScript errors | Check imports, verify tsconfig.json paths |

---

## Verification Commands

| Command | Purpose |
|---------|---------|
| `npm list react-native` | Check React Native version |
| `npm list @google/generative-ai` | Check Gemini API version |
| `npm audit` | Check security vulnerabilities |
| `npm ls --depth=0` | List top-level dependencies |

---

## Status Commands

| Command | Output |
|---------|--------|
| `npm -v` | Shows npm version |
| `node -v` | Shows Node.js version |
| `npm list --depth=0` | Shows installed packages |

---

## If Everything Fails

```bash
# Step 1: Remove everything
rm -r node_modules package-lock.json

# Step 2: Clear npm cache
npm cache clean --force

# Step 3: Reinstall
npm install --legacy-peer-deps

# Step 4: Launch
npm run windows
```

---

## Right Now

```bash
npm run windows
```

**Your app launches in 30-60 seconds!** 🎉

---

*Installation Date: June 4, 2026*  
*Status: ✅ READY*
