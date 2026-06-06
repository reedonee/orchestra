# Orchestra - React Native Windows Build Guide

This guide covers building, configuring, and deploying the Orchestra app for Windows.

## Build Variants

### Debug Build (Development)
```powershell
npm run windows
```
- Slower build, includes debugging symbols
- Smaller app size (optimized for quick iteration)
- Can attach debugger
- Use during development

### Release Build (Production)
```powershell
# Using Visual Studio
# Open windows/Orchestra.sln → Select Release + x64 → Ctrl+Shift+B

# Or using Command Line
cd windows
msbuild Orchestra.sln /p:Configuration=Release /p:Platform=x64
```
- Optimized for performance
- Larger file size (includes optimizations)
- No debugging capabilities
- Use for production distribution

## Architecture Support

The project can be built for different architectures:

| Architecture | Visual Studio | Command Line |
|-------------|---------------|-------------|
| **x64** (Intel 64-bit) | Platform = x64 | `/p:Platform=x64` |
| **ARM64** (ARM 64-bit) | Platform = ARM64 | `/p:Platform=ARM64` |
| **x86** (Intel 32-bit) | Platform = Win32 | `/p:Platform=Win32` |

### Building for ARM64 (Example)
```powershell
cd windows
msbuild Orchestra.sln /p:Configuration=Release /p:Platform=ARM64
```

## Metro Bundler Configuration

The `metro.config.js` is pre-configured to:
- Support `.cjs` file resolution
- Handle Windows-specific package formats
- Optimize for Windows development

If Metro fails:
```powershell
npm run start --reset-cache
```

## Continuous Integration / Deployment

### GitHub Actions (Example)
Create `.github/workflows/build-windows.yml`:

```yaml
name: Build Windows App

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install dependencies
        run: npm install
      
      - name: Setup React Native Windows
        run: npx react-native-windows-init --overwrite --language cpp --useWinUI3
      
      - name: Build Windows app
        run: npm run windows -- --release
```

## Performance Optimization

### Metro Cache Clearing
If experiencing slow builds:
```powershell
npm run start --reset-cache
```

### Build Cache Cleaning
```powershell
cd windows
rmdir /s /q build
msbuild Orchestra.sln /t:Clean
msbuild Orchestra.sln /p:Configuration=Debug /p:Platform=x64
```

### Parallel Build
```powershell
cd windows
msbuild Orchestra.sln /m /p:Configuration=Release /p:Platform=x64
```

## Troubleshooting Build Issues

### MSBuild Not Found
```powershell
# Use Developer Command Prompt for VS 2022
"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
```

### NuGet Package Restore Failed
```powershell
cd windows
nuget restore Orchestra.sln
msbuild Orchestra.sln /p:Configuration=Debug /p:Platform=x64
```

### WinAppSDK / WinUI 3 Missing
1. Open `windows/Orchestra.sln` in Visual Studio
2. Go to Tools → NuGet Package Manager → Package Manager Console
3. Run: `Update-Package -Reinstall`

### Linker Errors
- Ensure Windows SDK is installed (v1909 or later)
- Check Visual Studio C++ workload is complete
- Try Clean → Rebuild in Visual Studio

## Output Locations

After building, find outputs at:
- **Debug**: `windows/build/x64/Debug/`
- **Release**: `windows/build/x64/Release/`

The app executable:
```
windows/build/x64/Release/Orchestra/Orchestra.exe
```

## Distribution

### Packaging for Store
See [Windows App SDK / Microsoft Store documentation](https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/)

### Self-Signed Installation
```powershell
# Generate certificate
New-SelfSignedCertificate -Type Custom -Subject "CN=Orchestra" `
  -KeyUsage DigitalSignature -FriendlyName "Orchestra Dev Cert" `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3") `
  -NotAfter (Get-Date).AddYears(1)

# Sign app package (if using MSIX)
```

## Additional Resources

- [MSBuild Command Line](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-command-line-reference)
- [Visual Studio Build Customization](https://learn.microsoft.com/en-us/visualstudio/msbuild/customize-your-build)
- [Windows App Development](https://learn.microsoft.com/en-us/windows/apps/)
