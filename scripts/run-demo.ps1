<#
.SYNOPSIS
    Prepara un entorno local plug-and-play para la demo de CENAGEM.

.DESCRIPTION
    - Verifica que Node.js >= 18 esté instalado (lo instala mediante winget si hace falta).
    - Instala y/o detecta PostgreSQL (portable) y deja un servicio Windows listo.
    - Solicita o genera las variables para los archivos .env.
    - Ejecuta npm install en cenagem-backend y cenagem-registro.
    - Crea el usuario y la base de datos destino y ejecuta prisma db:push.
    - Lanza backend (npm run start:dev) y frontend (npm run dev) en nuevas ventanas.

.NOTES
    Ejecuta este script desde Windows PowerShell. Para instalar PostgreSQL se requieren permisos de administrador.
    Puedes compilarlo como .exe con PS2EXE si necesitas distribuirlo.
#>

[CmdletBinding()]
param(
    [switch]$SkipSetup,
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section {
    param([string]$Message)
    Write-Host "`n=== $Message ===`n" -ForegroundColor Cyan
}

function Get-NodeVersion {
    try {
        $raw = node --version 2>$null
        if (-not $raw) { return $null }
        $clean = $raw.Trim().TrimStart('v', 'V')
        return [version]$clean
    } catch {
        return $null
    }
}

function Ensure-Node {
    $requiredMajor = 18
    $current = Get-NodeVersion
    if (-not $current) {
        Write-Section "Node.js no encontrado"
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            Write-Host "Intentando instalar Node.js LTS mediante winget..." -ForegroundColor Yellow
            $arguments = @(
                'install',
                '--exact',
                '--id','OpenJS.NodeJS.LTS',
                '--source','winget',
                '--accept-package-agreements',
                '--accept-source-agreements'
            )
            Start-Process -FilePath 'winget' -ArgumentList $arguments -Wait -NoNewWindow
            $current = Get-NodeVersion
            if (-not $current) {
                throw "No se pudo instalar Node.js automáticamente. Instálalo manualmente y vuelve a ejecutar el script."
            }
        } else {
            throw "Node.js no está instalado y winget no está disponible. Instala Node.js LTS (>=18) y vuelve a ejecutar el script."
        }
    }

    if ($current.Major -lt $requiredMajor) {
        throw "Se detectó Node.js v$current, pero se requiere v$requiredMajor o superior. Actualiza Node.js y vuelve a ejecutar."
    }

    Write-Host "Node.js versión $current detectada." -ForegroundColor Green
}

function Run-NpmInstall {
    param([string]$ProjectPath)

    Write-Host "Instalando dependencias en $ProjectPath..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        npm install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            throw "npm install falló en $ProjectPath (código $LASTEXITCODE). Revisa los mensajes anteriores."
        }
    } finally {
        Pop-Location
    }
}

function ConvertFrom-SecureStringPlain {
    param([System.Security.SecureString]$SecureValue)

    if (-not $SecureValue) { return '' }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode($SecureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringUni($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeGlobalAllocUnicode($ptr)
    }
}

function Get-EnvValue {
    param(
        [string]$Path,
        [string]$Key
    )

    if (-not (Test-Path $Path)) { return $null }
    foreach ($line in Get-Content -Path $Path) {
        if ($line -match '^\s*#') { continue }
        if ($line -notmatch '=') { continue }
        $parts = $line.Split('=', 2)
        if ($parts[0].Trim() -ceq $Key) {
            $value = $parts[1].Trim()
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Trim('"')
            }
            return $value
        }
    }
    return $null
}

function Parse-DatabaseUrl {
    param([string]$Url)

    if (-not $Url) { return $null }
    $trimmed = $Url.Trim()
    if ($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) { $trimmed = $trimmed.Trim('"') }
    if (-not $trimmed.StartsWith('postgresql://')) { return $null }
    $httpUri = 'http://' + $trimmed.Substring('postgresql://'.Length)
    try {
        $uri = [System.Uri]$httpUri
    } catch {
        return $null
    }
    $userInfo = $uri.UserInfo.Split(':', 2)
    $user = if ($userInfo.Length -gt 0) { [System.Uri]::UnescapeDataString($userInfo[0]) } else { '' }
    $password = if ($userInfo.Length -gt 1) { [System.Uri]::UnescapeDataString($userInfo[1]) } else { '' }
    $port = if ($uri.IsDefaultPort) { 5432 } else { $uri.Port }
    return [PSCustomObject]@{
        Host = $uri.Host
        Port = $port
        User = $user
        Password = $password
        Database = $uri.AbsolutePath.TrimStart('/')
        Raw = $trimmed
    }
}

function Read-UserInput {
    param(
        [string]$Label,
        [string]$Default,
        [switch]$Numeric
    )

    while ($true) {
        $prompt = if ($Default) { "$Label [$Default]" } else { $Label }
        $input = Read-Host $prompt
        if ([string]::IsNullOrWhiteSpace($input)) { $input = $Default }
        if ($Numeric) {
            $number = 0
            if ([int]::TryParse($input, [ref]$number) -and $number -gt 0) {
                return $number
            }
            Write-Host "Ingresa un número válido." -ForegroundColor Red
            continue
        }
        return $input.Trim()
    }
}

function Read-Password {
    param(
        [string]$Label,
        [string]$Default,
        [switch]$Confirm
    )

    while ($true) {
        $prompt = if ($Default) { "$Label [por defecto: $Default]" } else { $Label }
        $secure = Read-Host -Prompt $prompt -AsSecureString
        $value = ConvertFrom-SecureStringPlain -SecureValue $secure
        if ([string]::IsNullOrWhiteSpace($value)) { $value = $Default }
        if (-not $value) {
            Write-Host "Ingresa un valor." -ForegroundColor Red
            continue
        }
        if ($Confirm) {
            $secureConfirm = Read-Host -Prompt "Confirma $Label" -AsSecureString
            $valueConfirm = ConvertFrom-SecureStringPlain -SecureValue $secureConfirm
            if ([string]::IsNullOrWhiteSpace($valueConfirm)) { $valueConfirm = $Default }
            if ($value -ne $valueConfirm) {
                Write-Host "Las contraseñas no coinciden, intenta de nuevo." -ForegroundColor Red
                continue
            }
        }
        return $value
    }
}

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]$identity
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-PostgresConnection {
    param(
        [string]$PsqlPath,
        [string]$PgHost,
        [int]$Port,
        [string]$User,
        [string]$Password
    )

    $env:PGPASSWORD = $Password
    try {
        $args = @('-h', $PgHost, '-p', $Port, '-U', $User, '-d', 'postgres', '-t', '-A', '-c', 'SELECT 1;')
        & $PsqlPath @args | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Ensure-Postgres {
    param(
        [string]$InstallRoot,
        [string]$ServiceName,
        [string]$DefaultSuperPassword
    )

    $downloadUrl = 'https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64-binaries.zip'
    $pgsqlRoot = Join-Path $InstallRoot 'pgsql'
    $binPath = Join-Path $pgsqlRoot 'bin'
    $psqlManagedPath = Join-Path $binPath 'psql.exe'
    $pgCtlPath = Join-Path $binPath 'pg_ctl.exe'
    $initdbPath = Join-Path $binPath 'initdb.exe'
    $dataDir = Join-Path $InstallRoot 'data'

    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    $managed = Test-Path $psqlManagedPath
    $psqlPath = $null
    $pgHost = 'localhost'
    $port = 5432
    $superUser = 'postgres'
    $superPassword = $null
    $type = 'external'
    $freshInstall = $false

    if ($managed) {
        $psqlPath = $psqlManagedPath
        $type = 'managed'
    }

    if (-not $psqlPath) {
        $existingPsql = Get-Command psql.exe -ErrorAction SilentlyContinue
        if ($existingPsql) {
            $psqlPath = $existingPsql.Source
            $type = 'external'
            Write-Host "Se detectó una instalación existente de PostgreSQL en $psqlPath." -ForegroundColor Green
        }
    }

    if (-not $psqlPath) {
        if (-not (Test-IsAdministrator)) {
            throw "Se requiere ejecutar PowerShell como administrador para instalar PostgreSQL automáticamente."
        }

        Write-Host "No se encontró PostgreSQL. Se descargará una distribución portable (~60 MB)." -ForegroundColor Yellow
        if (-not (Test-Path $InstallRoot)) {
            New-Item -ItemType Directory -Path $InstallRoot | Out-Null
        }

        $tempZip = Join-Path ([System.IO.Path]::GetTempPath()) ("postgresql-{0}.zip" -f (Get-Random))
        Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip
        if (Test-Path $pgsqlRoot) {
            Remove-Item -Recurse -Force $pgsqlRoot
        }
        Expand-Archive -Path $tempZip -DestinationPath $InstallRoot -Force
        Remove-Item $tempZip

        if (-not (Test-Path $initdbPath)) {
            throw "No se pudo preparar PostgreSQL. Verifica que la descarga ($downloadUrl) siga disponible."
        }

        if (-not (Test-Path $dataDir)) {
            New-Item -ItemType Directory -Path $dataDir | Out-Null
        }

        $superPassword = Read-Password -Label 'Define la contraseña para el usuario administrador de PostgreSQL (postgres)' -Default $DefaultSuperPassword -Confirm
        $pwFile = New-TemporaryFile
        try {
            Set-Content -Path $pwFile.FullName -Value $superPassword -NoNewline -Encoding ASCII
            & $initdbPath -D $dataDir -U $superUser -A password --pwfile $pwFile.FullName --encoding UTF8
            if ($LASTEXITCODE -ne 0) {
                throw "initdb falló (código $LASTEXITCODE)."
            }
        } finally {
            if (Test-Path $pwFile.FullName) { Remove-Item $pwFile.FullName -Force }
        }

        & $pgCtlPath register -N $ServiceName -D $dataDir -w
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo registrar el servicio de PostgreSQL (pg_ctl código $LASTEXITCODE)."
        }

        Start-Service -Name $ServiceName
        $service = Get-Service -Name $ServiceName -ErrorAction Stop
        $service.WaitForStatus('Running', [TimeSpan]::FromSeconds(15))

        $freshInstall = $true
        $managed = $true
        $psqlPath = $psqlManagedPath
        $type = 'managed'

        Write-Host "Instalación portable de PostgreSQL lista (servicio $ServiceName)." -ForegroundColor Green
    } else {
        if ($managed -and -not $service) {
            if (-not (Test-IsAdministrator)) {
                throw "Se requiere administrador para registrar el servicio PostgreSQL ($ServiceName)."
            }
            & $pgCtlPath register -N $ServiceName -D $dataDir -w
            if ($LASTEXITCODE -ne 0) {
                throw "No se pudo registrar el servicio PostgreSQL (pg_ctl código $LASTEXITCODE)."
            }
            $service = Get-Service -Name $ServiceName -ErrorAction Stop
        }
    }

    if ($managed) {
        if ($service.Status -ne 'Running') {
            Start-Service -Name $ServiceName
            $service.WaitForStatus('Running', [TimeSpan]::FromSeconds(15))
        }
    } else {
        Write-Host "Asegúrate de que el servicio de PostgreSQL externo esté ejecutándose." -ForegroundColor Yellow
    }

    if (-not $superPassword) {
        if ($type -eq 'managed' -and $freshInstall) {
            # ya asignado
        } else {
            $superPassword = Read-Password -Label "Contraseña del superusuario de PostgreSQL ($superUser)" -Default $DefaultSuperPassword
        }
    }

    if ($type -eq 'external') {
        $pgHost = Read-UserInput -Label 'Host de PostgreSQL' -Default 'localhost'
        $port = Read-UserInput -Label 'Puerto de PostgreSQL' -Default '5432' -Numeric
        $superUser = Read-UserInput -Label 'Usuario con privilegios para crear bases' -Default 'postgres'
    }

    $attempts = 0
    while ($true) {
        $attempts++
        if (Test-PostgresConnection -PsqlPath $psqlPath -PgHost $pgHost -Port $port -User $superUser -Password $superPassword) {
            break
        }
        if ($attempts -ge 3) {
            throw "No se pudo conectar a PostgreSQL con las credenciales proporcionadas. Revisa el servicio y vuelve a ejecutar el script."
        }
        Write-Host "Credenciales rechazadas. Intenta nuevamente." -ForegroundColor Red
        $superPassword = Read-Password -Label "Contraseña del superusuario $superUser" -Default $superPassword
    }

    return [PSCustomObject]@{
        Type = $type
        Host = $pgHost
        Port = [int]$port
        Superuser = $superUser
        SuperuserPassword = $superPassword
        PsqlPath = $psqlPath
        ManagedInstallPath = if ($managed) { $InstallRoot } else { $null }
        ServiceName = if ($managed) { $ServiceName } else { $null }
        FreshInstall = $freshInstall
    }
}

function Configure-BackendEnv {
    param(
        [string]$EnvPath,
        [pscustomobject]$Defaults,
        [switch]$NonInteractive
    )

    $defaultApiPort = if ($Defaults -and $Defaults.PSObject.Properties.Name -contains 'ApiPort') { $Defaults.ApiPort } else { 3000 }
    $defaultHost = if ($Defaults -and $Defaults.PSObject.Properties.Name -contains 'Host') { $Defaults.Host } else { 'localhost' }
    $defaultPort = if ($Defaults -and $Defaults.PSObject.Properties.Name -contains 'Port') { $Defaults.Port } else { 5432 }
    $defaultDb = if ($Defaults -and $Defaults.PSObject.Properties.Name -contains 'Database') { $Defaults.Database } else { 'cenagem' }
    $defaultUser = if ($Defaults -and $Defaults.PSObject.Properties.Name -contains 'User') { $Defaults.User } else { 'cenagem' }
    $defaultPassword = if ($Defaults -and $Defaults.PSObject.Properties.Name -contains 'Password') { $Defaults.Password } else { 'cenagem_local' }

    if (Test-Path $EnvPath) {
        Write-Host "$EnvPath ya existe. Se usará la configuración guardada." -ForegroundColor Green
        $portValue = Get-EnvValue -Path $EnvPath -Key 'PORT'
        $portValue = if ($portValue) { $portValue } else { $defaultApiPort }
        $databaseUrl = Get-EnvValue -Path $EnvPath -Key 'DATABASE_URL'
        $parsed = Parse-DatabaseUrl -Url $databaseUrl
        if (-not $parsed) {
            $parsed = [PSCustomObject]@{
                Host = $defaultHost
                Port = $defaultPort
                User = $defaultUser
                Password = $defaultPassword
                Database = $defaultDb
                Raw = $databaseUrl
            }
        }

        return [PSCustomObject]@{
            ApiPort = [int]$portValue
            DatabaseHost = $parsed.Host
            DatabasePort = [int]$parsed.Port
            DatabaseName = $parsed.Database
            DatabaseUser = $parsed.User
            DatabasePassword = $parsed.Password
            DatabaseUrl = if ($parsed.Raw) { $parsed.Raw } else { $databaseUrl }
            EnvPath = $EnvPath
            IsNew = $false
        }
    }

    if ($NonInteractive) {
        throw "No existe $EnvPath y no se puede generar en modo no interactivo."
    }

    Write-Host "Configura el backend (presiona Enter para aceptar los valores sugeridos)." -ForegroundColor Yellow

    $apiPort = Read-UserInput -Label 'Puerto para la API backend' -Default "$defaultApiPort" -Numeric
    $dbHost = Read-UserInput -Label 'Host de PostgreSQL' -Default $defaultHost
    $dbPort = Read-UserInput -Label 'Puerto de PostgreSQL' -Default "$defaultPort" -Numeric
    $dbName = Read-UserInput -Label 'Nombre de la base de datos' -Default $defaultDb
    $dbUser = Read-UserInput -Label 'Usuario de la base de datos' -Default $defaultUser
    $dbPassword = Read-Password -Label 'Contraseña de la base de datos' -Default $defaultPassword -Confirm

    $encodedPassword = [System.Uri]::EscapeDataString($dbPassword)
    $databaseUrl = "postgresql://{0}:{1}@{2}:{3}/{4}" -f $dbUser, $encodedPassword, $dbHost, $dbPort, $dbName

    $jwtAccess = ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'))
    $jwtRefresh = ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'))

    $lines = @(
        "PORT=$apiPort",
        "DATABASE_URL=""$databaseUrl""",
        "JWT_ACCESS_SECRET=$jwtAccess",
        "JWT_ACCESS_EXPIRES_IN=15m",
        "JWT_REFRESH_SECRET=$jwtRefresh",
        "JWT_REFRESH_EXPIRES_IN=7d"
    )

    Set-Content -Path $EnvPath -Value $lines -Encoding ASCII
    Write-Host "Se creó $EnvPath con la configuración indicada." -ForegroundColor Green
    Write-Host ("Resumen: Puerto API {0}, base {1} en {2}:{3} usando el usuario {4}." -f $apiPort, $dbName, $dbHost, $dbPort, $dbUser) -ForegroundColor Yellow
    Write-Host "La contraseña no se muestra por seguridad." -ForegroundColor Yellow

    return [PSCustomObject]@{
        ApiPort = [int]$apiPort
        DatabaseHost = $dbHost
        DatabasePort = [int]$dbPort
        DatabaseName = $dbName
        DatabaseUser = $dbUser
        DatabasePassword = $dbPassword
        DatabaseUrl = $databaseUrl
        EnvPath = $EnvPath
        IsNew = $true
    }
}

function Configure-FrontendEnv {
    param(
        [string]$EnvPath,
        [string]$DefaultApiUrl
    )

    if (Test-Path $EnvPath) {
        Write-Host "$EnvPath ya existe. Se usará la configuración guardada." -ForegroundColor Green
        $existingUrl = Get-EnvValue -Path $EnvPath -Key 'VITE_API_URL'
        $existingUrl = if ($existingUrl) { $existingUrl } else { $DefaultApiUrl }
        Write-Host "URL actual para el backend: $existingUrl" -ForegroundColor Yellow
        return [PSCustomObject]@{ ApiUrl = $existingUrl }
    }

    Write-Host "Configura el frontend (presiona Enter para aceptar el valor sugerido)." -ForegroundColor Yellow
    $apiUrl = Read-UserInput -Label 'URL del backend accesible desde el navegador' -Default $DefaultApiUrl

    $lines = @("VITE_API_URL=$apiUrl")
    Set-Content -Path $EnvPath -Value $lines -Encoding ASCII
    Write-Host "Se creó $EnvPath apuntando a $apiUrl." -ForegroundColor Green

    return [PSCustomObject]@{ ApiUrl = $apiUrl }
}

function Ensure-DatabaseUser {
    param(
        [string]$PsqlPath,
        [string]$PgHost,
        [int]$Port,
        [string]$Superuser,
        [string]$SuperuserPassword,
        [string]$DatabaseName,
        [string]$DatabaseUser,
        [string]$DatabasePassword
    )

    if (-not $SuperuserPassword) {
        Write-Host "No se proporcionó contraseña de superusuario, se omite la creación automática de la base." -ForegroundColor Yellow
        return
    }

    $env:PGPASSWORD = $SuperuserPassword
    try {
        $escapedUser = $DatabaseUser.Replace('"', '""')
        $escapedDb = $DatabaseName.Replace('"', '""')
        $escapedPassword = $DatabasePassword.Replace("'", "''")
        $sql = @"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${escapedUser}') THEN
        EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', '${escapedUser}', '${escapedPassword}');
    ELSE
        EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', '${escapedUser}', '${escapedPassword}');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${escapedDb}') THEN
        EXECUTE format('CREATE DATABASE %I OWNER %I', '${escapedDb}', '${escapedUser}');
    ELSE
        EXECUTE format('ALTER DATABASE %I OWNER TO %I', '${escapedDb}', '${escapedUser}');
    END IF;
END;
$$;
"@
        $args = @('-h', $PgHost, '-p', $Port, '-U', $Superuser, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', $sql)
        & $PsqlPath @args
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo crear o actualizar el usuario/base (psql código $LASTEXITCODE)."
        }
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }

    Write-Host "Usuario '$DatabaseUser' y base '$DatabaseName' preparados en PostgreSQL." -ForegroundColor Green
}

function Apply-DatabaseSchema {
    param([string]$ProjectPath)

    Write-Host "Aplicando esquema de base de datos (npm run db:push)..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        npm run db:push
        if ($LASTEXITCODE -ne 0) {
            throw "El comando 'npm run db:push' falló (código $LASTEXITCODE). Verifica la conexión con PostgreSQL y vuelve a intentarlo."
        }

        Write-Host "Sembrando datos de demostración (npm run db:seed)..." -ForegroundColor Yellow
        npm run db:seed
        if ($LASTEXITCODE -ne 0) {
            throw "El comando 'npm run db:seed' falló (código $LASTEXITCODE). Revisa los mensajes anteriores."
        }
    } finally {
        Pop-Location
    }
}

function Start-Project {
    param(
        [string]$ProjectPath,
        [string]$Command,
        [string]$WindowTitle
    )

    $psCommand = "Set-Location `"$ProjectPath`"; $Command"
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $psCommand -WindowStyle Normal -WorkingDirectory $ProjectPath -PassThru | Out-Null
    Write-Host "Lanzado $WindowTitle (`$Command`) en una ventana separada." -ForegroundColor Green
}

Write-Section "Inicializando instalador de demo CENAGEM"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptRoot '..')
Set-Location $repoRoot

$backendPath = Join-Path $repoRoot 'cenagem-backend'
$frontendPath = Join-Path $repoRoot 'cenagem-registro'
$backendEnvPath = Join-Path $backendPath '.env'
$frontendEnvPath = Join-Path $frontendPath '.env'
$postgresInstallRoot = Join-Path $repoRoot 'tools\postgresql'
$postgresServiceName = 'CENAGEMPostgres'

if (-not (Test-Path (Join-Path $backendPath 'package.json'))) {
    throw "No se encontró cenagem-backend en $backendPath. Ejecuta el script desde el repositorio raíz."
}

if (-not (Test-Path (Join-Path $frontendPath 'package.json'))) {
    throw "No se encontró cenagem-registro en $frontendPath. Ejecuta el script desde el repositorio raíz."
}

$backendSettings = [PSCustomObject]@{ ApiPort = 3000 }
$frontendSettings = $null
$pgInfo = $null

if (-not $SkipSetup) {
    Write-Section "Verificando requisitos"
    Ensure-Node

    if (-not $SkipBackend) {
        Write-Section "Instalando / verificando PostgreSQL"
        $pgInfo = Ensure-Postgres -InstallRoot $postgresInstallRoot -ServiceName $postgresServiceName -DefaultSuperPassword 'cenagem_admin'

        Write-Section "Preparando backend"
        $defaults = [PSCustomObject]@{
            ApiPort = 3000
            Host = $pgInfo.Host
            Port = $pgInfo.Port
            Database = 'cenagem'
            User = 'cenagem'
            Password = 'cenagem_local'
        }
        $backendSettings = Configure-BackendEnv -EnvPath $backendEnvPath -Defaults $defaults
        Run-NpmInstall -ProjectPath $backendPath
        if ($pgInfo -and $backendSettings.DatabaseUser -and $backendSettings.DatabasePassword) {
            Ensure-DatabaseUser -PsqlPath $pgInfo.PsqlPath `
                -PgHost $pgInfo.Host `
                -Port $pgInfo.Port `
                -Superuser $pgInfo.Superuser `
                -SuperuserPassword $pgInfo.SuperuserPassword `
                -DatabaseName $backendSettings.DatabaseName `
                -DatabaseUser $backendSettings.DatabaseUser `
                -DatabasePassword $backendSettings.DatabasePassword
        }
        Apply-DatabaseSchema -ProjectPath $backendPath
    } else {
        Write-Host "Omitiendo preparación del backend (--SkipBackend)." -ForegroundColor Yellow
    }

    if (-not $SkipFrontend) {
        Write-Section "Preparando frontend"
        $defaultApiUrl = "http://localhost:{0}" -f $backendSettings.ApiPort
        $frontendSettings = Configure-FrontendEnv -EnvPath $frontendEnvPath -DefaultApiUrl $defaultApiUrl
        Run-NpmInstall -ProjectPath $frontendPath
    } else {
        Write-Host "Omitiendo preparación del frontend (--SkipFrontend)." -ForegroundColor Yellow
    }
} else {
    Write-Host "Omitiendo fase de instalación porque se solicitó --SkipSetup." -ForegroundColor Yellow
    $existingPort = Get-EnvValue -Path $backendEnvPath -Key 'PORT'
    if ($existingPort) {
        $backendSettings = [PSCustomObject]@{ ApiPort = [int]$existingPort }
    }
}

Write-Section "Arrancando aplicaciones"

if (-not $SkipBackend) {
    Start-Project -ProjectPath $backendPath -Command 'npm run start:dev' -WindowTitle 'Backend CENAGEM'
} else {
    Write-Host "Backend omitido (--SkipBackend)." -ForegroundColor Yellow
}

if (-not $SkipFrontend) {
    Start-Project -ProjectPath $frontendPath -Command 'npm run dev' -WindowTitle 'Frontend CENAGEM'
    if (-not $frontendSettings) {
        $frontendUrl = Get-EnvValue -Path $frontendEnvPath -Key 'VITE_API_URL'
        if ($frontendUrl) {
            $frontendSettings = [PSCustomObject]@{ ApiUrl = $frontendUrl }
        }
    }
} else {
    Write-Host "Frontend omitido (--SkipFrontend)." -ForegroundColor Yellow
}

Write-Section "Todo listo"
Write-Host "Backend configurado para puerto $($backendSettings.ApiPort)." -ForegroundColor Green
if ($frontendSettings) {
    Write-Host "Frontend apuntando a $($frontendSettings.ApiUrl)." -ForegroundColor Green
}
if ($pgInfo) {
    Write-Host "PostgreSQL escuchando en $($pgInfo.Host):$($pgInfo.Port)." -ForegroundColor Green
}
Write-Host "Las ventanas de backend y frontend seguirán abiertas hasta que las cierres o presiones Ctrl+C en cada una." -ForegroundColor Green
Write-Host "Si necesitas cambiar credenciales, edita $backendEnvPath y $frontendEnvPath y vuelve a ejecutar este script." -ForegroundColor Green
