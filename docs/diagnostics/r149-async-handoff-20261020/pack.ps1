param([Parameter(Mandatory=$true)][string]$Plan)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$records=Get-Content -LiteralPath $Plan -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($group in ($records | Group-Object archive)) {
 $output=Join-Path $PSScriptRoot $group.Name
 if(Test-Path -LiteralPath $output){throw "Refusing existing ZIP: $output"}
 $stream=[IO.File]::Open($output,[IO.FileMode]::CreateNew)
 $zip=New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create,$false)
 try {foreach($row in $group.Group){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$row.source,$row.path,[IO.Compression.CompressionLevel]::Fastest) | Out-Null}}
 finally {$zip.Dispose();$stream.Dispose()}
 Write-Output ($group.Name+' '+[Math]::Round((Get-Item -LiteralPath $output).Length/1MB,1)+' MiB')
}
