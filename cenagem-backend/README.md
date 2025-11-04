# CENAGEM Backend

NestJS + TypeScript workspace that powers the registration and case management platform.  
It follows a modular architecture designed to keep domain logic, shared utilities, and infrastructure concerns isolated.

## Tech Stack

- NestJS 11 with strict TypeScript.
- PostgreSQL via Prisma ORM (see `prisma/schema.prisma`).
- JWT authentication + Passport guards with argon2 password hashing.
- Role & permission metadata guards (`@Roles`, `@Permissions`) backed by Prisma.
- OpenAPI docs via `@nestjs/swagger`.
- Global configuration module with validated environment variables.
- Rate limiting and validation pipelines baked in.

## Project Layout

```
cenagem-backend/
├── apps/
│   └── api/              # HTTP application entrypoint
│       ├── src/
│       │   ├── app/      # Composition root (controllers/services shared app-wide)
│       │   ├── config/   # Typed configuration + env validation
│       │   └── modules/  # Vertical feature modules (auth, users, roles, audit, …)
│       └── test/         # API e2e tests
├── libs/
│   ├── common/           # Auth decorators, metadata constants, shared DTOs
│   ├── domain/           # Core domain logic, aggregates (placeholder)
│   └── infrastructure/   # Technical adapters (Prisma DB module, cache, queues)
└── prisma/               # Prisma schema & migrations
```

## Getting Started

```bash
cd cenagem-backend
npm install
npm run build:libs            # compila libs/common, libs/domain, libs/infrastructure
cp .env.example .env             # adjust DATABASE_URL/PORT/JWT secrets
npm run start:dev                # http://localhost:3000/api/v1
```

Swagger UI lives at `http://localhost:3000/docs` and updates automatically in dev.

## NPM Scripts

- `npm run build:libs` – compila las librerías internas una vez (se ejecuta automáticamente antes de `build` y `start:*`).
- `npm run start:dev` – auto-reloading API (`apps/api`).
- `npm run lint` – ESLint over apps/libs.
- `npm run test` – unit tests (Jest).
- `npm run test:e2e` – e2e tests in `apps/api/test`.
- `npm run build` – compile to `dist/`.
- `npm run db:push` – `prisma db push`.
- `npm run db:migrate` – `prisma migrate dev`.
- `npm run db:seed` – ejecuta el seed de Prisma (`prisma/seed.ts`) con roles y usuarios demo.
- `npm run db:studio` – launch Prisma Studio.

> The Prisma helpers above expect a running PostgreSQL instance reachable through `DATABASE_URL`.

## Identity & Access

- `POST /api/v1/auth/login` – e-mail/password login, returns access/refresh JWT pair.
- `POST /api/v1/auth/refresh` – exchange a valid refresh token for a new pair (rotates server session).
- `POST /api/v1/auth/logout` – revokes the active session (requires bearer token).
- `GET /api/v1/users/me` – current profile. Admin endpoints for listing users, assigning roles, and toggling status live under `/api/v1/users/*`.
- `GET /api/v1/roles` + CRUD – manage role definitions and permission bundles.
- Audit events (`auth.login`, `user.create`, `role.update`, …) are stored in `AuditLog` for traceability.

Required secrets live in `.env.example` (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, expiration windows).  
Swagger documents protected routes with `BearerAuth`; use the access token returned from login.

### Credenciales demo

El seed por defecto crea las siguientes cuentas activas (todas con la contraseña `12345678`):

- `admin`
- `medico`
- `admision`

## Next Steps

1. Run `npm run db:migrate` after adjusting the Prisma schema or adding seed roles/users.
2. Ejecuta `npm run db:seed` para regenerar los roles y usuarios demo cuando haga falta.
3. Expose catalogue endpoints the frontend wizard requires and migrate case workflows into `CasesModule`.
4. Expand audit coverage (e.g., case lifecycle events) by injecting `AuditService` where mutations happen.

## Tooling Notes

- `ConfigModule` loads `.env.local` first, then `.env`, and validates via `class-validator`.
- API versioning is URI-based; all routes are served under `/api/v1/*`.
- `PrismaModule` is global, so the `PrismaService` is injectable from any feature module.
- Mark public endpoints with `@Public()`; `JwtAuthGuard` + `RolesGuard` are global otherwise.

Feel free to extend the workspace with more Nest applications (e.g., background workers) or additional libraries – just register them in `nest-cli.json`.

> Tip: si estás iterando dentro de alguna librería (`libs/common`, `libs/domain`, `libs/infrastructure`) podés abrir otra terminal y ejecutar `npx nest build <lib> --watch` para regenerar los `.d.ts` mientras desarrollás.
