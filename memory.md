# Memory Log - Qwerti Development

## 2026-03-10: Inicialización y Consolidación (Fase 0)

1. **Objetivo**: Migrar el código desde `qwerti_code` a la raíz del proyecto y asegurar que el entorno sea funcional (Bun + TypeScript).
2. **Environment**: Repositorio `qwerti` vacío, código fuente disponible en `../qwerti_code`.
3. **Worker**: Estructura de archivos y `package.json`.
4. **Acciones**:
    - Se listó el contenido de `qwerti_code`. Se identificó un monorepo con un paquete principal en `packages/qwerti`.
    - Se copió el contenido de `packages/qwerti/*` a la raíz de `/Users/angeloseas/Downloads/IA_Projects/CLI/qwerti`.
    - Se ejecutó `bun install` para instalar dependencias.
    - Se ejecutó `bun test` para verificar el estado inicial.
5. **Resultado**: Exitoso. 3 tests pasaron (provider y models). El entorno está listo para la Fase 1: Tools Esenciales.

---

## 2026-03-10: Fase 1 - Tools Esenciales (COMPLETADA)

1. **Objetivo**: Implementar herramientas críticas de exploración y edición (`list_dir`, `edit_file`, `glob`, `grep`).
2. **Environment**: Entorno Bun configurado en Fase 0.
3. **Worker**: `src/tools/built-in/`.
4. **Acciones**:
    - Se implementó `ListDirTool` para navegación con metadata.
    - Se implementó `EditFileTool` para edición atómica (`old_string` -> `new_string`).
    - Se implementó `GlobTool` usando `fast-glob`.
    - Se implementó `GrepTool` nativo (regex-based).
    - Se crearon 4 nuevos archivos de test en `src/__tests__/`.
    - Se actualizó `tsconfig.json` para resolver problemas de importación de extensiones `.ts`.
    - Se registraron las herramientas en `App.tsx` y se actualizó el `system-prompt.ts`.
5. **Resultado**: Exitoso. Todos los tests unitarios pasan. El agente ahora tiene capacidades avanzadas de navegación y edición quirúrgica de archivos.

---

5. **Resultado**: Exitoso. El agente puede buscar modelos GGUF, descargarlos y descubrir backends locales (Ollama/Llama.cpp).
    - Se agregaron `HFDownloadTool`, `HFSearchTool`.
    - Se agregó `DiscoveryService` y el comando `/discover`.
    - Se resolvió el conflicto de `node_modules` en Git re-inicializando con un `.gitignore` robusto.

---

---

## 2026-03-10: Integración de Modelos y Herramientas (COMPLETADA)

1. **Objetivo**: Asegurar que los modelos descargados (`qwen3.5:0.8b` y `qwen3.5-4b-IQ4`) puedan responder y ejecutar herramientas (`list_dir`, `read_file`) bajo la metodología `Test.md`.
2. **Worker**: `src/providers/implementations/llama-cpp-provider.ts`, `src/tools/base-tool.ts`.
3. **Acciones**:
    - **Debugging de Ollama**: Se detectó que la instancia local de Ollama se colgaba por un runner bloqueado. Tras el reinicio por el usuario, se recuperó la conectividad.
    - **Limpieza de Esquema**: Se detectó un error `Bad Request` en modelos locales porque enviábamos `$schema` en la definición de la herramienta. Se modificó `BaseTool.ts` para limpiar el JSON Schema.
    - **Validación 0.8B**: Excitosa. El modelo pequeño puede realizar múltiples llamadas secuenciales (listado de archivos + lectura de `memory.md`) y resumir la información al usuario.
    - **Incompatibilidad 4B**: Se documentó que el modelo `qwen3.5-4b-IQ4` en Ollama **NO soporta herramientas** (`template error` o `registry error`). El agente falla graciosamente informando el error de Ollama.
6. **Resultado**: El sistema de orquestación de herramientas es estable. 
    - Se aplicaron mejoras visuales inspiradas en `UI_DEVELOPMENT_GUIDE.md` (icons, subtle borders, logic-less state).
    - Se validó el ciclo de terminal (EXP-001) con un 100% de éxito en el modelo 0.8b.
    - Se cuenta con `experiments.json` para seguimiento estructurado.

---

## 2026-03-10: Mejora de Comando /models y Foco TUI (EXP-002)

1. **Objetivo**: Resolver el bloqueo del comando `/models` y mejorar la navegación interactiva.
2. **Worker**: `src/tui/app.tsx`, `src/tui/components/input-box.tsx`, `src/tui/components/select-list.tsx`.
3. **Acciones**:
    - Se detectó en `key-debug.log` que el `InputBox` seguía capturando entradas mientras los diálogos estaban abiertos.
    - Se deshabilitó el `InputBox` dinámicamente (`disabled={processing || !!activeDialog}`).
    - Se mejoró el feedback visual del `InputBox` deshabilitado (prompt gris, sin cursor).
    - Se corrigió la lógica de `closeDialog` en `App.tsx` para manejar correctamente el stack de diálogos.
    - Se añadió un guard a la gestión global de eventos en `App.tsx` para evitar disparar acciones de fondo mientras hay un diálogo activo.
    - Se añadió un guard de seguridad en `SelectList.tsx` para evitar fallos con listas vacías.
4. **Resultado**: Exitoso. La interacción con `/models` es fluida y el foco de entrada se mantiene exclusivamente en el diálogo activo.

---

## 2026-03-10: Optimización de Latencia para Modelos Locales (EXP-003)

1. **Objetivo**: Reducir el tiempo de respuesta y preámbulos innecesarios en el modelo `qwen3.5:0.8b`.
2. **Worker**: `src/agent/system-prompt.ts`, `src/providers/implementations/llama-cpp-provider.ts`.
3. **Acciones**:
    - Se modificaron las directrices del `system-prompt.ts` para exigir concisión extrema y ejecución directa de herramientas sin "chatter".
    - Se redujo el `max_tokens` por defecto de 4096 a 2048 en `LlamaCppProvider` para evitar generaciones excesivas.
    - Se implementaron `stop sequences` (`<|im_end|>`, `User:`, etc.) para asegurar que el modelo se detenga inmediatamente al finalizar su turno.
    - Se añadieron opciones específicas para Ollama (`num_predict`) para sincronizar parámetros con su API nativa.
4. **Resultado**: El modelo responde más rápido a preguntas simples como "Cuantos archivos hay?" al evitar explicaciones ociosas antes de llamar a `list_dir`.

---

## 2026-03-10: Mitigación de Degradación de Latencia (EXP-004)

1. **Objetivo**: Evitar que el modelo "se cuelgue" a medida que la sesión avanza y la memoria crece.
2. **Worker**: `src/providers/implementations/llama-cpp-provider.ts`, `src/agent/context-manager.ts`.
3. **Acciones**:
    - Se descubrió que la latencia (TTFT) en la interfaz Qwerti escalaba lineal/exponencialmente hasta colgarse (>30s) debido a que Ollama re-ingestaba toda la historia conversacional _más_ el esquema de herramientas.
    - Se modificó `LlamaCppProvider` para truncar dinámicamente el historial a los **últimos 3 mensajes** si se detecta que el endpoint es local (Ollama/Llama.cpp).
    - Se ajustó la estimación de tokens en `ContextManager` para forzar recortes agresivos más tempranos.
4. **Resultado**: La latencia se mantiene constante y baja (~3-5 segundos) sin importar la duración de la sesión.

---

## 2026-03-10: Solución a Healthcheck de Modelos 4B (EXP-005)

1. **Objetivo**: Fixear el error "Server reachable but healthcheck failed" al registrar nuevos modelos locales grandes, como `qwen3:4b`.
2. **Worker**: `src/providers/implementations/llama-cpp-provider.ts`
3. **Acciones**:
    - Se aisló la función de `healthCheck()` observando que el servidor de Ollama sí tenía el modelo, pero fallaba en Qwerti durante la fase del "Deep Check" que lanza un simple "ping" para cerciorarse de la inferencia.
    - Se identificó que modelos de 4B o más tardan varios segundos en cargar en RAM/VRAM en su primer uso (Cold Start), superando el `AbortController` de 3000ms anterior.
    - Se aumentó el timeout a 15,000ms (15s) para dar tiempo a que Ollama levante el modelo en la red antes de rechazar el health check.
4. **Resultado**: El comando `/add` ahora espera tranquilamente y registra exitosamente los modelos pesados sin confundirlo con un fallo de servidor o modelo caído.

---

## 2026-03-10: Carga en Fallback de ToolCalling (EXP-006)

1. **Objetivo**: Evitar bloqueos de interfaz al conversar con modelos nativos de Ollama que no soporten inyección de herramientas (ej. `gemma3:4b`).
2. **Worker**: `src/providers/implementations/llama-cpp-provider.ts`.
3. **Acciones**:
    - Muchos modelos pequeños aún fallan a nivel API (`400 Bad Request`) si se envían definiciones dentro del array `tools` porque Ollama no implementa su pipeline OpenAI correctamente.
    - Se añadió una cláusula trampa (`if (response.status === 400 && errorBody.includes("does not support tools"))`).
    - Si esto sucede, se extirpan las herramientas del cuerpo del request y Qwerti vuelve a enviar la solicitud de inmediato y de manera silenciosa (Graceful Fallback).
4. **Resultado**: El usuario puede usar modelos variados sin ser escupido fuera de Qwerti. Los modelos capacitados (como `qwen3:0.8B`) ejecutan tool-calling normal, y los limitados caen elegantemente a modo chatbot texto-a-texto.

---

## 2026-03-10: Soporte para Databricks y Poda de Contexto (EXP-007)

1. **Objetivo**: Habilitar el uso de modelos Databricks via AI Gateway y corregir la degradación de contexto en modelos cloud.
2. **Worker**: `src/providers/implementations/llama-cpp-provider.ts`, `src/providers/provider-factory.ts`.
3. **Acciones**:
    - Se identificó que la lógica de poda (truncar a 3 mensajes) se aplicaba a todos los modelos debido a que `LlamaCppProvider` hardcodeaba su tipo.
    - Se modificó el constructor para recibir el `providerType` real y se ajustó la lógica para que solo se pode en entornos locales comprobados (`localhost`, `127.0.0.1`, `ollama`).
    - Se detectó que la API de Databricks envía fragmentos de razonamiento en forma de objetos/arrays dentro de `delta.content`. Se implementó un extractor recursivo de texto para limpiar la salida y evitar mostrar JSON crudo al usuario.
    - Se validó el registro, la persistencia del contexto (manteniendo info de 7 mensajes previos) y la ejecución de herramientas (`list_dir`).
4. **Resultado**: Exitoso (3/3). Qwerti ahora es plenamente compatible con endpoints de Databricks AI Gateway.

---

## 2026-03-10: Soporte para Modelos Thinking (Qwen3/3.5) (EXP-009)

1. **Objetivo**: Hacer que todos los modelos registrados (Ollama + Databricks) respondan correctamente en chat y tool calling.
2. **Worker**: `src/providers/implementations/llama-cpp-provider.ts`.
3. **Acciones**:
    - Se descubrio que los modelos Qwen3 y Qwen3.5 de Ollama operan por defecto en modo "thinking": toda la generacion va al campo `delta.reasoning` del streaming, dejando `delta.content` vacio.
    - El `LlamaCppProvider` solo leia `delta.content`, por lo que estos modelos parecian no responder.
    - Se agrego lectura de `delta.reasoning` en el parser de streaming: cuando `content` esta vacio y `reasoning` tiene texto, se emite el reasoning como texto visible.
    - Se agrego manejo de `delta.content` como array (para Databricks que envia objetos de razonamiento).
    - Se corrigio la URL de Databricks en `~/.qwerti/config.json` (estaba apuntando a `dbc-...` en vez de `ai-gateway...`).
4. **Resultado**: 4/4 modelos funcionan (qwen3.5:0.8b, qwen3:4b, gemma3:4b, databricks-gpt-oss-120b). Todos responden a chat y ejecutan `list_dir` correctamente.
5. **Insight**: Los modelos "thinking" (Qwen3, DeepSeek-R1, etc.) son cada vez mas comunes. Cualquier provider que consuma la API OpenAI-compat de Ollama DEBE parsear `delta.reasoning` ademas de `delta.content`. La API nativa de Ollama permite `think:false`, pero la compat OpenAI no tiene equivalente.

---

## Proximos Pasos (Fase 3 - Mejoras en MCP y Skills)
- Soporte para MCP remotos y despliegue rapido.
- Interfaz grafica mejorada para el visor de logs.
- Refactorizacion de la gestion de skills.
- Considerar agregar opcion para desactivar thinking en modelos Qwen (via API nativa de Ollama con `think:false`).
