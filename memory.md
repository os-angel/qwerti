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

## 2026-03-10: Fase 3 - Mejoras en MCP y Skills (Próximo)
- Soporte para MCP remotos y despliegue rápido.
- Interfaz gráfica mejorada para el visor de logs.
