# Validación del agente IA con GPT-5.6 Luna

## Configuración

La aplicación usa el proveedor compatible con OpenAI configurado mediante:

```env
AI_BASE_URL=https://tu-endpoint-compatible/v1
AI_API_KEY=tu_secreto_fuera_del_repositorio
AI_MODEL=gpt-5.6-luna
AI_AUDITOR_MODEL=gpt-5.6-luna
```

La URL y la clave se leen exclusivamente desde el entorno. No se guardan en
el código, en el frontend, en trazas ni en los artefactos de prueba. El gateway
envía únicamente el contrato estándar de `chat.completions` y no incluye
parámetros específicos de NVIDIA.

## Validación offline

Ejecuta:

```bash
npm run test:ai:offline
npm run test -- --run src/infrastructure/ai/OpenAiCompatibleAiGateway.test.ts src/domain/security/AuthorizationPolicy.test.ts src/application/auth/effectiveTenantRole.test.ts
```

Los escenarios dorados verifican idioma español, evidencia determinística,
ahorro no negativo, relación con el recurso, coherencia de métricas, planes
reversibles y rechazo de evidencia insuficiente sin llamar a un LLM.

## Canary real aislado

El canary crea un schema efímero, aplica migraciones, carga fixtures sintéticos,
inicia el backend con `persist` aislado y elimina el schema y el fixture en
`finally`.

```bash
npm run build
$env:AI_LIVE_TESTS='true'
$env:AI_EXPECTED_MODEL='gpt-5.6-luna'
npm run test:canary:ai:gpt56
```

El comando ejecuta tres canaries completos consecutivos. Cada corrida valida:

- chat en español;
- generación de recomendaciones;
- evidencia y auditoría persistidas solo en el schema efímero;
- ahorro no negativo;
- trazas de observabilidad;
- uso efectivo del modelo esperado.

El resultado resumido queda en `.test-artifacts/ai-audit/`, una ruta ignorada
por Git. Un fallo HTTP, timeout o indisponibilidad del proveedor hace fallar el
canary sin exponer la respuesta completa ni la clave.

## Corte live de análisis previo — 2026-09-04

- `GET /models` respondió HTTP 200 y anunció `gpt-5.6-luna`; las llamadas
  directas no streaming a `gpt-5.6-luna` y `gpt-5.4-mini` respondieron HTTP
  200, y el streaming de Luna terminó con SSE y `[DONE]`.
- La suite `npm run test:canary:ai:gpt56`, limitada a `AI_CANARY_SCOPE=analysis`,
  terminó con **3/3 corridas consecutivas aprobadas**. Cada corrida validó el
  chat en español, el endpoint de recomendaciones, 3 recomendaciones con
  evidencia técnica/financiera, auditoría IA aprobada, compuertas determinísticas,
  ahorro no negativo, trazabilidad y el modelo esperado.
- Latencia observada: aproximadamente **72–89 s** para generar recomendaciones
  y **96–112 s** por canary completo. Funcionalmente es correcto, pero la
  latencia queda identificada como trabajo de rendimiento separado.
- El canary comparativo de aprendizaje también completó generación y auditoría:
  el candidato obtuvo 93 frente a 96 de la línea base, por lo que fue rechazado
  y no promovido. Esa decisión es el comportamiento seguro esperado.
- No se persistieron fixtures productivos ni secretos. `AI-001` cumple su
  criterio funcional de cierre; `AI-002` permanece abierto para calificación
  periódica y reducción de latencia.

## Criterio de cierre

`AI-001` se considera cerrado para la disponibilidad funcional del escenario de
análisis porque las tres corridas consecutivas de ese corte terminaron
correctamente con `gpt-5.6-luna`, sin fugas de secretos. La validación ampliada
posterior se documenta abajo y mantiene `AI-002` abierto para calidad y
disponibilidad sostenida.

## Validación de formato del chat y ecosistema — 2026-09-04

- El chat web ahora renderiza Markdown GFM de forma semántica y segura: no
  interpreta HTML, scripts ni imágenes remotas, y la respuesta deja de mostrar
  marcadores literales como `**texto**`.
- El chat web solicita Markdown; Telegram solicita texto plano. El prompt del
  canal web prioriza conclusión, evidencia y respuesta concisa, mientras que el
  canal Telegram evita marcadores Markdown incompatibles.
- Se eliminó la serialización duplicada del snapshot y de la recomendación en el
  contexto compartido: cada operación los conserva una sola vez en su prompt
  específico.
- Verificación local: frontend typecheck, lint y build aprobados; Playwright
  focalizado en chat/recomendaciones **8/8**. La prueba comprueba renderizado
  de encabezados y negrita, ausencia de `**`, y bloqueo de `script` e imágenes.
- Las pruebas unitarias de backend incluyen los contratos de prompts por canal,
  Telegram en texto plano y la ausencia de duplicación en Context Engine.
- El canary live ampliado confirmó chat en español, Markdown seguro y abstención
  ante métricas técnicas no disponibles. En esa ejecución, recomendaciones
  respondieron 2/3 veces; una corrida obtuvo HTTP 500 del proveedor. Los tres
  planes generados fueron rechazados por el auditor con HTTP 409, por lo que no
  se persistió ningún plan no aprobado. `AI-002` permanece abierto para
  investigar la calidad/latencia del plan y estabilizar la disponibilidad del
  proveedor; este resultado no se presenta como aprobación completa del
  ecosistema.
