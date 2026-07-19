# ☁️ FinOps Inteligente: Core Backend & API RESTful

![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue) ![Tests](https://img.shields.io/badge/Tests-Vitest-success)

Este repositorio contiene el núcleo lógico (Backend) de la plataforma **FinOps Inteligente**, desarrollada para **TAK Colombia**. El sistema centraliza la ingesta de facturación multicloud, orquesta el análisis predictivo mediante Agentes de Inteligencia Artificial (LLMs) y expone una API RESTful segura para el consumo de interfaces web y chatbots.

## Propósito del Sistema

El backend actúa como el motor principal para transformar los procesos manuales y reactivos de gestión de costos en la nube hacia una cultura proactiva. Sus responsabilidades incluyen:
- **Ingesta estandarizada:** Jobs persistentes para inventario, costos FOCUS/API directa y métricas técnicas de OCI/AWS.
- **Análisis Inteligente:** Procesamiento de datos mediante IA generativa para detectar oportunidades y sugerir acciones de *rightsizing*.
- **Persistencia:** Almacenamiento de métricas financieras y de contexto en PostgreSQL (Supabase en producción; PostgreSQL local vía Docker para desarrollo).
- **Seguridad y Trazabilidad:** Gestión de roles (JWT), encriptación de credenciales cloud y registro de auditoría de optimizaciones.



## Arquitectura y Patrones (Clean Architecture)

El proyecto está estructurado bajo los principios **SOLID** y **Clean Architecture**, asegurando que la lógica de negocio central (Dominio) sea completamente independiente de frameworks externos y bases de datos.

### Estructura de Directorios

\`\`\`text
src/
├── domain/           # Modelos y contratos de dominio
├── application/      # Casos de uso, Orquestación de Ingesta, Servicios de IA
├── infrastructure/   # Adaptadores OCI/AWS, repositorios PostgreSQL y cifrado
└── presentation/     # Controladores Express, middlewares y rutas REST
\`\`\`

## Stack Tecnológico

- **Entorno:** Node.js + TypeScript (Strict Mode, ESM)
- **Base de Datos:** PostgreSQL (Supabase) vía Prisma ORM (`@prisma/adapter-pg`)
- **IA:** Cliente compatible con OpenAI (paquete `openai`) apuntando a un endpoint configurable; modelo generador + auditor independiente
- **Seguridad:** JWT (`jsonwebtoken`), hashing de contraseñas con Argon2, cifrado de credenciales cloud (AES, `CredentialCipher`)
- **Validación:** Zod
- **Testing:** Vitest

## Configuración y Despliegue

### Requisitos Previos
- Node.js >= 18.x
- PostgreSQL: Supabase (producción) o Docker Compose para una instancia local (`docker-compose.yml` levanta `postgres:16-alpine`).
- Opcional: credenciales de AWS / OCI solo si se va a ejecutar ingesta real contra esos proveedores.

### Instalación

1. Clona el repositorio:
   \`\`\`bash
   git clone https://github.com/tu-usuario/finops-inteligente-backend.git
   cd finops-inteligente-backend
   \`\`\`

2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`

3. Configura las variables de entorno. Copia `.env.example` a `.env` y completa los valores. Variables mínimas para arrancar:
   \`\`\`env
   PORT=3000
   DATABASE_URL=postgresql://finops:finops@localhost:5432/finops
   JWT_SECRET=al_menos_32_caracteres_aleatorios
   CREDENTIAL_ENCRYPTION_KEY=base64_de_32_bytes
AI_API_KEY=tu_api_key_openai_compatible
AI_BASE_URL=https://api.example.com/v1
AI_MODEL=gpt-5.4-mini
   CORS_ORIGIN=http://localhost:5173
   \`\`\`
   El archivo `.env.example` documenta el conjunto completo (AWS, OCI, Telegram, ajustes de IA y analítica). El `.env` está en `.gitignore` y nunca debe commitearse.

4. Levanta la base de datos con Docker:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

### Scripts de Ejecución

- \`npm run dev\`: Inicia el servidor en modo desarrollo con recarga (`tsx watch`).
- \`npm run build\`: Genera el cliente Prisma y compila TypeScript a `/dist`.
- \`npm run start\`: Inicia el servidor desde `/dist` (producción).
- \`npm run test\`: Ejecuta la suite de pruebas con Vitest. Para excluir el worktree anidado: `npx vitest run --exclude '**/.claude/**'`.
- \`npm run typecheck\`: Verificación de tipos sin emitir (`tsc --noEmit`); ejecuta `prisma generate` antes.
- \`npm run prisma:migrate\` / \`npm run db:seed\`: Migraciones y datos de ejemplo.
- \`npm run import:oci-focus\`: Importa el dataset FOCUS de OCI.
- \`npm run test:integration:docker\`: Ejecuta las pruebas de integración contra PostgreSQL de prueba en Docker (requiere Docker instalado).
- \`npm run test:api:smoke\`: Smoke test de la API contra el backend configurado.
- \`npm run test:api:onboarding\`: Verifica API, roles, aislamiento y exposición de secretos del onboarding.
- \`npm run test:canary:oci-onboarding\`: Canary OCI real read-only cuando existe configuración local.
- \`npm run test:ai:offline\`: Ejecuta los escenarios dorados sin llamar a un proveedor LLM.

El flujo normal para conectar OCI/AWS se realiza desde la vista **Ingesta**. La guía de permisos,
credenciales, estados, endpoints y troubleshooting está en
[`docs/ONBOARDING_CLOUD.md`](docs/ONBOARDING_CLOUD.md).

La verificación local mínima es `npm run typecheck && npm test`; el workflow de CI repite además el build y las pruebas de integración aisladas.

## Manejo de Errores y Seguridad

Los errores de dominio se modelan con `FinOpsBaseError` (con un `code` semántico: `NOT_FOUND`, `VALIDATION_ERROR`, `AUTHENTICATION_REQUIRED`, `AUTHORIZATION_FAILED`, `AI_AUDIT_REJECTED`, etc.) y cada controlador los traduce al código HTTP correspondiente sin exponer trazas de pila al cliente.

### Postura de seguridad actual
- **Autenticación:** JWT (`jsonwebtoken`) validado por middleware en todas las rutas salvo `/api/v1/auth/login` y el webhook de Telegram (que usa un secreto propio). Las consultas filtran por `tenantId` para aislamiento multi-tenant.
- **Contraseñas:** hashing con Argon2.
- **Credenciales cloud:** accesos operativos read-only cifrados en reposo (`CredentialCipher`, clave en `CREDENTIAL_ENCRYPTION_KEY`); el flujo no recibe ni persiste administradores temporales.
- **CORS:** origen configurable vía `CORS_ORIGIN` (por defecto `http://localhost:5173`).
- **Cabeceras y abuso:** Helmet y rate limiting global/específico para autenticación, IA y Telegram están configurados en el servidor.
- **Observabilidad:** logging estructurado por request con `x-request-id`; los errores de proveedor no deben exponer secretos.
- **Secretos:** `.env` está en `.gitignore`; usar `.env.example` como plantilla. No commitear claves.

### Pendientes de hardening antes de producción
- RLS o controles equivalentes en Supabase, verificados con pruebas de aislamiento por tenant.
- Rotación de claves JWT/cifrado y gestión de secretos vía un gestor externo; `.env` es solo para desarrollo.
- Observabilidad centralizada con retención, alertas y métricas de latencia.
- Pruebas de integración contra una base de datos efímera controlada; no usar `DATABASE_URL` productiva.

## Flujo de Trabajo (Water-Scrum-Fall)

Este proyecto sigue un enfoque iterativo. Las contribuciones deben realizarse mediante *Feature Branches* (`feature/nombre-de-la-tarea`) y aprobar mediante Pull Requests que superen el pipeline de CI (linting y tests).
