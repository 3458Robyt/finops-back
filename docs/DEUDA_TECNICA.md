# Deuda técnica y faltantes — FinOps Inteligente

> Registro autoritativo al 2026-08-03. Cada ítem debe tener estado `ABIERTO`, `BLOQUEADO`,
> `DIFERIDO` o `CERRADO` y evidencia asociada. Los ítems de desarrollo manual no son incidentes.

| ID | Prioridad | Tipo | Estado | Hallazgo / criterio de cierre | Evidencia o siguiente acción |
|---|---|---|---|---|---|
| SEC-001 | Alta | Producción | CERRADO | Verificar técnicamente el enforcement runtime RLS y dejar activación permanente condicionada al despliegue. | Canary 2026-08-03 contra Supabase principal: `finops_runtime`, dos tenants, worker context y cross-tenant cero. Activación permanente/rollback operativo quedan documentados y diferidos hasta tener destino de despliegue. |
| DB-001 | Alta | Supabase | CERRADO | Hardening de funciones y cobertura de índices FK. | 32 migraciones al día; Advisors seguridad sin lints; 27 índices FK presentes. |
| ING-001 | Media | Datos | CERRADO | Scheduler no debe encolar conexiones sin validación/capacidades vigentes. | Validación e invalidación implementadas; se conservaron 5 fallos no asociados a prueba. |
| DEP-001 | Media | Dependencias | CERRADO | Reducir carga OCI y eliminar vulnerabilidades de producción. | Módulos OCI específicos 2.138.0; mediana fría ~2,13 s; audit productivo sin vulnerabilidades. |
| AI-001 | Media | Validación de proveedor | CERRADO | Verificar el flujo real de chat y recomendaciones sin persistir datos de prueba. | Canary 2026-08-03 en schema aislado con `gpt-5.4-mini`: chat/recomendaciones en español, auditor, snapshot canónico, rúbrica, trazas, 3 recomendaciones y ahorros no negativos; 56.184 s y 4.047 tokens estimados. |
| AWS-001 | Alta | Validación cloud | BLOQUEADO | Validar STS/EC2/CloudWatch/Cost Explorer/FOCUS con una cuenta y rol AWS reales. | Falta cuenta/rol externo. Las credenciales bootstrap permiten `AssumeRole`; no son credenciales de tenants. |
| OCI-001 | Media | Redundancia cloud | BLOQUEADO | Habilitar canary read-only de OCI Usage API con policy mínima: `Allow group <group_name> to read usage-report in tenancy`. | FOCUS sigue como fuente primaria; falta aplicar policy en IAM OCI. |
| OPS-001 | Media | Operación | DIFERIDO | Workers, healthchecks, alertas 24/7 y scheduler productivo. | Desarrollo manual aceptado hasta definir despliegue. |
| OPS-002 | Baja | Presupuestos | DIFERIDO | Conectar evaluación periódica de presupuestos a worker/scheduler desplegado. | La evaluación manual funciona durante desarrollo. |
| OPS-003 | Media | Secretos/observabilidad | DIFERIDO | Secret manager externo, rotación formal, logs/alertas centralizados. | Requerido antes de producción pública. |
| FIN-001 | Baja | Alcance FinOps | DIFERIDO | Distribución porcentual de costos compartidos y chargeback contable. | Showback determinístico actual queda fuera de la beta. |
| QA-001 | Baja | Entorno | CERRADO | Integración y E2E reproducibles sin Docker local. | Schema Supabase aislado migrado, probado y eliminado. |
| QA-002 | Media | Validación UI | CERRADO | Smoke autenticado reproducible sin depender de una contraseña real compartida. | Fixtures E2E generan credenciales controladas y cleanup automático. |
| VAL-001 | Media | Rendimiento | CERRADO | Medir realización de valor con 10.000 recomendaciones y 20.000 mediciones. | Benchmark aislado: resumen 459 ms, página 447 ms, exportación 994 ms, EXPLAIN 131 ms. |

## Componentes permanentes del roadmap

1. Gobernanza de releases y configuración.
2. Higiene de datos y jobs operativos.
3. Mantenimiento periódico de Supabase y Advisors.
4. Rendimiento de dependencias y arranque.
5. Calificación periódica del proveedor IA.
6. Operación productiva activable cuando exista destino de despliegue.

## Decisiones de alcance

- FOCUS continúa como fuente operativa primaria; CPU, memoria, red y disco provienen de Monitoring/CloudWatch.
- AWS real y OCI Usage API requieren permisos/cuentas externas; no se simulan para cerrar deuda.
- No se implementa remediación automática cloud.
- Los workers se ejecutan manualmente durante desarrollo.
- El grafo visual fue retirado por baja utilidad y latencia.
- Los documentos históricos no son fuentes de estado; consultar `docs/ESTADO_ACTUAL_FINOPS.md`,
  `docs/ROADMAP_PRODUCTO.md` y `PROGRESO_ROADMAP_FINOPS.md`.

## Historial de cierre

- 2026-08-03: canaries runtime RLS e IA real cerrados técnicamente; activación productiva permanente diferida por falta de despliegue.
- 2026-07-31: hardening Supabase, índices FK, limpieza controlada, scheduler validado y reducción de OCI.
- 2026-07-28: beta integrada con contexto tenant, RLS runtime y workers seguros.
- 2026-07-26: Centro de Realización de Valor y benchmark.
- 2026-07-11: evidencia técnica canónica, auditor IA y aprendizaje por recurso.
