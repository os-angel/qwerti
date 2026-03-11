# Plantilla de Experimento

> Instrucciones: Llena las secciones marcadas con `[...]`.
> Para ejecutar: "Ejecuta el experimento de plantillaExperimento.md bajo la metodologia Test.md"
> El agente leerá este archivo, aplicará el ciclo de Test.md, y registrará resultados
> en `memory.md` y `experiments.json`.

---

## 1. Objetivo

[Descripcion clara y medible de lo que se quiere lograr]

**Ejemplo:** Reducir la latencia p95 del endpoint /chat de 400ms a 200ms.

---

## 2. Hipotesis

> "Si cambiamos **[X]**, entonces **[Y]** mejorará porque **[Z]**."

---

## 3. Environment (solo lectura)

Archivos o modulos que el agente puede LEER como contexto, pero NO modificar.

| Recurso | Path |
|---------|------|
| [nombre] | [path relativo] |
| [nombre] | [path relativo] |

---

## 4. Worker (editable)

Archivos que el agente PUEDE modificar durante el experimento.

| Archivo | Justificacion |
|---------|---------------|
| [path relativo] | [por que se modifica este archivo] |
| [path relativo] | [por que se modifica este archivo] |

---

## 5. Metrica

| Campo | Valor |
|-------|-------|
| **Nombre** | [ej: Latencia p95, Accuracy, Error Rate, Throughput] |
| **Direccion** | [Minimizar / Maximizar] |
| **Baseline (antes)** | [valor actual o "medir antes de empezar"] |
| **Target (despues)** | [valor objetivo] |
| **Como medir** | [comando, test, benchmark, script] |

---

## 6. Validacion

Comando(s) que el agente debe ejecutar para obtener la metrica:

```bash
[comando de test o benchmark]
```

**Criterio de exito:** [condicion concreta, ej: "test pasa sin errores", "latencia < 200ms"]

**Criterio de fallo:** [condicion para revert, ej: "test falla", "metrica empeora"]

---

## 7. Restricciones

- **Timeout:** [minutos, default: 10]
- **Max intentos:** [numero, default: 3]
- **Archivos prohibidos:** [archivos que NO se deben tocar, ej: package.json, .env]
- **Notas extra:** [cualquier limitacion adicional]

---

## 8. Contexto previo

Experimentos anteriores relacionados que el agente debe consultar antes de empezar:

- [EXP-XXX: breve descripcion]
- [o "Ninguno" si es nuevo territorio]

---

> **Recordatorio para el agente:**
> 1. Lee `memory.md` antes de empezar para no repetir errores.
> 2. Un solo cambio logico por iteracion (regla de atomicidad).
> 3. Si mejora: commit + registro en `experiments.json` y `memory.md`.
> 4. Si empeora: revert inmediato + registro del fallo.
> 5. Nunca preguntes si continuar. Solo para por timeout o exito.
