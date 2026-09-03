# Mensajería por correo y Telegram

## Decisión de arquitectura

FinOps usa un único canal SMTP institucional y un único bot global de Telegram. No se incorporan plataformas
transaccionales de terceros ni un bot por tenant. Los secretos se configuran fuera del repositorio mediante `.env`
en desarrollo y un gestor de secretos en el despliegue futuro.

## Correo SMTP

El backend crea un `EmailClient` con `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y
`SMTP_FROM`. `SMTP_PASSWORD` debe ser una contraseña de aplicación cuando el proveedor lo requiera; nunca debe ser
la contraseña personal de una cuenta con más permisos de los necesarios.

El transporte Nodemailer puede usar conexiones agrupadas y límites explícitos:

- `SMTP_POOL_ENABLED=true` reutiliza conexiones.
- `SMTP_MAX_CONNECTIONS` limita la concurrencia contra el servidor SMTP.
- `SMTP_MAX_MESSAGES` rota una conexión después de cierto número de mensajes.
- `SMTP_RATE_LIMIT` limita el ritmo global de envío.
- `OUTBOUND_PROVIDER_TIMEOUT_MS` evita conexiones colgadas.

El endpoint administrativo de verificación ejecuta `transporter.verify()` sin enviar un correo. Las alertas se
encolan y el scheduler las entrega con lease, reintentos y estados auditables. Las invitaciones y recuperación de
contraseña conservan envío directo porque contienen tokens efímeros que no deben quedar en una cola durable.

## Preferencias persistentes

Cada usuario tiene una fila en `user_messaging_preferences`. Correo queda activo por defecto; Telegram queda
desactivado hasta que el usuario vincule un chat. Las categorías independientes son:

- alertas operativas;
- recomendaciones y planes;
- alertas financieras, presupuestos y ahorro;
- resúmenes ejecutivos.

El módulo `Mensajería` permite modificar estas preferencias y consultar entregas. `Perfil` conserva únicamente la
auto-vinculación de Telegram y enlaza al módulo de preferencias; no existen toggles locales que aparenten cambiar
la configuración persistente.

El diagnóstico también expone una verificación del bot mediante `getMe`. Esta operación confirma token y
conectividad sin enviar un mensaje; el envío de prueba continúa pasando por la cola durable.

## Flujo de entrega

1. Un servicio FinOps decide que existe una notificación y valida la preferencia del usuario.
2. `OutboundChannelDeliveryService` crea una entrega `PENDING` con el cuerpo y metadatos mínimos del destinatario.
3. `OutboundMessageScheduler` drena la cola global desde un worker con contexto interno.
4. `OutboundMessageDeliveryProcessor` reclama una entrega, llama a SMTP/Telegram y la marca `SENT`, `FAILED` o
   `SKIPPED` sin bloquear la operación que originó el mensaje.
5. La pantalla `Mensajería` muestra el historial reciente para diagnóstico.

Los cuerpos de correo se guardan porque son mensajes operativos. No se guardan secretos, tokens de invitación ni
contraseñas. Las respuestas largas de Telegram se recortan antes de encolarse y las respuestas del bot se
fragmentan respetando el límite del proveedor.

## Configuración de workers

En desarrollo se puede ejecutar el API y el scheduler en procesos separados. El API no debe ejecutar workers de
Telegram o mensajería cuando se quiera aislar el rendimiento del login. En un despliegue real, usar al menos un
worker de entrada Telegram y un scheduler de mensajes; ambos deben compartir la misma base de datos y el rol
runtime configurado.

## Operación segura

- No poner `SMTP_PASSWORD`, `TELEGRAM_BOT_TOKEN` ni `TELEGRAM_WEBHOOK_SECRET` en frontend, Git, tickets o logs.
- Rotar las credenciales ante cualquier exposición y revisar los logs del proveedor.
- Limitar el SMTP a una cuenta remitente dedicada y a los destinatarios necesarios.
- Usar `Mensajería > Verificar SMTP` antes de habilitar alertas.
- Ejecutar el canary real solo con una dirección/chat de prueba autorizado.
