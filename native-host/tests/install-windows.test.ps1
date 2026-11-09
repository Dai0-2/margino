# CI-only installer integration test; does not launch a Host or access credentials.
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'Run this test on an isolated GitHub Actions Windows runner.' }
$RegistryPath = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.paperflow.ai'
if (Test-Path $RegistryPath) { throw 'Refusing to overwrite an existing Native Host registration.' }
$Root = Join-Path $env:RUNNER_TEMP ([guid]::NewGuid().ToString())
$InstallDir = Join-Path $Root 'Custom install with spaces'
$TargetDir = Join-Path $Root 'Physical target'
$RedirectedDir = Join-Path $Root 'Redirected directory'
$Installer = Join-Path $PSScriptRoot '../install/install-windows.ps1'
$Uninstaller = Join-Path $PSScriptRoot '../install/uninstall-windows.ps1'
New-Item -ItemType Directory -Path $Root -Force | Out-Null
$Binary = Join-Path $Root 'paperflow-host.exe'
# The installer only copies this fixture; executable behavior is tested separately.
[IO.File]::WriteAllText($Binary, 'installer test fixture')
try {
    & $Installer -BinaryPath $Binary -InstallDir $InstallDir
    $ExpectedManifest = Join-Path $InstallDir 'com.paperflow.ai.json'
    $Registered = (Get-Item -LiteralPath $RegistryPath).GetValue('')
    if ($Registered -ne $ExpectedManifest) { throw 'Incorrect registered manifest path.' }
    $Manifest = Get-Content -LiteralPath $Registered -Raw | ConvertFrom-Json
    if ($Manifest.path -ne (Join-Path $InstallDir 'paperflow-host.exe')) { throw 'Incorrect binary path.' }
    if ($Manifest.name -ne 'com.paperflow.ai') { throw 'Host name changed.' }
    if ($Manifest.allowed_origins.Count -ne 1 -or $Manifest.allowed_origins[0] -ne 'chrome-extension://dffiahjmpkmellmjijffpcofoahbccoc/') { throw 'Extension ID changed.' }
    $Bytes = [IO.File]::ReadAllBytes($Registered)
    if ($Bytes[0] -eq 239 -and $Bytes[1] -eq 187 -and $Bytes[2] -eq 191) { throw 'Manifest contains a BOM.' }
    # Repeated installation must work when Add-Type has already run.
    & $Installer -BinaryPath $Binary -InstallDir $InstallDir

    New-Item -ItemType Directory -Path $TargetDir | Out-Null
    New-Item -ItemType Junction -Path $RedirectedDir -Target $TargetDir | Out-Null
    $Rejected = $false
    try {
        & $Installer -BinaryPath $Binary -InstallDir $RedirectedDir
    } catch {
        if ($_.Exception.Message -notmatch 'file path was redirected') { throw }
        $Rejected = $true
    }
    if (-not $Rejected) { throw 'Redirected installation was incorrectly accepted.' }
    if ((Get-Item -LiteralPath $RegistryPath).GetValue('') -ne $Registered) { throw 'Failed installation changed registry.' }
    & $Uninstaller -InstallDir $InstallDir
    if (Test-Path $RegistryPath) { throw 'Uninstall left the registry entry.' }
    if (Test-Path (Join-Path $InstallDir 'paperflow-host.exe')) { throw 'Custom binary was not removed.' }
    Write-Host 'PASS: custom install, reinstall, manifest encoding/identity, path redirection, registry preservation, uninstall.'
} finally {
    if (Test-Path $RegistryPath) { Remove-Item -LiteralPath $RegistryPath -Recurse -Force }
    # Remove the junction itself before cleaning up the isolated test directory.
    if (Test-Path $RedirectedDir) { [IO.Directory]::Delete($RedirectedDir) }
    Remove-Item -LiteralPath $Root -Recurse -Force
}
