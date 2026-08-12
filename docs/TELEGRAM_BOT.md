# Telegram Bot FinOps

## Alcance MVP

- Chatbot FinOps desde Telegram usando el mismo motor IA del backend.
- Recordatorios de ahorro bajo demanda con `/recordatorios`.
- Consultas de recomendaciones, costos y oportunidades.
- Vinculacion manual por administrador desde la app.
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

## Vincular Usuario

1. El usuario abre el bot en Telegram.
2. Envia `/start`.
3. El bot responde el `Chat ID`.
4. Un administrador entra a la app en `Agente IA > Telegram`.
5. El admin pega `email` del usuario FinOps y `Chat ID`.
6. Opcionalmente envia un mensaje de prueba.

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
