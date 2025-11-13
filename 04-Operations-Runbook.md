# Operations Runbook

## Tareas de verificación diaria
- `Get-Service nginx, "CENAGEM Backend"` debe devolver `Running`.
- Revisar dashboard de monitoreo (CPU < 70 %, RAM < 75 %, disco C:/ y D:/ > 20 % libres).
- Ejecutar sonda `Invoke-WebRequest https://registro.hospital.gob.ar/api/v1/health` (< 500 ms).
- Verificar fecha de expiración de certificados con `Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*registro*" }`.
- Revisar Visor de eventos (`Application`, `System`, `Microsoft-Windows-Security-Auditing`) para intentos inválidos SSH/RDP.

## Mantenimiento semanal
- Aplicar parches mediante `sconfig` o WSUS y reiniciar en ventana controlada.
- Respaldar configuración de Nginx y scripts (`Compress-Archive C:\nginx`).
- Ejecutar `npm audit --production` y documentar findings.
- Verificar integridad del build (`Get-FileHash -Algorithm SHA256 D:\apps\cenagem\www\index.html`).
- Revisar crecimiento de base de datos con reporte del DBA.

## Manejo de incidentes
1. **Degradación**: capturar `wevtutil qe Application /q:"*[System[(Provider[@Name='CENAGEM']]]])" /c:100 /f:text`, revisar `nssm` logs, reiniciar servicio solo si se identifica causa.
2. **Caída total**: desconectar la VM del balanceador/firewall, restaurar último snapshot y seguir plan de rollback.
3. **Compromiso de seguridad**: aislar host (firewall bloqueado), revocar certificados, rotar secretos y notificar al CSIRT.
4. **Problemas de DB**: escalar al DBA, nunca acceder directamente a datos sensibles fuera de PostgreSQL.

## Comandos clave
- Servicios: `Get-Service nginx`, `Get-Service "CENAGEM Backend"`, `Restart-Service nginx`.
- Log Nginx: `Get-Content C:\nginx\logs\error.log -Tail 200 -Wait`.
- Log backend: `Get-Content D:\apps\cenagem\logs\backend.log -Tail 200 -Wait` (sin PII).
- Uso disco: `Get-PSDrive -PSProvider FileSystem` o `Get-Volume`.
- Firewall: `Get-NetFirewallRule -DisplayGroup "CENAGEM" | Format-Table`.
- Base de datos: `psql "%DATABASE_URL%" -c "select count(*) from \"Family\";"` (solo lectura diagnóstica).
