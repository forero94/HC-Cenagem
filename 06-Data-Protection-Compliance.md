# Cumplimiento Ley 25.326

## Cumplimiento con Ley 25.326
- Registro del banco de datos clínicos ante la AAIP indicando finalidad y responsable.
- Informar a los titulares sobre el tratamiento de datos y canales para ejercer derechos de acceso, rectificación y supresión.
- Contratos de confidencialidad firmados por todo el personal con acceso.

## Principios de minimización
- Formularios de carga solo solicitan datos imprescindibles para la evaluación genética.
- Seudonimización de IDs en logs y reportes; los listados masivos utilizan códigos internos.
- Políticas de retención automatizadas eliminan adjuntos y documentos pasados los plazos clínicos definidos.

## Trazabilidad
- Cada operación se registra con: usuario, rol, timestamp, tipo de entidad y acción. No se almacena el payload completo.
- Auditorías accesibles para Seguridad y Auditoría Médica mediante reportes firmados digitalmente.
- Integridad garantizada mediante hash y almacenamiento en tablas append-only (`AuditLog`).

## Política de retención
- Datos clínicos: 10 años o conforme normativa provincial.
- Logs operativos: 12 meses en SIEM; 90 días en la VM.
- Backups cifrados se eliminan automáticamente según la política definida en `05-Disaster-Recovery.md`.

## Privacidad por diseño
- Autenticación fuerte + roles por mínimo privilegio.
- TLS obligatorio en todos los saltos, base de datos sin exposición externa.
- Revisiones de código para detectar fugas de PII antes de deploy.
- Uso de entornos segregados (dev/qa/prod) con datos anonimizados fuera de producción.
