# ☁️ FinOps Inteligente: Core Backend & API RESTful

![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue) ![Tests](https://img.shields.io/badge/Tests-Vitest-success)

Este repositorio contiene el núcleo lógico (Backend) de la plataforma **FinOps Inteligente**, desarrollada para **TAK Colombia**. El sistema centraliza la ingesta de facturación multicloud, orquesta el análisis predictivo mediante Agentes de Inteligencia Artificial (LLMs) y expone una API RESTful segura para el consumo de interfaces web y chatbots.

## Propósito del Sistema

El backend actúa como el motor principal para transformar los procesos manuales y reactivos de gestión de costos en la nube hacia una cultura proactiva. Sus responsabilidades incluyen:
- **Ingesta Estandarizada:** Recolección diaria de métricas desde proveedores cloud (AWS Cost Explorer) utilizando el Patrón Adaptador.
- **Análisis Inteligente:** Procesamiento de datos mediante IA generativa para la detección de anomalías y sugerencias de *rightsizing*.
- **Persistencia:** Almacenamiento de métricas financieras y de contexto en PostgreSQL (Supabase en producción; PostgreSQL local vía Docker para desarrollo).
- **Seguridad y Trazabilidad:** Gestión de roles (JWT), encriptación de credenciales cloud y registro de auditoría de optimizaciones.



## Arquitectura y Patrones (Clean Architecture)

El proyecto está estructurado bajo los principios **SOLID** y **Clean Architecture**, asegurando que la lógica de negocio central (Dominio) sea completamente independiente de frameworks externos y bases de datos.

### Estructura de Directorios

\`\`\`text
src/
├── domain/           # Entidades core, Interfaces (ICloudProvider), Tipos estrictos
├── application/      # Casos de uso, Orquestación de Ingesta, Servicios de IA
├── infrastructure/   # Adaptadores (AWS, GCP), Repositorios (Postgres), Configuración
└── presentation/     # Controladores Express/Nest, Middlewares, Rutas de la API
\`\`\`

## Stack Tecnológico

- **Entorno:** Node.js + TypeScript (Strict Mode, ESM)
- **Base de Datos:** PostgreSQL (Supabase) vía Prisma ORM (`@prisma/adapter-pg`)
- **IA:** Cliente compatible con OpenAI (paquete `openai`) apuntando a NVIDIA NIM; modelo generador + auditor independiente
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
   NVIDIA_API_KEY=tu_api_key_de_nvidia_nim
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

> Nota: este repositorio aún no tiene ESLint/Prettier configurados; no existe un script `lint`.

## Manejo de Errores y Seguridad

Los errores de dominio se modelan con `FinOpsBaseError` (con un `code` semántico: `NOT_FOUND`, `VALIDATION_ERROR`, `AUTHENTICATION_REQUIRED`, `AUTHORIZATION_FAILED`, `AI_AUDIT_REJECTED`, etc.) y cada controlador los traduce al código HTTP correspondiente sin exponer trazas de pila al cliente.

### Postura de seguridad actual
- **Autenticación:** JWT (`jsonwebtoken`) validado por middleware en todas las rutas salvo `/api/v1/auth/login` y el webhook de Telegram (que usa un secreto propio). Las consultas filtran por `tenantId` para aislamiento multi-tenant.
- **Contraseñas:** hashing con Argon2.
- **Credenciales cloud:** cifradas en reposo (`CredentialCipher`, clave en `CREDENTIAL_ENCRYPTION_KEY`); las credenciales admin temporales de aprovisionamiento **no se persisten**.
- **CORS:** origen configurable vía `CORS_ORIGIN` (por defecto `http://localhost:5173`).
- **Secretos:** `.env` está en `.gitignore`; usar `.env.example` como plantilla. No commitear claves.

### Pendientes de hardening antes de producción
- **Rate limiting** y cabeceras de seguridad (p. ej. `helmet`): **no** están configurados aún; se recomienda añadirlos antes de exponer la API públicamente.
- **Logging estructurado** centralizado (hoy se usa `console`).
- Rotación de claves JWT/cifrado y gestión de secretos vía un gestor (no `.env` plano) en despliegue real.

## Flujo de Trabajo (Water-Scrum-Fall)

Este proyecto sigue un enfoque iterativo. Las contribuciones deben realizarse mediante *Feature Branches* (`feature/nombre-de-la-tarea`) y aprobar mediante Pull Requests que superen el pipeline de CI (linting y tests).
