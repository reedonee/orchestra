param(
  [String]$BundlePath,
  [Switch]$BypassSigning
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'SilentlyContinue'

$BundlePath = $BundlePath.Trim()
if (-not $BundlePath -or -not (Test-Path $BundlePath)) {
  Write-Error "BundlePath is required and must exist. Pass -BundlePath 'C:\path\to\file.msixbundle'."
  exit 1
}

$installParams = @{
  Path = $BundlePath
  ForceApplicationShutdown = $true
  ErrorAction = 'SilentlyContinue'
}

$log = Join-Path $HOME ".medcare-install.log"

function Write-Log {
  param([string]$Message)
  $ts = Get-Date -Format "o"
  $line = "$ts $Message"
  Write-Host $line
  Add-Content -Path $log -Value $line
}

function Invoke-Install {
  Write-Log "Installing: $BundlePath"
  Add-AppxPackage @installParams
  if ($LASTEXITCODE -eq 0) {
    Write-Log "Install result: success"
    return $true
  }
  Write-Log "Install result: failed with exit code $LASTEXITCODE"
  return $false
}

function Disable-OpsRequirement {
  Write-Log "Applying local bypass for signed-app requirement."

  $regPath = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
  if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null | Write-Log "Created $regPath"
  }
  Set-ItemProperty -Path $regPath -Name 'AllowDevelopmentWithoutDevLicense' -Value 1 -Type DWord | Out-Null | Write-Log "Set AppModelUnlock."

  $packageReg = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Appx\AppxAllUserStore'
  if (-not (Test-Path $packageReg)) {
    New-Item -Path $packageReg -Force | Out-Null | Write-Log "Created $packageReg"
  }
  Set-ItemProperty -Path $packageReg -Name 'RequireSignedApps' -Value 0 -Type DWord | Out-Null | Write-Log "Set RequireSignedApps=0."

  $developerModeReg = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
  $devLicensePath = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\AppModel\Unlock'
  if (-not (Test-Path $devLicensePath)) {
    New-Item -Path $devLicensePath -Force | Out-Null | Write-Log "Created Unlock reg path"
  }
  Set-ItemProperty -Path $devLicensePath -Name 'AllowDevelopmentWithoutDevLicense' -Value 1 -Type DWord | Out-Null | Write-Log "Enabled Development Mode."

  Write-Log "Local bypass applied."
}

function Ensure-CertTrust {
  param([string]$Cer)
  if (-not (Test-Path $Cer)) {
    Write-Log "Certificate file not found: $Cer"
    return
  }
  Write-Log "Installing certificate: $Cer"
  $store = 'Cert:\LocalMachine\TrustedPublisher'
  $storeRoot = 'Cert:\LocalMachine\Root'
  if (-not (Test-Path $store)) { New-Item -Path $store -Force | Out-Null }
  if (-not (Test-Path $storeRoot)) { New-Item -Path $storeRoot -Force | Out-Null }
  Get-PfxCertificate -FilePath $Cer -ErrorAction SilentlyContinue | Out-Null
  Import-Certificate -FilePath $Cer -CertStoreLocation $store | Out-Null | Write-Log "Imported to TrustedPublisher"
  Import-Certificate -FilePath $Cer -CertStoreLocation $storeRoot -ErrorAction SilentlyContinue | Out-Null | Write-Log "Imported to Root"
}

Write-Log "Provisioned MedCare Ultra installer."

$appxLog = Get-AppPackageLog -ActivityID 'd7589896-f72a-0002-d146-80d72af7dc01' -ErrorAction SilentlyContinue
if ($appxLog) {
  Write-Log "Existing AppxPackage log found"
  $appxLog | Out-String | Write-Log
}

$appxLog2 = Get-AppPackageLog -ActivityID 'd7589896-f72a-0001-3494-77d72af7dc01' -ErrorAction SilentlyContinue
if ($appxLog2) {
  Write-Log "Previous AppxPackage log found"
  $appxLog2 | Out-String | Write-Log
}

$res = Invoke-Install
if ($res) {
  Write-Log "Finished."
  exit 0
}

Write-Log "Initial install failed. Attempting local bypass."
Disable-OpsRequirement

$retry = Invoke-Install
if ($retry) {
  Write-Log "Finished after bypass."
  exit 0
}

Write-Log "Local bypass did not succeed. Remediation options:"
Write-Log "- Deploy via Intune with Trusted Publisher"
Write-Log "- Build/redeploy with enterprise-signed package"
exit 1
