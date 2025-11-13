param(
    [string]$BackupDir = "D:\backups\cenagem"
)

$ErrorActionPreference = 'Stop'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$output = Join-Path $BackupDir "cenagem-$timestamp.dump"
$log = Join-Path $BackupDir "backup-$timestamp.log"

New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
icacls $BackupDir /inheritance:r /grant 'CENAGEM-OPS:(OI)(CI)F' | Out-Null

"[backup] Iniciando $timestamp" | Tee-Object -FilePath $log -Append
& pg_dump $env:DATABASE_URL --format=custom --compress=9 --file=$output 2>> $log
Get-FileHash -Algorithm SHA256 $output | ForEach-Object { $_.Hash + '  ' + $output } >> (Join-Path $BackupDir 'sha256sums.txt')

"[backup] Archivo generado $output" | Tee-Object -FilePath $log -Append
