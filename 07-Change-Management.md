# Gestión de cambios

## Versionado
- Versionado semántico (`vMAJOR.MINOR.PATCH`) publicado en el repositorio interno.
- Cada release incluye changelog firmado digitalmente y hash de commit.
- Tags protegidos; solo responsables designados pueden promover una versión a producción.

## Gitflow
- Ramas permanentes: `main` (producción), `develop` (integración).
- Feature branches (`feature/<ticket>`) y hotfix (`hotfix/<ticket>`) deben pasar por revisión y pipeline CI (lint, tests, build).
- Merge a `main` exige aprobación doble (equipo técnico + responsable funcional) y ejecución automática de pruebas end-to-end.

## Auditoría de cambios
- Registro automático en el sistema ITSM del organismo (código de cambio, fecha, impacto, aprobadores).
- Evidencia adjunta: resultados de CI, reporte de pruebas, evaluación de seguridad.
- Logs de despliegue (output de `systemctl status`, `npx prisma migrate deploy`) almacenados por 12 meses.

## Plan de rollback
1. Identificar release anterior estable (`vX.Y.Z`).
2. Restaurar build y dependencias desde el paquete firmado guardado en artefactos.
3. Ejecutar `pg_restore` de backup previo al cambio si hubo migraciones destructivas.
4. Revertir secretos si se rotaron durante el despliegue.
5. Documentar lecciones aprendidas y crear ticket de corrección antes de volver a desplegar.
