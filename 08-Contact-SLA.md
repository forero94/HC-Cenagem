# Contacto y SLA

## Roles
- **Product Owner Clínico**: define prioridades funcionales y aprueba cambios.
- **Equipo DevOps**: despliegues, monitoreo y respuesta operativa.
- **Seguridad Informática**: auditorías, gestión de incidentes, custodia de secretos.
- **DBA institucional**: operación y tuning del clúster PostgreSQL.

## Escalamiento
1. Mesa de ayuda Nivel 1 (ticket ITSM).
2. DevOps on-call (Nivel 2) en horario extendido.
3. Seguridad / Arquitectura (Nivel 3) para incidentes severos o compromisos.
4. Dirección de Sistemas en caso de indisponibilidad > 4 h o fuga de datos.

## Severidad
- **S1 Crítico**: caída total o riesgo de pérdida de datos. RTO 2 h, comunicación inmediata.
- **S2 Alto**: funcionalidad clave degradada, sin alternativa manual. RTO 8 h.
- **S3 Medio**: errores menores o tareas planificadas. RTO 3 días hábiles.
- **S4 Bajo**: consultas o mejoras. RTO acordado en backlog.

## Horarios de soporte
- Atención estándar: lunes a viernes 08:00-18:00 ART.
- Guardia pasiva DevOps: 18:00-22:00 ART y fines de semana 09:00-17:00 para S1/S2.
- Incidentes fuera de horario requieren contacto vía teléfono seguro + ticket documentado.
