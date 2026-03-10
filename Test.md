# Metodología de Pruebas y Desarrollo Autónomo (Test.md)

Este documento define la metodología estricta que el agente autónomo de Qwerti debe seguir para evaluar, probar e iterar sobre cualquier componente o funcionalidad del proyecto. El sistema funcionará como un investigador incansable bajo los siguientes principios.

---

## 1. Elementos Base de la Prueba
Para iniciar cualquier flujo de prueba, se deben definir y facilitar siempre los siguientes 4 elementos fundamentales:

1. **Objetivo a cumplir**: La meta específica que el agente debe alcanzar (ej. "Aumentar el throughput del modelo", "Arreglar el parseo de la salida JSON", etc.).
2. **Environment (Entorno)**: Todos los archivos, directorios y el contexto general del proyecto que son accesibles y necesarios para realizar el trabajo.
3. **Worker**: El sujeto o archivo(s) editable(s) que el agente debe (y tiene permitido) modificar para cumplir el objetivo. **Debe tener una métrica o salida completamente medible** para evaluar el éxito o fracaso.
4. **`memory.md`**: El archivo bitácora maestro donde se registra cronológicamente *todo* lo que se hizo, el porqué de la hipótesis, y si funcionó o no. Es vital para documentar la evolución y evitar bucles infinitos de intentos fallidos.

---

## 2. El Bucle de Experimentación (El Proceso Central)
El agente operará de forma autónoma en un ciclo iterativo continuo:

1. **Observación**: Lectura profunda del *Environment* para comprender las reglas y restricciones tecnológicas, y del *Worker* para evaluar el estado y arquitectura actual.
2. **Diagnóstico**: Consulta exhaustiva a `memory.md` para identificar qué caminos y enfoques ya han sido explorados anteriormente.
3. **Hipótesis**: Formulación de un cambio específico y justificado bajo la premisa lógica: *"Si cambio [X], entonces el resultado [Y] mejorará porque [Z]"*.
4. **Ejecución**: Aplicación de los cambios propuestos directamente en el archivo *Worker*.
5. **Validación**: Ejecución de un proceso de prueba (script automático, test unitario, o evaluación medible) para cuantificar el impacto real de la modificación.
6. **Cierre de Ciclo**:
    *   **Si el resultado es POSITIVO (Mejora validada):** Se mantiene y consolida el cambio (se avanza la iteración o rama de desarrollo).
    *   **Si el resultado es NEGATIVO (Fallo o empeoramiento):** Se revierte al estado funcional anterior y se documenta obligatoriamente el fallo y el aprendizaje derivado en `memory.md`.

---

## 3. Reglas de Oro (Constraints Inquebrantables)

*   **Regla de Atomicidad:** Solo se permite **un cambio lógico por ciclo**. Modificar múltiples sistemas, funciones u objetivos a la vez impide identificar qué factor fue el responsable de la mejora o el fallo.
*   **Restricción de Recursos:** Cada ciclo debe tener un límite estricto (ya sea de tiempo, uso de tokens, presupuesto de API o intentos máximos permitidos). Esto obliga al agente a optimizar su capacidad de resolución y a no recurrir a enfoques de "fuerza bruta".
*   **Autonomía de Error:** El agente tiene **estrictamente prohibido pedir intervención humana** durante la ejecución del bucle. Debe tener la capacidad absoluta de leer, interpretar y subsanar los mensajes de error del sistema por sí mismo.
*   **Inmutabilidad del Historial:** Nunca se borran, ocultan o editan los fallos y registros pasados de `memory.md`. Los errores representan datos de valor incalculable que dirigen y refinan la siguiente hipótesis.

---

## 4. Resiliencia y Flujo de Trabajo Continuo (NEVER STOP)

El agente está concebido para trabajar ininterrumpidamente, explorando e investigando en segundo plano (por ejemplo, mientras el usuario duerme. Estimado: ~12 experimentos por hora a razón de 5 min/experimento):

*   **Timeout (Tiempo de Espera):** Cada experimento individual completo debe tomar aproximadamente **5 minutos** (más una pequeña sobrecarga de arranque y evaluación). Si la ejecución sobrepasa los 10 minutos, se aborta automáticamente, se califica como fallo por timeout (se descarta y se revierte el código).
*   **Manejo de Crashes:** Si la ejecución falla catastróficamente (Errores de memoria OOM, bugs de sintaxis brutales, etc.), el agente aplicará su criterio autónomo:
    *   Si es un error trivial o simple de corregir (un typo, un import faltante, un error de linting), lo soluciona rápidamente y vuelve a ejecutar.
    *   Si la idea base es lógicamente inviable o rota, registra `"crash"` como estado en la bitácora, asume la derrota total de esa vía y pasa directamente a la siguiente hipótesis.
*   **LA REGLA DEL NUNCA DETENERSE:** Una vez que el bucle de experimentación se inicia (tras el *setup* inicial de entorno), el agente **NO DEBE PAUSARSE bajo ninguna circunstancia** para pedir permiso o confirmación al humano.
    *   Preguntas tipo *"¿Debo continuar?"* o *"¿Es este un buen punto de parada?"* quedan absolutamente descartadas.
    *   El humano espera que el agente trabaje indefinidamente hasta que sea interrumpido manualmente.
    *   Si las ideas obvias se agotan, el agente debe redoblar el esfuerzo analítico: releer documentos de contexto, repasar papers referenciados en el código, reconsiderar vías descartadas combinándolas, buscar ángulos distintos o proponer cambios arquitectónicos radicales.
    *   **El bucle iterativo corre hasta la interrupción humana manual, punto.**

---

## 5. Entregables y Resultados Esperados
Al finalizar una sesión de trabajo autónomo (ya sea por completar todas las optimizaciones posibles o al ser detenido manualmente por el humano), el sistema entregará obligatoriamente los siguientes artefactos:

1.  **La Versión Optimizada:** El archivo *Worker* funcional, depurado y en su métrica más alta / mejor variante posible alcanzada.
2.  **Log de Evolución (`memory.md`):** Reflejo exhaustivo de *todas* las versiones que fallaron, ilustrando el porqué de cada camino tomado y descartado.
3.  **Insights de Eficiencia:** Un resumen conciso destacando qué cambios precisos provocaron los aumentos más sustanciales de rendimiento o éxito.
4.  **Siguiente Paso Recomendado:** La visión experta del agente sobre qué componente exacto debería priorizarse a continuación si dispusiese de más presupuesto, iteraciones, recursos o tiempo computacional.
