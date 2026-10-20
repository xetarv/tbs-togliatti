param([string]$Root=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path,[switch]$ApplyShaderChecks,[switch]$WithoutOldArchives)
$ErrorActionPreference='Stop'
$Root=[IO.Path]::GetFullPath($Root).TrimEnd('\','/')
Add-Type -AssemblyName System.IO.Compression.FileSystem
$m=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
function Destination([string]$relative){
 $full=[IO.Path]::GetFullPath((Join-Path $Root $relative))
 if(-not $full.StartsWith($Root+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw "Unsafe ZIP path: $relative"}
 return $full
}
$archives=@()
if(-not $WithoutOldArchives){foreach($a in $m.publishedArchives){$archives+=@{file=(Join-Path $Root $a.path);sha=$a.sha256}}}
foreach($a in $m.archives){$archives+=@{file=(Join-Path $PSScriptRoot $a.name);sha=$a.sha256}}
foreach($a in $archives){
 if((Hash $a.file) -ne $a.sha){throw "ZIP hash mismatch: $($a.file)"}
 $zip=[IO.Compression.ZipFile]::OpenRead($a.file)
 try {foreach($entry in $zip.Entries){
  if($entry.FullName.EndsWith('/')){continue}
  if($entry.FullName -match '(?i)(^|/)(profiles?|node_modules|\.git)(/|$)'){throw 'Unexpected private directory in ZIP'}
  $dest=Destination $entry.FullName
  $input=$entry.Open();$sha=[Security.Cryptography.SHA256]::Create()
  try{$expected=([BitConverter]::ToString($sha.ComputeHash($input))).Replace('-','').ToLowerInvariant()}finally{$input.Dispose();$sha.Dispose()}
  if(Test-Path -LiteralPath $dest){if((Hash $dest) -ne $expected){throw "Existing different file preserved; stop: $dest"};continue}
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest)) | Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$dest,$false)
  if((Hash $dest) -ne $expected){throw "Extracted bytes mismatch: $dest"}
 }}finally{$zip.Dispose()}
}
foreach($f in $m.files){if((Hash (Destination $f.path)) -ne $f.sha256){throw "Payload mismatch: $($f.path)"}}
if($ApplyShaderChecks){
 Push-Location $Root
 try {if(@(git status --porcelain).Count -ne 0){throw 'ApplyShaderChecks requires a clean dedicated worktree; no local work overwritten'}}finally{Pop-Location}
 foreach($p in $m.shaderChecks){$src=Destination ('artifacts/r149-handoff-inputs-20261020/shaderChecks/'+$p);$dest=Destination $p;[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest)) | Out-Null;[IO.File]::Copy($src,$dest,$true)}
}
Write-Output ('Verified extraction: '+$m.files.Count+' current files; original differing files are never overwritten. Run node prepare-portable.cjs next.')
