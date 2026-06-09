param(
  [string]$BundlePath = "$HOME\Desktop\orchestra-windows-Release (1)\windows\AppPackages\Orchestra_1.0.0.0_Test\Orchestra.msixbundle"
)

if (-not (Test-Path $BundlePath)) {
  Write-Error "Bundle not found at: $BundlePath"
  exit 1
}

Write-Host "Installing Orchestra from: $BundlePath"
Write-Host "If this fails with trust/signing errors, run this script with -ForceDeveloperMode or enable Developer Mode in Settings."
param([switch]$ForceDeveloperMode)
if ($ForceDeveloperMode) {
  Write-Host "Enabling Developer Mode for sideload..."
  $regPath = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
  if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
  Set-ItemProperty -Path $regPath -Name 'AllowDevelopmentWithoutDevLicense' -Value 1 -Type DWord
  Write-Host "Developer Mode registry updated."
}

Add-AppxPackage -Path $BundlePath -ForceApplicationShutdown -ErrorAction Stop
Write-Host "Install attempt finished."
