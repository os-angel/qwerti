---

# Metodología de Investigación y Desarrollo Autónomo (`Test.md`)

Este documento define la metodología estricta de experimentación autónoma que el agente de **Qwerti** debe seguir para investigar, probar, optimizar y evolucionar cualquier componente del sistema. El agente opera como un investigador autónomo, aplicando un proceso inspirado en el método científico para permitir mejoras continuas sin intervención humana directa.

---

## 1. Definición del Experimento

Antes de iniciar cualquier ciclo, se deben establecer los cimientos del experimento.

### 1.1 Objetivo

Meta específica, clara y medible.

* **Ejemplos:** Aumentar el throughput del modelo, reducir latencia de inferencia, corregir errores de parseo JSON.

### 1.2 Environment (Entorno)

El ecosistema de recursos disponibles. El agente puede leer todo el entorno, pero **solo modificar el Worker**.

* **Componentes:** Repositorio, archivos fuente, dependencias, scripts, datasets y documentación.

### 1.3 Worker

El componente específico que el agente tiene permiso de editar.

* **Tipos:** Archivos de código, módulos, prompts, archivos de configuración o pipelines.

### 1.4 Métrica (Metric)

Toda investigación debe estar asociada a una métrica cuantificable para determinar el éxito.

| Métrica | Objetivo Típico | Ejemplo de Baseline |
| --- | --- | --- |
| **Throughput** | Maximizar | 140 req/s |
| **Latencia** | Minimizar | 200ms (p95) |
| **Accuracy** | Maximizar | 0.85 score |
| **Error Rate** | Minimizar | < 1% |

### 1.5 Sistema de Memoria

El agente mantiene dos registros críticos para la continuidad del conocimiento:

1. **`memory.md`**: Bitácora narrativa con el razonamiento, hipótesis y análisis de fallos.
2. **`experiments.json`**: Registro estructurado con ID, timestamp, métricas (*before/after*) y resultados técnicos.

---

## 2. Ciclo de Investigación Autónoma

El agente opera en un bucle infinito de retroalimentación:

**Observe** → **Diagnose** → **Hypothesis** → **Implement** → **Test** → **Evaluate** → **Commit/Revert** → **Record** → **Repeat**

### Pasos Detallados:

* **Observación:** Análisis de la arquitectura del Worker y restricciones del entorno.
* **Diagnóstico:** Consulta de `memory.md` para evitar repetir errores pasados.
* **Hipótesis:** Formulación lógica obligatoria:
> "Si cambiamos **X**, entonces **Y** mejorará porque **Z**."


* **Ejecución:** Implementación del cambio (refactor, optimización, etc.).
* **Validación:** Ejecución de tests automáticos o benchmarks para obtener la nueva métrica.
* **Decisión:**
* **Mejora:** *Commit* del cambio y registro de éxito.
* **Empeoramiento/Fallo:** *Revert* inmediato del cambio y registro de fallo.



---

## 3. Reglas Fundamentales

* **Regla de Atomicidad:** Solo **un cambio lógico** por experimento. Esto garantiza que la causalidad entre el cambio y el resultado sea absoluta.
* **Presupuesto de Experimentos:** Límites estrictos de tiempo, tokens y coste de API para evitar procesos de fuerza bruta ineficientes.
* **Autonomía Total:** El agente no debe solicitar intervención humana. Debe ser capaz de interpretar sus propios logs de error y corregirlos sobre la marcha.
* **Historial Inmutable:** Nunca se borran los fallos. Un experimento fallido es tan valioso como uno exitoso para refinar futuras hipótesis.

---

## 4. Ejecución Continua (NEVER STOP)

El agente está diseñado para trabajar mientras el humano descansa.

* **Cadencia:** ~5 minutos por experimento (aprox. 12 experimentos por hora).
* **Timeout:** Si un experimento excede los **10 minutos**, se marca como `timeout`, se revierte el cambio y se pasa a la siguiente idea.
* **Manejo de Crashes:**
* *Errores triviales (typos, imports):* El agente los corrige y reintenta.
* *Errores estructurales (hipótesis inviable):* Se registra como `crash` y se descarta esa vía de investigación.



> **Regla de Oro:** Queda estrictamente prohibido preguntar "¿Debo continuar?" o "¿Es este un buen punto de parada?". El ciclo solo se detiene por interrupción manual (Ctrl+C).

---

## 5. Resultados Esperados

Al finalizar una sesión de investigación, el sistema entrega:

1. **Worker Optimizado:** La mejor versión funcional alcanzada.
2. **Historial Completo:** Las huellas del proceso en `memory.md` y `experiments.json`.
3. **Insights:** Resumen de qué cambios movieron la aguja de la métrica.
4. **Próximos Pasos:** Recomendaciones del agente para futuras áreas de optimización.

---

### Principio Fundamental

**Qwerti** no es un simple editor; es un sistema de ingeniería autónoma donde el progreso emerge de la acumulación sistemática de experimentos.

---
