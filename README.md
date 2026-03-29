# ☁️ FinOps Inteligente: Core Backend & API RESTful

![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TimescaleDB-blue) ![Status](https://img.shields.io/badge/Status-Production_Ready-success)

Este repositorio contiene el núcleo lógico (Backend) de la plataforma **FinOps Inteligente**, desarrollada para **TAK Colombia**. El sistema centraliza la ingesta de facturación multicloud, orquesta el análisis predictivo mediante Agentes de Inteligencia Artificial (LLMs) y expone una API RESTful segura para el consumo de interfaces web y chatbots.

## 🎯 Propósito del Sistema

El backend actúa como el motor principal para transformar los procesos manuales y reactivos de gestión de costos en la nube hacia una cultura proactiva. Sus responsabilidades incluyen:
- **Ingesta Estandarizada:** Recolección diaria de métricas desde proveedores cloud (AWS Cost Explorer) utilizando el Patrón Adaptador.
- **Análisis Inteligente:** Procesamiento de datos mediante IA generativa para la detección de anomalías y sugerencias de *rightsizing*.
- **Persistencia de Series Temporales:** Almacenamiento optimizado de métricas financieras usando PostgreSQL + TimescaleDB.
- **Seguridad y Trazabilidad:** Gestión de roles (JWT), encriptación de credenciales cloud y registro de auditoría de optimizaciones.



## 🏗️ Arquitectura y Patrones (Clean Architecture)

El proyecto está estructurado bajo los principios **SOLID** y **Clean Architecture**, asegurando que la lógica de negocio central (Dominio) sea completamente independiente de frameworks externos y bases de datos.

### Estructura de Directorios

\`\`\`text
src/
├── domain/           # Entidades core, Interfaces (ICloudProvider), Tipos estrictos
├── application/      # Casos de uso, Orquestación de Ingesta, Servicios de IA
├── infrastructure/   # Adaptadores (AWS, GCP), Repositorios (Postgres), Configuración
└── presentation/     # Controladores Express/Nest, Middlewares, Rutas de la API
\`\`\`

## 🚀 Stack Tecnológico

- **Entorno:** Node.js + TypeScript (Strict Mode)
- **Base de Datos:** PostgreSQL con extensión TimescaleDB
- **Arquitectura de IA:** LangChain.js / Vercel AI SDK
- **Calidad de Código:** ESLint, Prettier, Husky (Pre-commit hooks)
- **Testing:** Jest, Supertest (Unit & Integration tests)

## 🛠️ Configuración y Despliegue

### Requisitos Previos
- Node.js >= 18.x
- Docker & Docker Compose (para levantar PostgreSQL + TimescaleDB localmente)
- Credenciales de AWS configuradas localmente (`~/.aws/credentials`)

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

3. Configura las variables de entorno (Crea un archivo `.env` basado en `.env.example`):
   \`\`\`env
   PORT=3000
   DATABASE_URL=postgres://user:password@localhost:5432/finops_db
   JWT_SECRET=tu_secreto_super_seguro
   AWS_REGION=us-east-1
   GEMINI_API_KEY=tu_api_key_de_ia
   \`\`\`

4. Levanta la base de datos con Docker:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

### Scripts de Ejecución

- \`npm run dev\`: Inicia el servidor en modo desarrollo (con Hot-Reload).
- \`npm run build\`: Compila TypeScript a JavaScript de producción (carpeta `/dist`).
- \`npm run start\`: Inicia el servidor en modo producción.
- \`npm run test\`: Ejecuta la suite de pruebas unitarias y de integración.
- \`npm run lint\`: Analiza el código en busca de violaciones de estilo y deuda técnica.

## 🔒 Manejo de Errores y Seguridad

Este sistema implementa un manejo de errores centralizado mediante *Custom Errors* (ej. `DomainError`, `InfrastructureError`). Cualquier fallo en la comunicación con APIs de terceros o en el motor de IA es capturado, logueado de forma estructurada y devuelto al cliente con el código HTTP correspondiente, sin exponer trazas de la pila (stack traces) en producción.

## 🤝 Flujo de Trabajo (Water-Scrum-Fall)

Este proyecto sigue un enfoque iterativo. Las contribuciones deben realizarse mediante *Feature Branches* (`feature/nombre-de-la-tarea`) y aprobar mediante Pull Requests que superen el pipeline de CI (linting y tests).
