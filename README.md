# CENAGEM Registro Monorepo

Plataforma para registrar y hacer seguimiento de familias, casos y turnos genéticos dentro del organismo de salud. El monorepo contiene tanto el portal web usado por los equipos asistenciales como la API que centraliza la lógica clínica-administrativa.

## Stack y arquitectura
- Frontend `cenagem-registro/`: React 19 + Vite 7, React Query, Tailwind y componentes especializados para el flujo de ingreso de casos.
- Backend `cenagem-backend/`: NestJS 11 sobre Node.js 20, Prisma ORM, autenticación basada en JWT y documentación OpenAPI.
- Datos: PostgreSQL 15 con conexión TLS obligatoria.
- Borde: build estático servido por Nginx Windows; las peticiones `/api/*` se proxied hacia el backend (ver `documentation/01-Architecture.md`).

## Estructura del repositorio
```
cenagem-registro/        # App React (Vite) para registro y trazabilidad de casos
cenagem-backend/         # API NestJS + Prisma + generación de OpenAPI
documentation/           # Guías de arquitectura, seguridad y operación
plantillas/              # Insumos auxiliares (cartas, formatos operativos)
scripts/                 # Utilidades (p.ej. generator del wizard de casos)
README.md                # Este documento
```

## Requisitos previos
- Node.js 20.x LTS (incluye npm 10+). Comprueba con `node -v` y `npm -v`.
- Git y acceso al origen del repositorio.
- PostgreSQL 14+ accesible (local o remoto) con credenciales válidas para `DATABASE_URL`.
- Archivos `.env` provistos por el equipo:
  - `cenagem-registro/.env` (variables Vite como `VITE_API_BASE_URL`).
  - `cenagem-backend/.env` (JWT secrets, `DATABASE_URL`, throttling, etc.).
- Opcional: `npm install -g win-node-env` en Windows para manejar `NODE_ENV`.

## Configuración rápida en una nueva PC
1. **Clona o actualiza el repo**
   ```bash
   git clone https://<tu-origen>/CENAGEM.git
   cd CENAGEM
   # o, si ya existe
   git pull
   ```
2. **Variables de entorno**
   - Copia los `.env` compartidos a cada carpeta.
   - Para un backend de prueba puedes ejecutar `cd cenagem-backend && npm run setup:dev-env`, lo que genera `apps/api/.env.local` con secretos aleatorios.
3. **Instala dependencias**
   ```bash
   cd cenagem-registro && npm install
   cd ../cenagem-backend && npm install
   ```
4. **Prepara la base de datos y Prisma (desde `cenagem-backend/`)**
   ```bash
   npm run prisma:generate   # cliente Prisma
   npm run db:push           # aplica el esquema al entorno local
   npm run db:seed           # datos iniciales si están definidos
   ```
   - Usa `npm run db:studio` para inspeccionar datos o `npx prisma migrate deploy` si solo aplicas migraciones ya versionadas.
5. **Levanta los servicios en modo desarrollo**
   ```bash
   # Terminal 1
   cd cenagem-registro && npm run dev     # http://localhost:5173 (por defecto)

   # Terminal 2
   cd cenagem-backend && npm run start:dev   # http://localhost:3000/api/v1
   ```
   Ajusta puertos según tus `.env`. Mantén ambos procesos activos.

## Scripts útiles del día a día
### Frontend (`cenagem-registro`)
- `npm run dev`: servidor Vite en caliente.
- `npm run build`: build productivo listo para Nginx.
- `npm run preview`: prueba local del build optimizado.
- `npm run lint`: reglas eslint compartidas.
- `npm run generate:case-wizard`: regenera tipos para el asistente de nuevos casos a partir de los JSON de configuración en `scripts/`.

### Backend (`cenagem-backend`)
- `npm run start:dev`: backend Nest con watch (API `api/v1`).
- `npm run start:dev:local`: prepara secretos locales y arranca el backend.
- `npm run test`, `npm run test:e2e`, `npm run test:cov`: suites unitarias, e2e y cobertura.
- `npm run lint`: eslint para `apps/` y `libs/`.
- `npm run openapi:sync`: genera el archivo `openapi/cenagem-api.json` y los tipos TypeScript consumidos por el frontend.
- Scripts Prisma (`prisma:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio`) para la capa de datos.

## Calidad y comprobaciones recomendadas
- Ejecuta `npm run lint` y `npm run test` antes de abrir un PR.
- Confirma que el frontend compila (`npm run build`) y que el backend supera `npm run build`.
- Si agregas endpoints, actualiza OpenAPI (`npm run openapi:sync`) y sincroniza los tipos en el frontend.
- Para cambios de esquema Prisma, versiona la migración (`npm run db:migrate`) y documenta cualquier paso manual en `documentation/04-Operations-Runbook.md`.

## Documentación y operación
- Guías profundas en `documentation/`:
  - Arquitectura y topología (`01-Architecture.md`).
  - Seguridad, cumplimiento y runbooks (`02-Security.md`, `04-Operations-Runbook.md`, etc.).
  - Manual de despliegue paso a paso (`03-Deployment-Guide.md`).
- Las plantillas de comunicación y soporte están en `plantillas/`.
- Los procedimientos automatizados (generadores, utilitarios) viven en `scripts/`. Revisa cada script antes de ejecutarlo en producción.

Para dudas operativas, revisa primero `documentation/00-SUMMARY.md` y el runbook correspondiente antes de escalar al equipo de plataforma.
