# Evidencia de aceptación — Onboarding cloud

> Corte verificado: 2026-07-16. Este documento no sustituye `ONBOARDING_CLOUD.md`; registra la
> evidencia de cierre y los límites del entorno local.

## Resultado de verificaciones

| Verificación | Resultado |
|---|---|
| Backend | 46 archivos y 203 pruebas; typecheck y build aprobados |
| IA offline | 2 archivos y 16 escenarios aprobados |
| Frontend | lint y build aprobados; bundle principal 499.76 kB (141.57 kB gzip) |
| Integración PostgreSQL | 2 archivos y 3 pruebas aprobados en schema Supabase efímero |
| Playwright | shell de login y flujo completo con login, tenants, módulos, recomendación y ejecución aprobados |
| API | 9 lecturas operativas, 13 mutaciones de viewer denegadas y lectura cross-tenant oculta |
| OCI real | IDENTITY, INVENTORY, METRICS y STORAGE disponibles; COSTS denegado; estado PARTIAL coherente |
| FOCUS OCI | 1 ubicación, 20 objetos descubiertos y 0 errores de preview |
| Supabase | 21 migraciones aplicadas; índice de ventana activa presente; 0 grants PostgREST de bypass |
| Secretos | Sin hallazgos reales en cambios; solo URI de Docker local y placeholder PEM |

## Criterios finales

| # | Criterio | Estado | Evidencia principal |
|---:|---|---|---|
| 1 | Iniciar onboarding desde UI | Verificado | Smoke browser autenticado abre Ingesta y el flujo por pasos |
| 2 | Seleccionar tenant permitido | Verificado | API y UI muestran `OCI Personal Demo` y `TAK Colombia` |
| 3 | Crear conexión OCI/AWS | Verificado con pruebas | Formulario, ruta y servicio cubiertos; no se creó una conexión de prueba en Supabase |
| 4 | Registrar credencial sin scripts | Verificado con pruebas | UI/API operativa y prueba de flujo de servicio |
| 5 | Credencial cifrada | Verificado | `CredentialCipher` y repositorio de credenciales |
| 6 | Ningún endpoint expone el secreto | Verificado | Mapper con lista positiva, prueba recursiva y smoke del payload |
| 7 | Capacidades independientes | Verificado real OCI | Canary por IDENTITY/INVENTORY/COSTS/METRICS/STORAGE |
| 8 | Errores con acción correctiva | Verificado | Readiness estructurado y mensajes en español |
| 9 | AUTO, FOCUS y API directa | Verificado con pruebas | Contratos y flujo encadenado de configuración |
| 10 | Inventario, costos, métricas y backfill | Verificado | Activación inicial y backfill técnico persistente existentes |
| 11 | Operaciones largas mediante jobs | Verificado | Activación responde 202 y crea ventanas persistentes |
| 12 | Reintentos sin duplicados | Verificado | Índice parcial, recuperación P2002 y pruebas de cobertura |
| 13 | Readiness refleja estado real | Verificado real OCI | PARTIAL por única capacidad COSTS denegada |
| 14 | Onboarding reanudable | Verificado | Detalle derivado de conexión, credencial, jobs y readiness |
| 15 | Cruce por identificadores confiables | Verificado con pruebas | Inventario y métricas conservan tenant, conexión y externalResourceId |
| 16 | Datos visibles en módulos operativos | Verificado | 9 lecturas API y Dashboard real sin `operation failed` |
| 17 | IA bloquea evidencia débil | Verificado | 16 escenarios offline de generación/auditoría |
| 18 | Aislamiento entre tenants | Verificado | Lectura ajena 404 y 13 mutaciones viewer 403 |
| 19 | OCI Personal Demo sin regresiones | Verificado | Smoke API, Dashboard browser y onboarding OCI real |
| 20 | Todas las verificaciones backend/frontend | Verificado | Suite, integración aislada, builds, smoke y Playwright completo aprobados |
| 21 | Roadmap y progreso actualizados | Verificado | Roadmap, progreso, deuda y guía autoritativa actualizados |
| 22 | Bloqueos externos registrados | Verificado | AWS-001, OCI-001, PERF-001, QA-001 y QA-002 |
| 23 | Sin filtración de secretos | Verificado | Escaneo de diff y sanitización de metadata pública |
| 24 | Sin segunda arquitectura de ingesta | Verificado | Se reutilizan conexiones, providers SDK, scheduler, worker y jobs existentes |
| 25 | Flujo entendible sin conocer el código | Verificado estructuralmente | Pasos 1–7, estados, acciones y troubleshooting en español |

## Aislamiento de la verificación

La prueba integral creó `finops_e2e_goal_20260716`, aplicó las 21 migraciones, ejecutó fixtures,
integración y Playwright, limpió los tenants de prueba y eliminó el schema. Una consulta posterior
confirmó que el schema ya no existe.

La contraseña del administrador maestro real no se modificó. El smoke read-only adicional utilizó
un JWT efímero, eliminado al terminar, para validar `OCI Personal Demo` sin alterar credenciales.
