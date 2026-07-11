# Deuda técnica y faltantes — FinOps Inteligente

> Registro único de hallazgos. Durante desarrollo se prioriza funcionalidad; los ítems de producción se corrigen antes del despliegue público.

| ID | Prioridad | Tipo | Estado | Hallazgo | Criterio de cierre | Momento objetivo |
|---|---|---|---|---|---|---|
| SEC-001 | Alta | Producción | Registrado | Tablas públicas de Supabase sin RLS | Acceso externo bloqueado, RLS por tenant y pruebas cross-tenant aprobadas | Antes de despliegue público |
| OPS-001 | Media | Operación | Aceptado en desarrollo | Backend y workers se ejecutan manualmente | Worker desplegado con healthcheck y alerta de atraso | Fase de despliegue |
| ING-001 | Media | Datos | Registrado | Jobs históricos pendientes o fallidos por configuración de prueba | Configuración validada y jobs históricos cerrados | Antes de onboarding de cliente |
| DEP-001 | Media | Dependencias | Registrado | Alertas moderadas transitivas de OCI SDK y Prisma | Actualización o reducción controlada sin regresiones | Hardening productivo |
| DOC-001 | Baja | Documentación | En curso | Documentos antiguos contienen estados superados | Estado actual y roadmap sin contradicciones | Esta etapa |

## Regla de mantenimiento

- Cada bug o faltante encontrado se registra aquí antes de posponerlo.
- Un ítem solo pasa a `Cerrado` con evidencia de prueba, CI o verificación manual documentada.
- Los ítems aceptados en desarrollo no deben presentarse como incidentes mientras la aplicación se ejecute manualmente.

## Cierre de inteligencia por recurso — 2026-07-11

La etapa no deja deuda funcional adicional: el aislamiento, la evidencia y el flujo E2E se validan en CI. Los ítems de esta tabla permanecen abiertos porque corresponden a producción, datos reales o documentación histórica, no a la rebanada funcional cerrada.
