# Qwerti - Plan del Proyecto

## Objetivo

Agente de terminal que conecta modelos de IA descargados localmente (Hugging Face, GGUF) y los expone como un asistente de codigo con acceso al sistema de archivos y shell del SO. Soporta Ollama, llama.cpp y endpoints compatibles con OpenAI. Multiplataforma (macOS, Linux, Windows).

---

## Estado Actual del Proyecto

El directorio `qwerti_code` contiene una base funcional con la siguiente arquitectura ya implementada:

| Modulo | Estado | Descripcion |
|:---|:---|:---|
| Entry point (index.tsx) | Funcional | CLI con Commander.js, modo interactivo y headless (--eval) |
| TUI (React/Ink) | Funcional | App completa con message-list, input-box, status-bar, sidebar, markdown-renderer, add-wizard, model-selector, help-dialog |
| Agent Loop | Funcional | Async generator con streaming, max 10 iteraciones, filtrado de tools en modo plan |
| Context Manager | Funcional | Historial de mensajes, compactacion automatica a 32k tokens |
| Tools (bash, read_file, write_file) | Funcional | Validacion con Zod, timeout 120s, truncado a 30k chars |
| MCP | Funcional | Cliente stdio, manager multi-servidor, adapter de tools MCP a BaseTool |
| Providers | Funcional | LlamaCppProvider como implementacion universal (OpenAI-compatible) para Ollama, llama.cpp, Azure, Bedrock, Vertex, Databricks |
| Config | Funcional | Global (~/.qwerti/config.json) + Workspace (.qwerti/config.json) |
| Sesiones | Funcional | Persistencia en ~/.qwerti/sessions/, save/load/list/delete |
| Comandos | Funcional | /models, /add, /mcp, /remove, /skills, /session, /resume, /theme |
| Plugins | Funcional | Loader, registry, hook system (onInit, before/afterChat, before/afterToolExecution) |
| Skills | Parcial | Loader y registry funcionales, importacion dinamica de tools es stub |
| Tests | Minimo | Solo provider.test.ts y models.test.ts basicos |
| Event Bus | Funcional | Pub/sub tipado (message, model:changed, tool:start, tool:result, session, error) |

### Limitaciones conocidas
- ProviderFactory mapea todos los tipos de provider a LlamaCppProvider (fallback universal).
- El filtrado de tools en modo plan esta hardcodeado con nombres especificos.
- Skill loader no importa tools dinamicamente (linea 37-38 de skill-loader.ts).
- Sin descarga directa de modelos desde HuggingFace.
- Sin sandbox ni aislamiento de procesos.
- Sin Tree-sitter ni analisis estatico del repositorio.

---

## Stack Tecnologico

| Capa | Tecnologia | Justificacion |
|:---|:---|:---|
| Runtime | Bun | Startup rapido, TypeScript nativo, spawn eficiente, workspaces integrados |
| Lenguaje | TypeScript (strict) | Tipado fuerte para un sistema con muchas interfaces internas |
| TUI | React + Ink 5 | Componentes declarativos, estado reactivo, soporte TTY |
| Inferencia primaria | Ollama API | HTTP local, cero configuracion, soporta GGUF, manejo propio de GPU |
| Inferencia alternativa | llama.cpp server / endpoints OpenAI-compatible | Para usuarios que quieren control directo sobre cuantizacion y parametros |
| Validacion | Zod | Schemas de tools, configs y respuestas del modelo |
| Extension | MCP (Model Context Protocol) | Protocolo estandar para tools externas via stdio |
| Logs | Pino | Structured logging, bajo overhead |

---

## Arquitectura

```
                        ┌──────────────────────┐
                        │     CLI Entry        │
                        │  (Commander.js)      │
                        └─────────┬────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
               ┌────▼───┐  ┌─────▼────┐  ┌────▼────┐
               │  TUI   │  │  Agent   │  │ Headless│
               │ (Ink)  │  │  Loop    │  │ (eval)  │
               └────┬───┘  └────┬─────┘  └────┬────┘
                    │            │              │
        ┌───────────┴────────────┴──────────────┘
        │
   ┌────▼─────────────────────────────────────────────────┐
   │                   Core Bus Layer                     │
   │  EventBus  |  ContextManager  |  SessionStore        │
   └────┬─────────────┬───────────────────┬───────────────┘
        │             │                   │
   ┌────▼────┐  ┌─────▼──────┐   ┌───────▼───────┐
   │ Tools   │  │ Providers  │   │  Extensions   │
   │         │  │            │   │               │
   │ bash    │  │ Ollama     │   │ MCP Servers   │
   │ read    │  │ llama.cpp  │   │ Plugins       │
   │ write   │  │ Azure/etc  │   │ Skills        │
   │ grep    │  │            │   │               │
   │ glob    │  │            │   │               │
   │ edit    │  │            │   │               │
   └─────────┘  └────────────┘   └───────────────┘
```

### Principios de Diseno

1. **Provider-agnostic**: Todo pasa por la interfaz `BaseProvider.chat()` que retorna un `AsyncGenerator<StreamChunk>`. El agente no sabe ni le importa si el backend es Ollama, llama.cpp directo, o un endpoint remoto.

2. **Tools como contratos**: Cada tool define su schema Zod, su nivel de permiso (read/write/execute), y el agente las recibe como JSON schema en el system prompt. El modelo decide cuando usarlas.

3. **Context window consciente**: El ContextManager compacta automaticamente cuando se acerca al limite. Para modelos locales con ventanas de 4k-32k, esto es critico. La compactacion preserva el system prompt + los ultimos N mensajes.

4. **Seguridad por capas**: Modo plan (read-only) bloquea tools de escritura/ejecucion a nivel de agent loop, no de UI. Las tools con nivel `execute` requieren confirmacion explicita en el futuro.

---

## Fases de Desarrollo

### Fase 0 - Consolidacion y Estabilidad
**Objetivo**: Llevar el codigo existente a un estado solido y testeable antes de agregar features.

**Tareas**:
- [ ] Migrar el codigo de `qwerti_code/` al directorio principal `qwerti/` (o definir estructura definitiva del monorepo)
- [ ] Auditar y corregir imports, paths y dependencias rotas
- [ ] Verificar que `bun run dev` arranca sin errores y se puede chatear con un modelo Ollama local
- [ ] Escribir tests de integracion para el flujo critico: usuario envia mensaje -> agent loop -> provider -> respuesta streameada en TUI
- [ ] Escribir tests unitarios para: ToolRegistry, ContextManager, GlobalConfig, CommandRegistry
- [ ] Definir y documentar el contrato de `BaseProvider.chat()`: que recibe, que retorna, como maneja errores
- [ ] Limpiar el filtrado hardcodeado de tools en modo plan: usar `tool.permission` en vez de nombres

**Criterio de completitud**: `bun test` pasa, el agente conecta con Ollama, se puede chatear y ejecutar `/models`, `/add`, un tool `bash` y un `read_file`.

---

### Fase 1 - Tools Esenciales para un Agente de Codigo
**Objetivo**: El agente debe poder leer, buscar, editar y navegar un codebase real.

**Nuevas tools**:

| Tool | Descripcion | Permiso |
|:---|:---|:---|
| `edit_file` | Reemplazo exacto de strings en archivos (old_string -> new_string). Evita reescribir archivos completos. | write |
| `glob` | Busqueda de archivos por patron (ej. `**/*.ts`). Usa la API nativa de Bun o fast-glob. | read |
| `grep` | Busqueda de contenido en archivos por regex. Usa ripgrep si esta disponible, fallback a busqueda nativa. | read |
| `list_dir` | Lista contenido de un directorio con metadata basica (tipo, tamano). | read |

**Mejoras al tool system**:
- [ ] Agregar parametro `cwd` (working directory) a las tools que lo necesiten
- [ ] Implementar confirmacion del usuario antes de ejecutar tools `write` y `execute` (configurable)
- [ ] Agregar tool `edit_file` con validacion de unicidad del `old_string`
- [ ] Agregar tool `glob` para busqueda de archivos
- [ ] Agregar tool `grep` para busqueda de contenido
- [ ] Agregar tool `list_dir`

**Criterio de completitud**: El agente puede recibir la instruccion "busca todos los archivos .ts que contengan la palabra TODO y muestrame el contexto", y ejecutarlo correctamente encadenando glob + grep + read_file.

---

### Fase 2 - Gestion de Modelos y Descarga
**Objetivo**: El usuario puede descargar, registrar y alternar entre modelos sin salir de qwerti.

**Componentes**:

#### Descarga de modelos
- [ ] Implementar descarga desde Hugging Face usando la CLI `huggingface-hub` (Python) o la API HTTP directa de HF
- [ ] Flujo de `/add model`:
  1. Usuario ingresa el repo de HF (ej. `unsloth/Qwen3-4B-GGUF`)
  2. El sistema lista los archivos GGUF disponibles en ese repo (via HF API: `GET /api/models/{repo}/tree/main`)
  3. Usuario selecciona la cuantizacion deseada (Q2, Q4_K_M, Q5_K_M, Q8, etc.)
  4. Descarga con barra de progreso al directorio `~/.qwerti/models/`
  5. Se registra automaticamente en la config global
- [ ] Soporte para reanudacion de descargas interrumpidas (HTTP Range headers)
- [ ] Validar espacio en disco antes de iniciar descarga

#### Deteccion automatica de backend
- [ ] Al seleccionar un modelo, detectar automaticamente si Ollama esta corriendo (`GET http://localhost:11434/api/tags`)
- [ ] Si Ollama tiene el modelo: usarlo directamente
- [ ] Si no: verificar si llama-server esta disponible en PATH, y levantar un proceso con el GGUF descargado
- [ ] Fallback claro: si no hay backend disponible, indicar al usuario como instalar Ollama

#### Registro y alias
- [ ] Almacenar en config: `{ path, alias, backend, quantization, size, addedAt }`
- [ ] El comando `/models` muestra alias, tamano, backend activo y si el modelo esta cargado en memoria

**Criterio de completitud**: El usuario ejecuta `/add` -> selecciona Model -> ingresa `unsloth/Qwen3-4B-GGUF` -> ve opciones de cuantizacion -> descarga -> aparece en `/models` -> lo selecciona -> puede chatear.

---

### Fase 3 - Ingenieria de Contexto
**Objetivo**: El agente comprende la estructura del proyecto sin necesidad de leer cada archivo linea por linea.

**Componentes**:

#### Mapeo del repositorio
- [ ] Integrar Tree-sitter (via `tree-sitter` o `web-tree-sitter` para Bun) para parsear archivos fuente
- [ ] Generar un mapa compacto del repositorio: clases, funciones, exports, imports, tipos
- [ ] Formato del mapa (ejemplo):
  ```
  src/agent/agent-loop.ts
    export async function* runAgentLoop(params): AsyncGenerator<AgentEvent>
    type AgentEvent = { type: "text" | "tool_start" | "tool_result" | "error" | "done", ... }

  src/core/event-bus.ts
    export class EventBus
      on(event, handler): void
      emit(event, data): void
  ```
- [ ] El mapa se inyecta en el system prompt como contexto del workspace
- [ ] Regenerar el mapa solo cuando hay cambios (cache por mtime de archivos)

#### Contexto persistente del proyecto
- [ ] Soporte para archivo `.qwerti/CONTEXT.md` en la raiz del proyecto
- [ ] El contenido se inyecta como instrucciones adicionales en el system prompt
- [ ] El usuario define aqui: arquitectura, convenciones, patrones preferidos, dependencias clave

#### Mejoras al ContextManager
- [ ] Compactacion inteligente: en vez de "quedarse con los ultimos N mensajes", usar el modelo para resumir el historial descartado
- [ ] Token counting real: integrar un tokenizer compatible con el modelo activo (tiktoken para OpenAI-compat, o heuristica mejorada)
- [ ] Ventana de contexto configurable por modelo en la config

**Criterio de completitud**: Al abrir qwerti en un proyecto, el agente tiene visibilidad de la estructura sin que el usuario pegue el arbol de archivos manualmente.

---

### Fase 4 - Patrones de Orquestacion Avanzada
**Objetivo**: El agente puede resolver problemas complejos con estrategias multi-paso.

#### Bucle ReAct mejorado
- [ ] Implementar "promesas de completitud": antes de marcar una tarea como terminada, el agente verifica que se cumplen las condiciones de exito (ej. tests pasan, lint limpio)
- [ ] Si la verificacion falla, el harness externo fuerza otra iteracion automaticamente
- [ ] Limite configurable de iteraciones (default: 10, max: 50)

#### Modo Plan-and-Execute
- [ ] Separar el flujo en dos fases explicitas:
  1. **Planificacion**: El modelo analiza el problema y genera un plan estructurado (lista de pasos)
  2. **Ejecucion**: Cada paso se ejecuta secuencialmente, con validacion intermedia
- [ ] El plan se muestra al usuario para aprobacion antes de ejecutar
- [ ] Cada paso completado se marca visualmente en la TUI

#### Sub-agentes
- [ ] Soporte para lanzar tareas en paralelo (ej. buscar en multiples archivos simultaneamente)
- [ ] El agent loop principal puede delegar sub-tareas a instancias aisladas del loop
- [ ] Cada sub-agente tiene su propio contexto pero comparte el tool registry

**Criterio de completitud**: El agente puede recibir "refactoriza el modulo X de callbacks a async/await", generar un plan de N pasos, y ejecutarlo verificando que cada paso no rompe los tests.

---

### Fase 5 - Seguridad y Sandboxing
**Objetivo**: Ejecutar comandos de forma segura, especialmente cuando el modelo alucina o genera comandos destructivos.

**Componentes**:

#### Sandbox de ejecucion
- [ ] Ejecutar comandos `bash` dentro de un namespace restringido (en Linux: namespaces/cgroups, en macOS: sandbox-exec o container ligero)
- [ ] Lista blanca de directorios accesibles (cwd del proyecto + /tmp)
- [ ] Lista negra de comandos peligrosos (rm -rf /, dd, mkfs, etc.)
- [ ] Limite de recursos: CPU time, memoria, file descriptors

#### Confirmacion explicita
- [ ] Clasificar acciones por riesgo: bajo (read), medio (write), alto (execute/delete/network)
- [ ] Acciones de riesgo alto requieren confirmacion del usuario
- [ ] Modo "auto-approve" configurable para flujos autonomos (con advertencia clara)

#### Gestion de secretos
- [ ] Nunca mostrar contenido de .env en la respuesta del agente
- [ ] Filtrar variables de entorno sensibles (API keys, tokens) antes de pasarlas al modelo
- [ ] Integrar con Keychain (macOS) / libsecret (Linux) para credenciales de providers remotos

**Criterio de completitud**: Si el modelo genera `rm -rf /`, el comando es interceptado y bloqueado antes de ejecutarse.

---

### Fase 6 - Sistema de Skills Completo
**Objetivo**: Skills como modulos autocontenidos que extienden las capacidades del agente.

**Componentes**:
- [ ] Completar la importacion dinamica de tools en skill-loader.ts
- [ ] Formato de skill: directorio con `manifest.json` + `prompt.md` + `tools/*.ts`
- [ ] Skills built-in iniciales:
  - `commit`: Genera commits con mensaje basado en diff
  - `review`: Code review del diff actual o un PR
  - `explain`: Explica un archivo o funcion en detalle
  - `test`: Genera tests para un archivo o funcion
- [ ] Marketplace local: `~/.qwerti/skills/` con instalacion via `/add skill <git-url>`

**Criterio de completitud**: El usuario ejecuta `/add skill` -> ingresa URL de un repo git con una skill -> se clona y registra -> aparece en `/skills` -> el agente la usa cuando es relevante.

---

### Fase 7 - PTY y Experiencia Avanzada de Terminal
**Objetivo**: El agente puede ejecutar y observar comandos interactivos.

**Componentes**:
- [ ] Integrar `node-pty` (o el equivalente en Bun) para pseudo-terminales
- [ ] Captura de pantalla del PTY: serializar estado del terminal (texto + ANSI) para que el modelo lo interprete
- [ ] Soporte para comandos interactivos dentro del flujo del agente (ej. el agente ejecuta `npm init` y responde a las preguntas)
- [ ] Streaming visual: el usuario ve la salida del comando en tiempo real dentro de la TUI

**Criterio de completitud**: El agente puede ejecutar `git rebase -i HEAD~3`, interpretar la salida, y completar la operacion.

---

## Formatos de Tool Calling por Familia de Modelo

Un punto critico que el plan original no cubria. Cada familia de modelo tiene su propio formato para tool calling. El provider layer debe abstraer esto.

### Ollama (recomendado)
Ollama ya abstrae el formato de tool calling independientemente del modelo subyacente. Se envian tools como JSON schema en el campo `tools` del request, y el modelo responde con `tool_calls` en el mensaje. Este es el camino de menor friccion.

### llama.cpp server (modo directo)
El `llama-server` expone un endpoint `/v1/chat/completions` compatible con OpenAI. Soporta tool calling si el modelo fue entrenado para ello. Los formatos varian:

| Familia | Formato de tool call | Chat template |
|:---|:---|:---|
| Qwen 2.5/3 | Hermes-style `<tool_call>` tags | `chatml` con tool tokens |
| Llama 3.1+ | `<|python_tag|>` o JSON directo | `llama3` |
| Mistral | `[TOOL_CALLS]` JSON array | `mistral` |
| DeepSeek V2+ | `<tool_call>` JSON | `deepseek` |
| Phi-3/4 | JSON en `<|tool_call|>` | `phi3` |

**Estrategia de implementacion**:
1. Para Fase 0-2: usar exclusivamente Ollama que ya maneja esto internamente.
2. Para Fase 3+: implementar un `ToolCallParser` por familia que extraiga tool calls del texto raw cuando se use llama.cpp directo.

---

## Modos de Operacion

| Modo | Shortcut | Tools disponibles | Descripcion |
|:---|:---|:---|:---|
| **Build** (default) | Tab para alternar | Todas | El agente lee, escribe, ejecuta. Modo completo. |
| **Plan** | Tab para alternar | Solo read (read_file, glob, grep, list_dir) | Solo lectura. Para code review, exploracion, analisis. |

La restriccion de modo plan se implementa en el agent loop filtrando las tool definitions que se pasan al modelo. Si un tool no esta en la lista permitida, el modelo no sabe que existe.

---

## Sistema de Configuracion

### Config Global: `~/.qwerti/config.json`
```json
{
  "activeProvider": "ollama-local",
  "providers": [
    {
      "name": "ollama-local",
      "type": "ollama",
      "baseUrl": "http://localhost:11434",
      "model": "qwen3:4b"
    }
  ],
  "models": [
    {
      "alias": "Qwen3-4B",
      "path": "~/.qwerti/models/qwen3-4b-q4_k_m.gguf",
      "repo": "unsloth/Qwen3-4B-GGUF",
      "quantization": "Q4_K_M",
      "sizeBytes": 2700000000,
      "addedAt": "2026-03-10T00:00:00Z"
    }
  ],
  "theme": "qwerti",
  "logLevel": "info",
  "contextWindow": 32768,
  "maxIterations": 10,
  "autoApproveReads": true,
  "autoApproveWrites": false
}
```

### Config de Workspace: `.qwerti/config.json`
```json
{
  "activeProvider": "ollama-local",
  "contextWindow": 16384,
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    }
  },
  "skills": ["commit", "review"],
  "systemPromptExtra": "Este proyecto usa Bun como runtime. No sugieras npm."
}
```

### Precedencia
Workspace config sobreescribe global config para las keys que define. El merge es shallow (por key de primer nivel).

---

## Pantalla de Inicio

Al iniciar el agente se muestra la animacion de intro definida en `tui/intro.ts`. La animacion base y assets estan en el directorio `qwerti_code`. El flag `--no-intro` la omite.

La intro debe:
- Durar maximo 1.5 segundos
- Mostrar el nombre "qwerti" con el color del tema activo
- Transicionar suavemente al prompt de input

---

## Criterios de Calidad Transversales

### Performance
- **Regla de los 100ms**: El usuario debe ver feedback (spinner, texto parcial) en menos de 100ms tras enviar un mensaje. El streaming del provider hace esto natural, pero el overhead de la TUI no debe agregarse.
- **Cold start < 500ms**: El tiempo desde `qwerti` en terminal hasta prompt listo debe ser menor a 500ms. Bun ayuda, pero hay que evitar imports pesados en el path critico.
- **Tool execution**: Timeout default de 120s. Si un comando tarda mas, se mata y se reporta timeout al modelo.

### Testing
- Tests unitarios para cada tool, cada comando, config, context manager
- Tests de integracion para el flujo completo (mock del provider)
- Tests E2E opcionales con un modelo real (Ollama + modelo pequeno)
- CI con `bun test` en cada push

### Logging
- Pino con structured logging a `~/.qwerti/logs/qwerti.log`
- Nivel configurable: debug, info, warn, error
- En modo verbose (`VERBOSE=1`), log a stderr con pretty printing
- Nunca loggear contenido de archivos completos ni secretos

---

## Dependencias Externas y Requisitos del Sistema

| Dependencia | Requerida | Proposito |
|:---|:---|:---|
| Bun >= 1.0 | Si | Runtime |
| Ollama | Si (Fase 0-2) | Backend de inferencia principal |
| huggingface-cli | No (Fase 2) | Descarga de modelos. Alternativa: API HTTP directa |
| llama.cpp (llama-server) | No (Fase 3+) | Backend alternativo para GGUF directo |
| ripgrep (rg) | No | Acelera grep tool. Fallback a busqueda nativa |
| tree-sitter | No (Fase 3) | Parsing de AST para mapeo de repositorio |
| node-pty | No (Fase 7) | Pseudo-terminales para comandos interactivos |

---

## Referencia: Metodologia de Pruebas Autonomas

El sistema de pruebas autonomas esta documentado en detalle en `Test.md`. Resume:

- **4 elementos base**: Objetivo, Environment, Worker, memory.md
- **Bucle**: Observacion -> Diagnostico -> Hipotesis -> Ejecucion -> Validacion -> Cierre
- **Reglas**: Atomicidad (1 cambio por ciclo), restriccion de recursos, autonomia total (sin intervenciones humanas), inmutabilidad del historial
- **Resiliencia**: ~5 min por experimento, timeout a 10 min, manejo autonomo de crashes, el bucle no se detiene hasta interrupcion manual

Esta metodologia aplica cuando qwerti se usa para desarrollo autonomo extendido (ej. optimizacion de un componente durante la noche).
