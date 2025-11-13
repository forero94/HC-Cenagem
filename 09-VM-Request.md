# Solicitud de VM

## Información general
- Nombre del servicio: CENAGEM Registro
- Sistema operativo requerido: Windows Server 2022 Datacenter/Standard (capaz de ejecutar Nginx y Node.js). A falta de licencias, admitir Windows 11 Enterprise para pilotos cerrados.
- Unidad solicitante: Servicio de Genética / Dirección de Sistemas Clínicos
- Responsable técnico: DevOps designado (ver `08-Contact-SLA.md`).

## Recursos mínimos
| Recurso | Requerido |
| --- | --- |
| vCPU | 4 |
| RAM | 8 GB |
| Disco | 120 GB SSD (C: 80 GB, D: 40 GB) con BitLocker |
| Virtualización | VMware/Hyper-V con soporte TPM virtual |

## Red, DNS y acceso
- Subred DMZ segura, segmentada de usuarios finales.
- DNS: `registro.hospital.gob.ar` (externo) y `registro.intranet.local` (interno).
- Firewall perimetral: habilitar únicamente `80/tcp`, `443/tcp` al público; `22/tcp` (SSH OpenSSH Windows) y `3389/tcp` (RDP) solo para redes administrativas.
- Acceso por jump host con MFA y sesión grabada.

## Certificados
- Solicitar certificados TLS SAN (externo e interno) emitidos por la autoridad institucional; alternativa: habilitar win-acme con permisos para escribir en `Cert:\LocalMachine`.
- Entregar archivo `.pfx` protegido por contraseña al equipo DevOps.

## Políticas internas de acceso
- Registrar el activo en CMDB, asociar Owner, Custodian y Data Steward.
- Dar de alta grupos AD: `GG-CENAGEM-OPS`, `GG-CENAGEM-READ`.
- Aplicar baseline de seguridad Windows Server 2022 (CIS nivel 1) antes de la entrega.
- Incluir agente EDR, monitoreo (SCOM/Sentinel) y backup institucional desde el día 0.
