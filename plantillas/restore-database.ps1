param(
    [Parameter(Mandatory=$true)][string]$DumpFile
)

$ErrorActionPreference = 'Stop'
$confirmation = Read-Host 'Confirma restaurar en este entorno (si/no)'
if ($confirmation -ne 'si') {
    Write-Host 'Restauración cancelada'
    exit 1
}

Stop-Service "CENAGEM Backend" -ErrorAction SilentlyContinue

& pg_restore --clean --if-exists --no-owner --dbname $env:DATABASE_URL $DumpFile

Set-Location D:\apps\cenagem\app\cenagem-backend
npm run prisma:migrate deploy

Start-Service "CENAGEM Backend"
Write-Host "[restore] Completado"
