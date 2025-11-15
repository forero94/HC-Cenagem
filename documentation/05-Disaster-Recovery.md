# Disaster Recovery

## Política de backups
- `pg_dump` lógico programado vía Programador de tareas ejecutando `plantillas/backup-database.ps1` (ver scripts). Archivos cifrados con `Protect-CmsMessage` o AES256 antes de enviarse a almacenamiento seguro.
- Snapshots de la VM y export de certificados TLS (`.pfx`) diarios mediante infraestructura de virtualización.
- Respaldo del build estático y configuración Nginx en repositorio de configuración cifrado.

## Scripts de ejemplo
- `plantillas/backup-database.ps1` y `plantillas/restore-database.ps1` para automatizar backups/restauraciones en Windows (Programador de tareas).
- `plantillas/backup-database.sh` / `restore-database.sh` disponibles para entornos Linux/WSL, manteniendo paridad operativa.

## Retención
- Diario: 14 días de backups lógicos.
- Semanal: 6 puntos completos.
- Mensual: 12 copias para auditoría de la Ley 25.326.
- Todos los artefactos cifrados y etiquetados con hash SHA256.

## Proceso de restauración
1. Activar plan DR y notificar a Infraestructura/Seguridad.
2. Provisionar VM Windows limpia siguiendo `09-VM-Request.md`.
3. Reinstalar dependencias (Node.js, Git, Nginx) y restaurar `D:\apps\cenagem` desde respaldo.
4. Recuperar `.env` desde el vault (requiere doble autorización).
5. Restaurar base de datos:
   ```powershell
   pg_restore --clean --no-owner --dbname "postgresql://.../cenagem" .\backups\cenagem-latest.dump
   ```
6. Ejecutar `npx prisma migrate deploy` para asegurar consistencia.
7. Desplegar build estático y reiniciar servicios `nginx` y `CENAGEM Backend`.
8. Realizar pruebas funcionales, validar TLS y documentar RTO/RPO antes de reabrir tráfico.

## Validación trimestral
- Ensayar restauración completa en ambiente de contingencia Windows, incluyendo recuperación de certificados y claves.
- Registrar tiempos medidos, incidentes y acciones de mejora en el Comité de Continuidad Operativa.
- Revisar scripts de backup/restore y actualizar credenciales de servicio.
