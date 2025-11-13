# Seguridad

## SSH/RDP
- Instalar OpenSSH Server para Windows y deshabilitar autenticación por contraseña (`PasswordAuthentication no`). Utilizar únicamente claves emitidas por el organismo y almacenadas con protección DPAPI.
- RDP habilitado solo para la red administrativa, obligatorio MFA (smart card o Azure MFA) y NLA.
- Deshabilitar `Administrator` remoto; usar cuentas nominativas con privilegios delegados.

## Políticas de acceso
- Separación de roles: `ops` (despliegue), `secops`, `appviewer`. Todos con memberships auditados en AD.
- Uso de `Just Enough Administration` (JEA) o `LAPS` para credenciales privilegiadas. Accesos temporales registrados en ITSM.
- PostgreSQL: accesos mediante cuentas de servicio (`cenagem_app`) con mínimos privilegios, autenticación TLS.

## Firewall
- Configurar Windows Defender Firewall con reglas entrantes específicas: permitir `TCP 22`, `TCP 80`, `TCP 443`, `TCP 3389` (solo redes autorizadas). Bloquear cualquier otro puerto, especialmente `3000`.
- Crear reglas salientes limitando conexiones a dominios necesarios (ACME, repositorios de parches, PostgreSQL interno).
- Registrar cambios con `netsh advfirewall firewall add rule ... name="CENAGEM HTTPS"` y documentar CIDR autorizados.

## Manejo de secretos (.env)
- Archivo ubicado en `D:\apps\cenagem\.env` con permisos NTFS otorgados solo al grupo `CENAGEM-OPS`.
- Los valores se obtienen del vault institucional (ej. Azure Key Vault, CyberArk). Scripts de despliegue cargan los secretos en variables de entorno antes de iniciar el servicio.
- Rotación semestral de claves JWT y credenciales DB, registrando evidencia en ITSM.

## TLS y configuración HTTPS
- Certificados emitidos por la AC interna o mediante win-acme para Let’s Encrypt, almacenados en `Cert:\LocalMachine\My` y exportados a formato `.pem` para Nginx.
- Habilitar únicamente TLS 1.2/1.3 (`ssl_protocols TLSv1.2 TLSv1.3`), deshabilitar suites inseguras.
- Redirección `http -> https`, cabeceras HSTS, CSP y `X-Content-Type-Options` en Nginx.
- Opcional: MTLS solicitando certificados de cliente para redes internas (`ssl_verify_client optional`).

## Hardening del sistema
- Aplicar baseline CIS Windows Server 2022 / Windows 11 antes de pasar a producción.
- Activar BitLocker con TPM y PIN para todas las unidades.
- Habilitar Windows Defender Credential Guard, tamper protection y EDR corporativo.
- Configurar `AppLocker` o WDAC para limitar ejecución a `nginx.exe`, `node.exe`, scripts firmados.
- Monitorizar integridad con `SConfig`, `Windows Admin Center` o solución SIEM.

## Logs sin datos sensibles
- Backend: configurar Winston/NestJS para registrar únicamente metadata técnica; remover cuerpos de request/response y anonimizar IDs sensibles.
- Nginx: ajustar formato `log_format` para evitar querystrings con PII. Rotar logs mediante `logrotate` para Windows (ej. `nzlogrotate` o script PowerShell) y enviarlos a Event Log/SIEM.
- Auditoría: usar `wevtutil` o agentes (Elastic/SCOM) para reenviar eventos sin payload clínico.
