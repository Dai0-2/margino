param(
    [string]$InstallDir = ""
)

$ErrorActionPreference = "Stop"

$HostName = "com.paperflow.ai"
if ([string]::IsNullOrWhiteSpace($InstallDir)) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "PaperFlow AI"
}
$RuntimeDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($InstallDir)
$RegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"

if (Test-Path $RegistryPath) {
    Remove-Item -LiteralPath $RegistryPath -Recurse -Force
}
Remove-Item -LiteralPath (Join-Path $RuntimeDirectory "$HostName.json") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $RuntimeDirectory "paperflow-host.exe") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $RuntimeDirectory -Force -ErrorAction SilentlyContinue

Write-Host "PaperFlow native host uninstalled."
Write-Host "API and vault credentials were preserved in Windows Credential Manager."
