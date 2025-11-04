# CENAGEM Monorepo

Este repositorio aloja tanto el frontend como el backend del proyecto.

- `cenagem-registro/`: aplicación web construida con Vite/React.
- `cenagem-backend/`: API y servicios desarrollados con NestJS.

## Guía de instalación en una nueva PC

### Prerrequisitos
- Node.js 20 LTS (incluye `npm`). Verifica con `node -v` y `npm -v`.
- Git para clonar el repositorio.
- PostgreSQL 14 o superior en ejecución y accesible. Alternativamente puedes usar un contenedor Docker o un servicio administrado, pero asegúrate de contar con una URL válida para `DATABASE_URL`.
- Acceso a los archivos `.env` provistos por el equipo (no se versionan).

### 1. Clonar o actualizar el repositorio
- Primera instalación:
  ```bash
  git clone https://<tu-origen>/CENAGEM.git
  cd CENAGEM
  ```
- Si ya tienes la carpeta local y solo quieres traer cambios nuevos:
  ```bash
  cd CENAGEM
  git pull
  ```

### 2. Configurar variables de entorno
- Solicita al equipo los archivos `.env` necesarios para `cenagem-registro/` y `cenagem-backend/`.
- Colócalos en cada carpeta correspondiente (por ejemplo, `cenagem-backend/.env`).
- Actualiza valores como `DATABASE_URL` para apuntar a tu instancia local o remota de PostgreSQL.

### 3. Instalar dependencias del frontend
```bash
cd cenagem-registro
npm install
```

### 4. Instalar dependencias del backend
```bash
cd ../cenagem-backend
npm install
```

### 5. Preparar Prisma y la base de datos
- Asegúrate de que tu base de datos esté accesible (por ejemplo, PostgreSQL corriendo en `localhost`).
- Dentro de `cenagem-backend` ejecuta:
  ```bash
  npm run prisma:generate   # genera el cliente de Prisma
  npm run db:push           # sincroniza el esquema con la base de datos local
  npm run db:migrate        # crea/aplica migraciones durante el desarrollo
  npm run db:seed           # carga datos iniciales (si aplica)
  ```
  - Para revisar o editar la base de datos con la interfaz de Prisma:
    ```bash
    npm run db:studio
    ```
  - En entornos donde solo quieras aplicar migraciones existentes (por ejemplo CI/QA/Producción):
    ```bash
    npx prisma migrate deploy
    ```

### 6. Ejecutar los servidores en modo desarrollo
- Frontend:
  ```bash
  cd ../cenagem-registro
  npm run dev
  ```
- Backend:
  ```bash
  cd ../cenagem-backend
  npm run start:dev
  ```

Mantén ambos procesos en ejecución (puedes usar dos terminales). Consulta los archivos `.env` para conocer los puertos configurados y la URL base de la API.

## Flujo de trabajo

Ejecuta los comandos dentro de cada paquete:

- Frontend:
  ```bash
  cd cenagem-registro
  npm install
  npm run dev
  ```
- Backend:
  ```bash
  cd cenagem-backend
  npm install
  npm run start:dev
  ```

Ambos proyectos conservan sus configuraciones locales (`.env*`) fuera del control de versiones.
