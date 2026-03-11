# Plan: Rediseno Visual de la TUI de Qwerti (estilo Claude Code)

## Objetivo

Transformar la interfaz de un estilo "neon hacker" con bordes pesados y sidebar,
a un estilo minimalista inspirado en Claude Code: limpio, sin bordes innecesarios,
colores suaves, full-width.

Todos los cambios son visuales (colores, bordes, layout). No se toca logica de
negocio, agent loop, handleSubmit, event bus, ni state management.

---

## Fase 1: Nuevo tema "minimal" como default

**Archivo**: `src/tui/theme.ts`

- Agregar tema `minimal` al objeto `themes` con esta palette:

```
primary: "#6B9BFA"          (azul suave - acentos)
secondary: "#8B8B8B"        (gris)
accent: "#6B9BFA"           (azul)
text: "#E8E8E8"             (blanco suave)
textDim: "#666666"          (gris dim)
background: ""
error: "#E85A5A"            (rojo suave)
warning: "#E8A84C"          (naranja suave)
success: "#5AE87A"          (verde suave)
userMessage: "#6B9BFA"      (azul para prompt del usuario)
assistantMessage: "#E8E8E8"
toolCall: "#8B8B8B"         (gris para tool calls)
```

- Cambiar default del constructor de `ThemeManager` de `"qwerti"` a `"minimal"`.

---

## Fase 2: Reescribir layout principal

**Archivo**: `src/tui/app.tsx`

- Eliminar import de `Sidebar` (de `./components/sidebar.tsx`).
- Reemplazar import de `Header` por `HeaderLine` (del header.tsx reescrito).
- Eliminar `<Sidebar>` del JSX.
- Eliminar `borderStyle="round"` y `borderColor` del Box que envuelve MessageList.
- Agregar `<HeaderLine>` como primer hijo del layout.

Nuevo layout (sin sidebar, sin bordes):

```
Box (column, 100% height)
  HeaderLine (linea simple: ~/path  model  mode)
  MessageList (flexGrow=1, SIN bordes, full width)
  StatusBar (linea simple, sin bordes)
  InputBox (prompt limpio, sin bordes)
  Dialogs (overlays - mantener)
```

---

## Fase 3: Reescribir header.tsx como HeaderLine

**Archivo**: `src/tui/components/header.tsx`

Reemplazar componente completo. De un box con bordes a una linea simple:

```
~/Downloads/project  qwen3:4b  build
```

- Exportar `HeaderLine` en vez de `Header`.
- Props: `cwd`, `model`, `mode`, `theme`.
- Path con `~` (reemplazar HOME) en `textDim`.
- Modelo en `secondary`.
- Modo en `success`/`warning` segun build/plan.
- Sin bordes, solo `paddingX={1}` y `justifyContent="space-between"`.

---

## Fase 4: Restylar MessageList

**Archivo**: `src/tui/components/message-list.tsx`

- User messages: `> texto` con prefix en `theme.userMessage` (azul), sin cambios (ya esta bien).
- Assistant messages: texto limpio sin marginLeft excesivo.
- Tool calls: prefijo `- tool_name (args...)` en gris (`theme.toolCall`), sin emoji wrench.
  Output indentado con `borderLeft` en `textDim` (en vez de `primary`).
- Thinking: spinner en `theme.textDim` en vez de `theme.accent` brillante.

---

## Fase 5: Restylar MarkdownRenderer

**Archivo**: `src/tui/components/markdown-renderer.tsx`

- Code blocks: eliminar pipe `|` coloreado (`theme.primary`). Usar `marginLeft={2}` con
  texto en `theme.text`. Label de lenguaje en dim. Sin color accent en el codigo.
- Headers (`#`, `##`): `theme.text` bold en vez de `theme.primary`/`theme.secondary`.
- Bullets: `- ` en `textDim` en vez de `* ` en `primary`.
- Numbered lists: numero en `textDim` en vez de `primary`.
- Inline code: background sutil `#2A2A2A` con `theme.text` (en vez de `#333333` con `theme.accent`).

---

## Fase 6: Simplificar StatusBar

**Archivo**: `src/tui/components/status-bar.tsx`

- Eliminar `borderStyle="single"` y `borderColor`.
- Eliminar cwd del display (ya lo muestra HeaderLine).
- Eliminar texto "Ready" - solo mostrar error cuando hay error.
- Queda: `model | mode` en dim, error en rojo cuando existe.
- Mantener props `cwd`, `model`, `provider`, `mode` por compatibilidad aunque `cwd` no se use.

---

## Fase 7: Restylar InputBox

**Archivo**: `src/tui/components/input-box.tsx`

- Eliminar `borderStyle="single"` y `borderColor`.
- Placeholder: color de `"gray"` hardcoded a `theme.textDim`.
- Texto disabled: de `"gray"` a `theme.textDim`.
- Cursor (bloque): `backgroundColor` de `"white"` a `theme.primary`.

---

## Fase 8: Restylar CommandSuggestions

**Archivo**: `src/tui/components/command-suggestions.tsx`

- Eliminar `borderStyle="single"` y `borderColor`.
- Selected item: `> /cmd` en `theme.primary` + bold, sin `inverse`.
- Non-selected: `  /cmd` en `theme.textDim`.

---

## Fase 9: Restylar Dialogs

**Archivos**:
- `src/tui/components/dialog-overlay.tsx`
- `src/tui/components/help-dialog.tsx`
- `src/tui/components/select-list.tsx`
- `src/tui/components/text-prompt.tsx`
- `src/tui/components/add-wizard.tsx`

Cambios:

- **dialog-overlay**: border de `"round"` a `"single"`, color de `theme.primary` a `theme.textDim`.
  Titulo en `theme.text` (blanco) en vez de `theme.primary`.
- **help-dialog**: headers de seccion en `theme.text` en vez de `theme.accent`.
  Keybinding keys en `theme.primary`. Slash commands en `theme.primary`.
- **select-list**: hacer `theme` prop opcional. Reemplazar hardcoded `"green"`/`"cyan"` por
  colores del tema (`theme.primary`, `theme.text`, `theme.textDim`). Fallbacks a colores minimal.
- **text-prompt**: hacer `theme` prop opcional. Reemplazar `"cyan"` hardcoded por `theme.primary`.
  Placeholder de `"gray"` a `theme.textDim`. Cursor background de `"white"` a `theme.primary`.
- **add-wizard**: `borderColor` de `theme.primary` a `theme.textDim`.

---

## Fase 10: Actualizar intro

**Archivo**: `src/tui/intro.ts`

- Cambiar `ACCENT` de `"#00FF00"` (verde neon) a `"#6B9BFA"` (azul suave).
- El logo pasa de verde a azul.

---

## Verificacion

1. `bun run dev` (o `bun src/index.tsx`)
2. Verificar que la app arranca sin errores.
3. Verificar shortcuts: Tab (cambiar modo), Esc (salir), Ctrl+H (help).
4. Verificar comandos: `/models`, `/add`, `/theme`.
5. Verificar que el chat funciona y los mensajes se renderizan bien.
6. Verificar que tool calls se muestran correctamente.

---

## Notas

- `sidebar.tsx` queda como dead code (ya no se importa). Se puede eliminar despues.
- El error TS preexistente de `closeSuggestionsRef` en `app.tsx` no es parte de este cambio.
- Riesgo: BAJO. Todos los cambios son puramente visuales.
