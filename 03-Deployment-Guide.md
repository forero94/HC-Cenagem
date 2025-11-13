# Guía de despliegue

## Pasos en Windows Server 2022 / Windows 11
1. **Preparar el sistema**
   ```powershell
   sconfig # aplicar parches, habilitar firewall, configurar hostname
   Install-WindowsFeature -Name OpenSSH-Server
   winget install --id Git.Git -e
   winget install --id OpenJS.NodeJS.LTS -e
   ```
2. **Directorios y cuentas**
   ```powershell
   New-LocalUser -Name cenagem -NoPassword -AccountNeverExpires
   Add-LocalGroupMember -Group "Administrators" -Member ops     # solo durante instalación
   New-Item -ItemType Directory -Path D:\apps\cenagem -Force
   New-Item -ItemType Directory -Path D:\apps\cenagem\releases -Force
   New-Item -ItemType Directory -Path D:\apps\cenagem\www -Force
   ```
3. **Clonar repositorio**
   ```powershell
   cd D:\apps\cenagem\releases
   git clone https://<origen>/CENAGEM.git .\release-YYYYMMDD
   robocopy .\release-YYYYMMDD D:\apps\cenagem\app /MIR
   ```
4. **Instalar dependencias de Node**
   ```powershell
   cd D:\apps\cenagem\app\cenagem-backend
   npm ci
   cd ..\cenagem-registro
   npm ci
   ```

## Instalación de PostgreSQL client, Nginx y git
- PostgreSQL client: descargar instalador oficial o usar `choco install postgresql --params "'/NoService /Password:Dummy'"` y tomar `psql.exe`.
- Nginx Windows: descargar paquete 1.24 desde nginx.org y descomprimir en `C:\nginx`. Registrar como servicio:
  ```powershell
  sc create nginx binPath= "C:\nginx\nginx.exe -p C:\nginx" start= auto
  ```
- Certificados: instalar win-acme `wacs.exe` para obtener y renovar TLS automáticamente (`wacs --target manual --host registro.hospital.gob.ar --installationscript "C:\nginx\install-cert.ps1"`).

## Servicio del backend (NSSM)
1. Instalar NSSM (<https://nssm.cc/download>) y copiar a `C:\nssm\nssm.exe`.
2. Crear servicio:
   ```powershell
   C:\nssm\nssm.exe install "CENAGEM Backend" "C:\Program Files\nodejs\node.exe"
   # Path: C:\Program Files\nodejs\node.exe
   # Arguments: C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js run start:prod
   # Startup directory: D:\apps\cenagem\app\cenagem-backend
   # Environment: AppEnvironmentExtra=DOTENV_PATH=D:\apps\cenagem\.env
   ```
3. Configurar reinicio automático (`nssm set "CENAGEM Backend" AppRestartDelay 5000`).
4. Iniciar y verificar: `Start-Service "CENAGEM Backend"` y `Get-Service "CENAGEM Backend"`.

> Nota: Se mantiene el archivo `plantillas/app-backend.service` para despliegues alternativos en Linux/WSL, según requisitos institucionales.

## Configuración de Nginx (reverse proxy + TLS)
1. Copiar `plantillas/nginx-site.conf` a `C:\nginx\conf\sites-available\cenagem.conf` y ajustar rutas (`root D:/apps/cenagem/www`).
2. Editar `nginx.conf` para incluir `include conf/sites-available/*.conf;`.
3. Probar configuración: `C:\nginx\nginx.exe -t` y reiniciar servicio: `Restart-Service nginx`.
4. Instalar certificados con win-acme o importar `.pfx` entregado por la AC. Actualizar rutas `ssl_certificate` apuntando al PEM exportado.

## Migraciones de DB y build del proyecto
```powershell
# Backend
cd D:\apps\cenagem\app\cenagem-backend
$env:DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npm run build
npm run prisma:generate

# Frontend
cd ..\cenagem-registro
$env:VITE_API_BASE_URL="https://registro.hospital.gob.ar/api/v1"
npm run build
robocopy .\dist D:\apps\cenagem\www /MIR
```
Verificar `DATABASE_URL` con `sslmode=require` y acceso restringido desde la red institucional.

## Tests básicos de verificación
- Salud backend:
  ```powershell
  Invoke-WebRequest https://registro.hospital.gob.ar/api/v1/health -UseBasicParsing
  ```
- Autenticación: enviar POST con credenciales de prueba (no productivas) y validar respuesta 200 con tokens.
- Frontend: abrir `https://registro.hospital.gob.ar` desde navegador institucional comprobando errores en consola.
- Certificados: `Test-TlsConnection -ComputerName registro.hospital.gob.ar -Port 443` y `openssl s_client` desde bastión.
- Servicio: `Get-Service "CENAGEM Backend"`, `Get-Service nginx` deben figurar `Running`.
- Firewall: `Get-NetFirewallRule -DisplayName "CENAGEM*"` confirmar únicamente puertos autorizados.
