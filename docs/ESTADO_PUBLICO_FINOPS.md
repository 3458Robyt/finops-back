# Estado público del proyecto FinOps

> Instantánea pública del backlog y tablero de control. La fuente operativa de seguimiento continúa siendo Azure DevOps.

**Última actualización de esta instantánea:** 2026-09-02 23:10

## Enlaces de consulta

- [Dashboard de avance en Azure DevOps](https://dev.azure.com/decentenog/FinOps%20-%20PG/_dashboards/dashboard/adab8dd6-8582-4f11-9140-49b7f4ce3ef1) — requiere iniciar sesión.
- [Tablero Kanban en Azure DevOps](https://dev.azure.com/decentenog/FinOps%20-%20PG/_boards/board/t/FinOps%20-%20PG%20Team/Stories) — requiere iniciar sesión.
- [Repositorio backend público](https://github.com/3458Robyt/finops-back)
- [Repositorio frontend público](https://github.com/3458Robyt/finops---front)

## Resumen

- **Total de elementos:** 71
- **Active:** 8
- **Closed:** 47
- **New:** 16

### Tipos de elemento

| Tipo | Cantidad |
|---|---:|
| Epic | 5 |
| Feature | 10 |
| Task | 16 |
| User Story | 40 |

## Backlog visible

Los correos y etiquetas internas de reconstrucción fueron excluidos de esta copia pública.

| ID | Tipo | Título | Responsable | Estado | Etiquetas |
|---:|---|---|---|---|---|
| 2 | User Story | Autenticación inicial y selección de rol | David Esteban Centeno Gutierrez | Closed | Area-Auth · Evidence-Verified |
| 3 | User Story | Dashboard FinOps de costos, ahorro y ROI | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Analytics · Evidence-Verified |
| 4 | User Story | Consola técnica de recursos y costos | David Esteban Centeno Gutierrez | Closed | Area-Analytics · Area-Metrics · Evidence-Verified |
| 5 | User Story | Detalle de recurso, evidencia y plan de ejecución | David Esteban Centeno Gutierrez | Closed | Area-Governance · Evidence-Verified |
| 6 | User Story | Asistente IA conectado, contextual y en español | David Esteban Centeno Gutierrez | Closed | Area-AI · Evidence-Verified |
| 7 | User Story | Historial, gobernanza y configuración | David Esteban Centeno Gutierrez | Closed | Area-Governance · Evidence-Verified |
| 9 | User Story | Modelo PostgreSQL/Prisma multi-tenant y migraciones | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Ingestion · Evidence-Verified |
| 10 | User Story | API REST, JWT/refresh, RBAC, RLS y seguridad HTTP | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Auth · Area-Ops · Evidence-Verified |
| 11 | User Story | Credenciales cloud cifradas y validación de capacidades | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Auth · Area-Ingestion · Evidence-Verified |
| 13 | User Story | Arquitectura de proveedores OCI/AWS | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-AWS · Provider-OCI |
| 14 | User Story | Conector AWS preparado para validación real | David Esteban Centeno Gutierrez | Active | Area-Ingestion · Blocked-External · Provider-AWS |
| 15 | User Story | Jobs durables, workers y scheduler de ingesta | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-OCI |
| 17 | User Story | Motor determinístico de oportunidades y evidencia técnica | David Esteban Centeno Gutierrez | Closed | Area-AI · Area-Analytics · Evidence-Verified |
| 18 | User Story | Agente IA OpenAI-compatible, auditor y aprendizaje | Luisa Manuela Alejandra Rincon Saens | Closed | Area-AI · Evidence-Verified |
| 20 | User Story | Aprobación, rechazo y aprendizaje asíncrono | David Esteban Centeno Gutierrez | Closed | Area-AI · Area-Governance · Evidence-Verified |
| 21 | User Story | Planes auditados y ejecución manual gobernada | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Governance · Evidence-Verified |
| 22 | User Story | Trazabilidad, auditoría y ahorro verificado | David Esteban Centeno Gutierrez | Closed | Area-Analytics · Area-Governance · Evidence-Verified |
| 24 | User Story | Correo SMTP directo, preferencias y notificaciones | David Esteban Centeno Gutierrez | Closed | Area-Messaging · Evidence-Verified · Provider-Neutral |
| 25 | User Story | Telegram multi-tenant para técnicos y clientes | David Esteban Centeno Gutierrez | Closed | Area-Messaging · Evidence-Verified · Provider-Neutral |
| 27 | User Story | Contenedores y PostgreSQL local reproducible | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Ops · Evidence-Verified · Provider-Neutral |
| 28 | User Story | CI/CD, quality gates y suites E2E | David Esteban Centeno Gutierrez | Closed | Area-Ops · Evidence-Verified |
| 49 | Task | definir roles | Sin asignar | Closed | — |
| 50 | Epic | Plataforma y experiencia multi-tenant | David Esteban Centeno Gutierrez | Closed | Area-Auth · Evidence-Verified |
| 51 | Feature | Experiencia web, autenticación y navegación | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Auth · Evidence-Verified |
| 52 | User Story | Administración maestra de tenants y administradores | David Esteban Centeno Gutierrez | Closed | Area-Auth · Evidence-Verified |
| 53 | User Story | Selector multi-tenant y rotación segura de sesión | David Esteban Centeno Gutierrez | Closed | Area-Auth · Evidence-Verified |
| 54 | User Story | Portal cliente con acceso restringido por tenant | David Esteban Centeno Gutierrez | Closed | Area-Auth · Evidence-Verified |
| 55 | User Story | Onboarding OCI guiado por tenant | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-OCI |
| 56 | Epic | Datos cloud, inventario e ingesta | David Esteban Centeno Gutierrez | Active | Area-Ingestion · Provider-OCI |
| 57 | Feature | Modelo de datos, seguridad e inventario | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-Neutral |
| 58 | User Story | Inventario OCI normalizado y nombres de recursos | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-OCI |
| 59 | Feature | Proveedores, jobs, FOCUS y calidad de datos | David Esteban Centeno Gutierrez | Active | Area-Ingestion · P1 · Provider-OCI |
| 60 | Task | Obtener Role ARN, External ID y policy de solo lectura | David Esteban Centeno Gutierrez | New | Blocked-External · P1 · Provider-AWS |
| 61 | Task | Ejecutar canary STS/EC2/EBS/CloudWatch/Cost Explorer/FOCUS | David Esteban Centeno Gutierrez | New | Blocked-External · P1 · Provider-AWS |
| 62 | Task | Validar normalización y ausencia de duplicados AWS | Luisa Manuela Alejandra Rincon Saens | New | Blocked-External · P1 · Provider-AWS |
| 63 | User Story | Ingesta OCI Monitoring raw-first y rollups | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-OCI |
| 64 | User Story | Ingesta FOCUS paginada, moneda y cobertura de 90 días | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-OCI |
| 65 | User Story | Administración central de jobs, leases y cancelaciones | David Esteban Centeno Gutierrez | Closed | Area-Ingestion · Evidence-Verified · Provider-Neutral |
| 66 | User Story | Cobertura y calidad de datos de Tak 2.0 | David Esteban Centeno Gutierrez | Active | Area-Ingestion · P1 · Provider-OCI |
| 67 | Task | Auditar gaps por día, recurso, métrica y job | David Esteban Centeno Gutierrez | New | Area-Ingestion · P1 |
| 68 | Task | Completar inventario para costos sin recurso enlazado | David Esteban Centeno Gutierrez | New | Area-Ingestion · P1 |
| 69 | Task | Continuar backfill sobre ventanas NO_DATA/PARTIAL | David Esteban Centeno Gutierrez | New | Area-Ingestion · P1 |
| 70 | Task | Verificar FOCUS actual y watermarks | Luisa Manuela Alejandra Rincon Saens | New | Area-Ingestion · P1 |
| 71 | Epic | Analítica FinOps y métricas técnicas | David Esteban Centeno Gutierrez | Closed | Area-Analytics · Area-Metrics · Evidence-Verified |
| 72 | Feature | Costos, presupuestos y asignación | David Esteban Centeno Gutierrez | Closed | Area-Analytics · Evidence-Verified · Provider-Neutral |
| 73 | User Story | Presupuestos, forecast y alertas | David Esteban Centeno Gutierrez | Closed | Area-Analytics · Evidence-Verified |
| 74 | User Story | Asignación, showback y costos compartidos auditables | David Esteban Centeno Gutierrez | Closed | Area-Analytics · Area-Governance · Evidence-Verified |
| 75 | Feature | Métricas técnicas, estadísticas y rendimiento | David Esteban Centeno Gutierrez | Closed | Area-Metrics · Evidence-Verified · Provider-OCI |
| 76 | User Story | Métricas uPlot, Mean/Min/Max/P95 y drilldown | David Esteban Centeno Gutierrez | Closed | Area-Metrics · Evidence-Verified · Provider-OCI |
| 77 | Epic | IA, recomendaciones y realización de valor | David Esteban Centeno Gutierrez | Closed | Area-AI · Area-Governance · Evidence-Verified |
| 78 | Feature | Generación, evidencia, auditoría y aprendizaje | David Esteban Centeno Gutierrez | Closed | Area-AI · Evidence-Verified |
| 79 | User Story | Generación durable de recomendaciones y readiness | David Esteban Centeno Gutierrez | Closed | Area-AI · Evidence-Verified |
| 80 | User Story | Escenarios dorados y reporte de calidad IA | Luisa Manuela Alejandra Rincon Saens | Closed | Area-AI · Evidence-Verified |
| 81 | Feature | Decisiones, planes, ejecución y ahorro verificado | David Esteban Centeno Gutierrez | Closed | Area-Governance · Evidence-Verified |
| 82 | User Story | Centro de realización de valor y ahorro verificado | David Esteban Centeno Gutierrez | Closed | Area-Analytics · Area-Governance · Evidence-Verified |
| 83 | Epic | Mensajería, calidad y operación | Luisa Manuela Alejandra Rincon Saens | Active | Area-Messaging · Area-Ops |
| 84 | Feature | Correo SMTP y Telegram | Luisa Manuela Alejandra Rincon Saens | Active | Area-Messaging · Provider-Neutral |
| 85 | Feature | Testing, documentación, despliegue y operación | Luisa Manuela Alejandra Rincon Saens | Active | Area-Ops · P1 · Provider-Neutral |
| 86 | User Story | Validaciones externas de la beta | Luisa Manuela Alejandra Rincon Saens | Active | Area-Ops · Blocked-External · P1 |
| 87 | Task | Ejecutar canary IA live con persist=false | David Esteban Centeno Gutierrez | New | Area-AI · Blocked-External · P1 |
| 88 | Task | Ejecutar canary SMTP y Telegram | Luisa Manuela Alejandra Rincon Saens | New | Area-Messaging · Blocked-External · P1 |
| 89 | Task | Ejecutar Playwright real en cuatro viewports | Luisa Manuela Alejandra Rincon Saens | New | Area-Ops · Blocked-External · P1 |
| 90 | Task | Ejecutar canary OCI Usage API sin duplicar FOCUS | David Esteban Centeno Gutierrez | New | Area-Ingestion · Blocked-External · P1 |
| 91 | User Story | Destino PostgreSQL productivo y operación 24/7 | David Esteban Centeno Gutierrez | New | Area-Ops · Deferred-Production · P1 |
| 92 | Task | Definir destino de despliegue | David Esteban Centeno Gutierrez | New | Area-Ops · Deferred-Production · P1 |
| 93 | Task | Reconciliar y aplicar migraciones en destino | David Esteban Centeno Gutierrez | New | Area-Ops · Deferred-Production · P1 |
| 94 | Task | Integrar secret manager, rate limiting compartido y observabilidad | David Esteban Centeno Gutierrez | New | Area-Ops · Deferred-Production · P1 |
| 95 | Task | Activar healthchecks, workers supervisados y backup/restore | David Esteban Centeno Gutierrez | New | Area-Ops · Deferred-Production · P1 |
| 96 | User Story | Documentación, roadmap, modelo ER y anexos | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Ops · Evidence-Verified |
| 97 | Feature | Administración MSP, tenants y onboarding | David Esteban Centeno Gutierrez | Closed | Area-Auth · Evidence-Verified · Provider-Neutral |
| 98 | User Story | UX responsive, accesibilidad y claridad operativa | Luisa Manuela Alejandra Rincon Saens | Closed | Area-Auth · Evidence-Verified |

## Nota de alcance

Esta página es una copia estática para revisión académica. Para consultar el tablero interactivo, el historial completo y el detalle de cada work item se debe usar Azure DevOps con una cuenta autorizada.
