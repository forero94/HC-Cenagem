# CENAGEM Monorepo

Este repositorio aloja tanto el frontend como el backend del proyecto.

- `cenagem-registro/`: aplicación web construida con Vite/React.
- `cenagem-backend/`: API y servicios desarrollados con NestJS.

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
