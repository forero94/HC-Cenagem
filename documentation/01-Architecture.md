# Arquitectura lógica y de red

- **Capa de presentación**: build estático React hospedado en `C:\inetpub\cenagem\www` o `D:\apps\cenagem\www` y servido por Nginx Windows.
- **Capa de aplicación**: NestJS (Node.js 20) ejecutándose como servicio Windows (NSSM) escuchando en `127.0.0.1:3000`, expone API REST `/api/v1`.
- **Capa de datos**: PostgreSQL 15 en clúster interno Windows/Linux, accesible únicamente desde subred segura mediante TLS.
- **Capa de borde**: Nginx 1.24 Windows terminando TLS en 443, aplicando cabeceras seguras, limitando tamaño de payload y reenviando al backend en loopback. Puerto 80 reservado para redirección/ACME.
- **Servicios auxiliares**: Certbot/Win-ACME, agentes de monitoreo (SCOM/Elastic Agent), soluciones EDR, backup corporativo.

## Diagrama textual
```
Usuarios HTTPS
    |
[Firewall perimetral] -> abre 80/443 hacia DMZ
    |
[VM Windows Server 2022]
    |-- Nginx (80/443) sirviendo build React y proxy /api -> 127.0.0.1:3000
    |-- Servicio Windows "CENAGEM Backend" (NSSM) -> NestJS
           |-- conexión TLS -> PostgreSQL (red interna)
           |-- logs -> Windows Event Log / SIEM

[PostgreSQL cluster]
    |-- 5432 accesible solo desde subred autorizada
```

## Servicios involucrados
- `nginx.exe` registrado como servicio `nginx`.
- `CENAGEM Backend` (NSSM + node) ejecutando `npm run start:prod`.
- `PostgreSQL` gestionado por el área de datos.
- `win-acme` o AC institucional para certificados.
- Scripts de backup programados en el Programador de tareas.

## Versiones recomendadas
- Windows Server 2022 / Windows 11 Enterprise con parches al día.
- Node.js 20.x LTS (MSI oficial o winget/choco).
- NPM 10.x.
- Nginx 1.24.x para Windows.
- PostgreSQL 15.x.
- win-acme 2.x (si se usa ACME) o herramienta interna para certificados X.509.

## Variables de entorno críticas
| Variable | Descripción | Requerida |
| --- | --- | --- |
| `NODE_ENV` | `production` para habilitar optimizaciones NestJS | Sí |
| `PORT` | Puerto interno del backend (3000) | Sí |
| `API_PAYLOAD_LIMIT` | Tamaño máximo de payload JSON | Opcional |
| `DATABASE_URL` | Cadena PostgreSQL con `sslmode=require` | Sí |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Claves HMAC | Sí |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Vigencia tokens | Sí |
| `VITE_API_BASE_URL` | URL pública para el build | Sí |
| `VITE_API_PORT` / `VITE_API_PREFIX` | Overrides según entorno | Opcional |

Los valores se almacenan cifrados (BitLocker + vault institucional) y se cargan en PowerShell al iniciar el servicio; nunca se publican en repositorios.
