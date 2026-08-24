# Telegram Bot FinOps

## Alcance MVP

- Chatbot FinOps desde Telegram usando el mismo motor IA del backend.
- Recordatorios de ahorro bajo demanda con `/recordatorios`.
- Consultas de recomendaciones, costos y oportunidades.
- Vinculación autoasistida por el usuario desde Perfil; la vinculación manual queda como respaldo administrativo.
- Sin aprobacion/rechazo de recomendaciones desde Telegram en esta version.

## Variables

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=token_entregado_por_botfather
TELEGRAM_WEBHOOK_SECRET=secreto_largo_aleatorio
TELEGRAM_BOT_USERNAME=nombre_del_bot_sin_arroba
OUTBOUND_PROVIDER_TIMEOUT_MS=15000
```

`OUTBOUND_PROVIDER_TIMEOUT_MS` limita cada envío hacia Telegram y SMTP. En producción se acepta un valor entre
5.000 y 60.000 milisegundos; el valor por defecto es 15.000. Un timeout se registra como entrega fallida sin
bloquear indefinidamente el worker.

## Configurar Webhook

El backend debe estar disponible con una URL publica HTTPS. Para desarrollo local se puede usar ngrok o equivalente.

```powershell
npm run telegram:set-webhook -- --url https://<backend-public-url>/api/v1/telegram/webhook
```

El script registra el webhook en Telegram y configura `secret_token`. El endpoint valida el header `X-Telegram-Bot-Api-Secret-Token`.

## Canary real controlado

El canary de proveedores no usa la base de datos ni datos de tenants. Por defecto se omite; para ejecutarlo se debe
definir explícitamente un destino de prueba y la confirmación de envío real:

```powershell
$env:MESSAGING_CANARY_CONFIRM='I_UNDERSTAND_THIS_SENDS_A_REAL_MESSAGE'
$env:MESSAGING_CANARY_TELEGRAM_CHAT_ID='<chat-id-de-prueba>'
# o: $env:MESSAGING_CANARY_EMAIL_TO='correo-de-prueba@example.com'
npm run test:canary:messaging
```

El script imprime solo estados y errores sanitizados. Requiere que el canal correspondiente esté habilitado y que
sus credenciales estén cargadas en el entorno; un resultado `PASSED` valida conectividad del proveedor, pero no
cierra por sí solo el canary de la cola durable de producción.

## Vincular Usuario

1. El usuario entra en `Perfil` dentro de FinOps y genera un código de auto-vinculación.
2. Abre el bot configurado y envía `/start <código>` antes de que expire (10 minutos).
3. El webhook valida el secreto, consume el código una sola vez y vincula el chat al usuario y tenant exactos.
4. El usuario puede comprobar el estado desde Perfil; el administrador puede enviar un mensaje de prueba desde la gestión de Telegram.

### Respaldo administrativo

Si el usuario no puede usar el código, un administrador autorizado puede vincular el chat desde `Agente IA > Telegram`.
El Chat ID no es una credencial: la operación exige autenticación, tenant compartido y queda auditada.

## Comandos

- `/start`: muestra estado de vinculacion o Chat ID.
- `/ayuda`: lista comandos.
- `/chat <pregunta>`: consulta al asistente IA.
- Texto libre: se trata como pregunta al asistente IA.
- `/recordatorios`: muestra ahorro no capturado.
- `/recomendaciones`: lista recomendaciones pendientes/aprobadas.
- `/costos`: muestra resumen de costo actual.
- `/oportunidades`: muestra oportunidades/insights actuales.

## Seguridad

- Chats no vinculados no acceden a datos FinOps.
- Solo `ADMIN` y `OPERATOR_ADMIN` vinculan o desactivan chats.
- El usuario vinculado debe pertenecer al tenant del admin.
- No se guardan passwords ni tokens de usuario.
- Las interacciones quedan en `telegram_interaction_logs`.
- Las acciones administrativas quedan en `audit_events`.
