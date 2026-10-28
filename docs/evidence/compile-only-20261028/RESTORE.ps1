param([Parameter(Mandatory = $true)][string]$Destination)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$rootPath = [IO.Path]::GetFullPath($PSScriptRoot)
$destinationPath = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $destinationPath) { throw 'Destination must not exist. Choose a new folder; existing evidence will not be overwritten.' }
$index = Get-Content -Encoding UTF8 -Raw (Join-Path $rootPath 'EVIDENCE_INDEX.json') | ConvertFrom-Json
foreach ($package in $index.packages) {
    $packagePath = [IO.Path]::GetFullPath((Join-Path $rootPath $package.file))
    if (-not $packagePath.StartsWith($rootPath + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Package path outside evidence directory' }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $packagePath).Hash.ToLowerInvariant() -ne $package.sha256) { throw ('Package hash mismatch: ' + $package.file) }
}
[IO.Directory]::CreateDirectory($destinationPath) | Out-Null
$opened = @{}
$restoredCount = 0
try {
    foreach ($file in $index.files) {
        $targetPath = [IO.Path]::GetFullPath((Join-Path $destinationPath $file.logical))
        if (-not $targetPath.StartsWith($destinationPath + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe logical path' }
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($targetPath)) | Out-Null
        if ($file.storage.direct) {
            [IO.File]::Copy((Join-Path $rootPath $file.storage.direct), $targetPath, $false)
        } else {
            $archiveName = $file.storage.archive
            if (-not $opened.ContainsKey($archiveName)) { $opened[$archiveName] = [IO.Compression.ZipFile]::OpenRead((Join-Path $rootPath $archiveName)) }
            $entry = $opened[$archiveName].GetEntry($file.storage.entry)
            if ($null -eq $entry) { $entry = $opened[$archiveName].GetEntry($file.storage.entry.Replace('/', '\')) }
            if ($null -eq $entry) { throw ('Missing ZIP member: ' + $file.storage.entry) }
            $inputStream = $entry.Open()
            $outputStream = [IO.File]::Open($targetPath, [IO.FileMode]::CreateNew)
            try { $inputStream.CopyTo($outputStream) }
            finally { $inputStream.Dispose(); $outputStream.Dispose() }
        }
        if ((Get-Item -LiteralPath $targetPath).Length -ne $file.bytes) { throw ('Restored length mismatch: ' + $file.logical) }
        if ((Get-FileHash -Algorithm SHA256 -LiteralPath $targetPath).Hash.ToLowerInvariant() -ne $file.sha256) { throw ('Restored SHA256 mismatch: ' + $file.logical) }
        $restoredCount++
    }
} finally { foreach ($archive in $opened.Values) { $archive.Dispose() } }
[ordered]@{ verified=$true; restoredFiles=$restoredCount; destination=$destinationPath } | ConvertTo-Json
