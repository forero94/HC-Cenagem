# Resumen ejecutivo

La solución CENAGEM Registro se compone de un frontend React/Vite y un backend NestJS expuesto vía API REST sobre HTTPS. Se despliega en una única VM Windows Server 2022 (o Windows 11 hardened) donde Nginx para Windows actúa como terminación TLS y proxy reverso hacia el servicio Node.js, ejecutado como servicio bajo NSSM. La base de datos PostgreSQL permanece en la red interna del organismo y nunca se expone a internet.

## Objetivo del sistema
- Registrar, gestionar y seguir familias, casos y turnos genéticos dentro del hospital/organismo.
- Centralizar la trazabilidad clínica-administrativa con controles de acceso por rol.
- Proveer reportes y consultas seguras para equipos asistenciales y de gestión.

## Stack tecnológico
- Frontend: React 18 + Vite 5, build estático servido por Nginx Windows.
- Backend: NestJS 10 sobre Node.js 20 LTS, ORM Prisma y autenticación JWT.
- Base de datos: PostgreSQL 15 (clúster interno o servicio PaaS) accesible únicamente desde la red institucional.
- Proxy/terminación TLS: Nginx 1.24 (compilación Windows) con certificados de la autoridad interna o ACME.
- Sistema operativo objetivo: Windows Server 2022 Datacenter/Standard o Windows 11 Enterprise, reforzado según CIS.

## Gestión de secretos
- Los secretos JWT (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) se almacenan en el vault institucional (Azure Key Vault u otro KMS) y se inyectan como variables de entorno durante el despliegue.
- El backend aborta el arranque si cualquiera de esas variables falta o está vacía, evitando que se ejecuten entornos con llaves conocidas.
- Para desarrollo local se puede ejecutar `cd cenagem-backend && npm run setup:dev-env` para generar un archivo `apps/api/.env.local` con valores aleatorios (este archivo está ignorado y no debe subirse); luego `npm run start:dev:local` reutiliza esos secretos.

## Puertos requeridos
| Puerto | Uso | Exposición |
| --- | --- | --- |
| 22/tcp | SSH (OpenSSH para Windows) solo por clave, restringido a red administrativa | Bastión/whitelist |
| 3389/tcp | RDP para administración, permitido solo desde la red interna y con MFA | No público |
| 80/tcp | HTTP para redirección/ACME | Público pero redirige inmediatamente |
| 443/tcp | HTTPS para frontend y API | Público con TLS obligatorio |
| 3000/tcp | Servicio NestJS detrás de Nginx | Solo loopback/local |
| 5432/tcp | PostgreSQL | Subred interna, nunca internet |

## Requisitos mínimos de la VM
- 4 vCPU, 8 GB RAM (permite Node.js, Nginx y agentes de observabilidad).
- Disco SSD 120 GB (C: 80 GB para SO + aplicaciones, D: 40 GB para artefactos y backups locales).
- Windows Server 2022/Windows 11 con últimas actualizaciones y BitLocker habilitado.
- Acceso a red administrativa (RDP/SSH) y a la subred de datos para PostgreSQL.
- Agentes institucionales obligatorios: antivirus corporativo, EDR, monitoreo, backup.

## Esquema general del funcionamiento
1. Los usuarios acceden por HTTPS a Nginx Windows, que sirve el build React y redirige `/api/*` al backend.
2. Nginx valida TLS (con opción MTLS) y aplica cabeceras seguras, rechazando tráfico inseguro.
3. El servicio `CENAGEM Backend` (creado con NSSM) ejecuta Node/NestJS en `127.0.0.1:3000`, conectándose a PostgreSQL por túnel TLS en red privada.
4. PostgreSQL almacena datos clínicos; Prisma aplica migraciones en cada despliegue autorizado.
5. Logs operativos se almacenan en el Visor de eventos y en archivos rotados, sin datos sensibles.

Consideraciones clave: PostgreSQL permanece aislado, TLS es obligatorio end-to-end y los logs nunca registran PII o payloads clínicos.
