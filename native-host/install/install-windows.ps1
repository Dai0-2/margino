param(
    [string]$BinaryPath = "",
    [string]$InstallDir = ""
)

$ErrorActionPreference = "Stop"
$HostName = "com.paperflow.ai"
$ExtensionId = "dffiahjmpkmellmjijffpcofoahbccoc"
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$NativeHostDirectory = Split-Path -Parent $ScriptDirectory

if ([string]::IsNullOrWhiteSpace($BinaryPath)) {
    $PackagedBinary = Join-Path $ScriptDirectory "paperflow-host.exe"
    $BuiltBinary = Join-Path $NativeHostDirectory "target\release\paperflow-host.exe"
    if (Test-Path $PackagedBinary) {
        $BinaryPath = $PackagedBinary
    } elseif (Test-Path $BuiltBinary) {
        $BinaryPath = $BuiltBinary
    } else {
        $Cargo = Get-Command cargo -ErrorAction SilentlyContinue
        if ($null -eq $Cargo) {
            throw @"
PaperFlow Native Host is needed only for ChatGPT/Codex subscription mode.
OpenAI-compatible API mode does not need Cargo or the Native Host.

To use ChatGPT/Codex, install:
1. Visual Studio Build Tools 2022 with "Desktop development with C++".
2. Rust from https://rustup.rs/ or: winget install --id Rustlang.Rustup -e

Close and reopen PowerShell, verify "cargo --version", then run this installer again.
"@
        }

        Write-Host "Building the PaperFlow Native Host..."
        Push-Location $NativeHostDirectory
        try {
            & $Cargo.Source build --release --locked
            if ($LASTEXITCODE -ne 0) {
                throw "Building the PaperFlow Native Host failed with exit code $LASTEXITCODE."
            }
        } finally {
            Pop-Location
        }
        $BinaryPath = $BuiltBinary
    }
}

if (-not (Test-Path -PathType Leaf $BinaryPath)) {
    throw "PaperFlow native host binary not found: $BinaryPath"
}

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "PaperFlow AI"
}
$RuntimeDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($InstallDir)

# Test-Path can succeed inside an MSIX environment while Chrome sees no file.
# Inspect open file handles, not just the logical paths used by this process.
if (-not ("Margino.NativeInstallPaths" -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32.SafeHandles;
namespace Margino {
    public static class NativeInstallPaths {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern uint GetFinalPathNameByHandle(
            SafeFileHandle file, StringBuilder path, uint length, uint flags);
        public static string Resolve(string path) {
            using (var file = new FileStream(path, FileMode.Open, FileAccess.Read,
                FileShare.ReadWrite | FileShare.Delete)) {
                var buffer = new StringBuilder(32768);
                uint length = GetFinalPathNameByHandle(file.SafeFileHandle,
                    buffer, (uint)buffer.Capacity, 0);
                if (length == 0) throw new Win32Exception(Marshal.GetLastWin32Error());
                if (length >= buffer.Capacity) throw new IOException("Resolved path is too long.");
                string result = buffer.ToString();
                if (result.StartsWith(@"\\?\UNC\", StringComparison.OrdinalIgnoreCase))
                    return @"\\" + result.Substring(8);
                if (result.StartsWith(@"\\?\")) return result.Substring(4);
                return result;
            }
        }
    }
}
'@
}

function Assert-UnredirectedFile([string]$Path) {
    $ActualPath = [Margino.NativeInstallPaths]::Resolve($Path)
    if (-not [string]::Equals($Path, $ActualPath, [StringComparison]::OrdinalIgnoreCase)) {
        throw @"
Margino installation stopped: the file path was redirected.
Requested: $Path
Actual:    $ActualPath
Chrome may not see files at the requested path. The Native Host registry entry was not changed.
Run the installer from a standalone Windows PowerShell window (not inside Codex),
or retry with -InstallDir pointing to a persistent, non-redirected directory you can write to.
Do not delete that directory after installation. Do not uninstall the extension or reset your login.
"@
    }
}

$RuntimeBinary = Join-Path $RuntimeDirectory "paperflow-host.exe"
$ManifestPath = Join-Path $RuntimeDirectory "$HostName.json"
$RegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"

New-Item -ItemType Directory -Path $RuntimeDirectory -Force | Out-Null
Copy-Item -LiteralPath $BinaryPath -Destination $RuntimeBinary -Force

$Manifest = [ordered]@{
    name = $HostName
    description = "Margino native host"
    path = $RuntimeBinary
    type = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionId/")
}
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($ManifestPath, ($Manifest | ConvertTo-Json -Depth 3), $Utf8NoBom)

Assert-UnredirectedFile $RuntimeBinary
Assert-UnredirectedFile $ManifestPath

New-Item -Path $RegistryPath -Force | Out-Null
Set-Item -Path $RegistryPath -Value $ManifestPath

Write-Host "Margino native host files installed and registered. Chrome connectivity has not yet been verified."
Write-Host "Binary: $RuntimeBinary"
Write-Host "Manifest: $ManifestPath"
Write-Host "Reload Margino from chrome://extensions, refresh the paper tab, then try Sign in with ChatGPT."
