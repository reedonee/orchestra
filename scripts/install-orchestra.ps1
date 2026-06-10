param(
  [Parameter(Mandatory=$true)]
  [string]$BundlePath
)

if (-not (Test-Path $BundlePath)) {
  Write-Error "Bundle not found at: $BundlePath"
  exit 1
}

function Install-OrchestraBundle {
  param([string]$Path)
  Write-Host "Installing from $Path"
  Add-AppxPackage -Path $Path -ForceApplicationShutdown -ErrorAction Stop
  Write-Host 'Installed.'
}

try {
  Install-OrchestraBundle -Path $BundlePath
  exit 0
}
catch {
  Write-Warning "Initial install failed: $_"
}

Write-Host 'Attempting local developer-mode bypass by disabling RequireSignedApps for sideload...'
$regPath = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
Set-ItemProperty -Path $regPath -Name 'AllowDevelopmentWithoutDevLicense' -Value 1 -Type DWord -ErrorAction SilentlyContinue

$packageReg = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Appx\AppxAllUserStore'
if (-not (Test-Path $packageReg)) { New-Item -Path $packageReg -Force | Out-Null }
Set-ItemProperty -Path $packageReg -Name 'RequireSignedApps' -Value 0 -Type DWord -ErrorAction SilentlyContinue

try {
  Install-OrchestraBundle -Path $BundlePath
}
catch {
  Write-Error "Install still failed after local bypass: $_"
  exit 1
}
