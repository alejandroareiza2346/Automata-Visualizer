# Guía de Uso - Automata Visualizer

Esta guía explica paso a paso cómo utilizar la aplicación para crear, simular, convertir y minimizar autómatas finitos (DFA / NFA), así como exportar resultados y generar expresiones regulares.

## 1. Inicio Rápido

1. Instalar dependencias:

   ```powershell
   npm ci
   ```

2. Arrancar entorno de desarrollo:

   ```powershell
   npm run dev
   ```

3. Abrir el navegador en: <http://localhost:5173> (o puerto alterno indicado en terminal).

Al cargar por primera vez se muestra un ejemplo de DFA (termina en 01).

## 2. Interfaz Principal

- Lienzo (grafo): muestra los estados (círculos) y transiciones (flechas con símbolo).
- Panel de control superior: acciones (convertir NFA→DFA, minimizar, generar regex, exportar, importar, ejemplos, modo DFA, etc.).
- Panel alfabeto: gestionar símbolos del alfabeto.
- Panel de simulación: ingresar cadena y ejecutar simulación (completa o paso a paso).
- Mensajes en vivo / estado: confirmaciones de exportación y avisos de rendimiento.

## 3. Crear y Editar Estados

- Botón / atajo `N`: pide un identificador (sin espacios). Si es el primer estado se marca como inicial automáticamente.
- Renombrar: seleccionar el estado (click) y usar opción de renombrar (si la UI lo expone) o flujo futuro; hoy se espera añadir control (puede integrarse manualmente en código si se desea).
- Marcar aceptador: seleccionar y usar botón "toggle accept" (según implementación actual) o usar la acción contextual (si disponible). Actualmente se alterna desde la lista / store (UI básica presente).
- Cambiar estado inicial: seleccionar otro estado y marcar como inicio (el anterior se desmarca).
- Eliminar: seleccionar y presionar `Delete` (si no rompe consistencia del autómata deseado).

## 4. Transiciones

- Crear transición: atajo `T` (prompts: origen, símbolo, destino) o controles UI.
- Determinismo: en modo DFA no se permite duplicar `(from, symbol)` hacia diferentes destinos.
- Edición: seleccionar transición (click en la arista) y actualizar (si UI habilita) o usar import/export para edición avanzada.
- Eliminación: seleccionar y `Delete`.

## 5. Alfabeto

- Agregar símbolo: panel alfabeto → ingresar símbolo (sin espacios).
- Eliminar símbolo: solo posible si no está en uso por ninguna transición.
- Actualización automática: al agregar transiciones con símbolo nuevo se incorpora ordenadamente.

## 6. Simulación

### 6.1 Modo DFA

1. Ingresar cadena en el campo de simulación.
2. Presionar Enter o el botón de ejecutar.
3. Resultado: aceptado / rechazado y log interno (se usa para animar pasos).
4. Paso a paso:
   - `Space`: avanza 1 transición.
   - `R`: reinicia (vuelve a paso 0).

### 6.2 Modo NFA (con ε)

- Permite ramificación. El log muestra una traza lineal representativa (camino seguido en una aceptación) con cierres ε implícitos.
- La conversión NFA→DFA genera tabla de subconjuntos: se guarda en `subsetTrace` para visualización (cuando se implemente panel dedicado).

## 7. Conversión NFA → DFA

1. Asegurarse de que el autómata contiene posibles no determinismos o transiciones ε.
2. Clic en "Convertir NFA".
3. Resultado: autómata almacenado ahora es DFA; `dfaMode` activado; se guarda traza de subconjuntos.
4. Recomendado: ejecutar simulaciones para verificar equivalencia (ya hay pruebas automatizadas que cubren casos base).

## 8. Minimización de DFA

1. Confirmar que el autómata es determinista (si no, convertir primero).
2. Clic en "Minimizar".
3. Se aplica poda de inalcanzables + particionamiento (Hopcroft adaptado) + reconstrucción.
4. Modo de solo lectura (readOnly) activado tras minimización para evitar inconsistencias posteriores. Puede desactivarse manualmente desde la barra superior (toggle de edición) si se desea modificar post-minimización.

## 9. Generación de Expresión Regular

1. Minimizar primero (recomendado) para reducir explosión combinatoria.
2. Clic en "Generar Regex".
3. Se usa eliminación de estados con heurísticas básicas. Resultado: cadena regex mostrada en el panel (si implementado) o accesible desde store.
4. Limitaciones: no busca forma mínima; posible redundancia.

## 10. Exportar e Importar

### 10.1 Exportar

- JSON: (Ctrl+E) copia al portapapeles y descarga `automata.json`.
- PNG: botón "PNG" (escala configurable). Se anuncia por live region.
- SVG: botón "SVG" (usa plugin `cytoscape-svg`).

### 10.2 Importar

1. (Ctrl+I) o botón de importación (si presente) → pegar JSON con estructura válida:

   ```json
   {
     "alphabet": ["0","1"],
     "states": [ {"id":"q0","start":true}, {"id":"q1"}, {"id":"q2","accept":true} ],
     "transitions": [ {"from":"q0","to":"q1","symbol":"0"} ]
   }
   ```

2. Validaciones:
   - Único estado inicial.
   - Referencias de transiciones válidas.
   - Derivación automática de alfabeto.
3. Errores se reportan con mensaje y no alteran el autómata actual.

## 11. Deshacer / Rehacer

- Deshacer: historial de hasta 50 snapshots. (Uso previsto: botones UI / pronto atajos).
- Rehacer: disponible mientras no se haya ramificado el historial.

## 12. Accesibilidad

- Live region para mensajes de exportación y simulación.
- Estados activos resaltados con animación leve (compatible con contraste).
- Próximas mejoras sugeridas: aria-label enriquecido para nodos y tabla de transiciones accesible.

## 13. Errores Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| No puedo agregar transición en modo DFA | Ya existe (from,symbol) | Cambiar símbolo o convertir a NFA (desactivar modo DFA) |
| Minimizar no cambia nada | Ya estaba mínimo | Verifica estados inalcanzables o redundantes manualmente |
| Regex muy grande | Automátas no minimizado o denso | Minimizar primero; reducir estados |
| Import falla | JSON inválido o duplicados | Revisar id únicos y un solo start |

## 14. Buenas Prácticas

- Minimizar antes de generar regex.
- Mantener identificadores de estado cortos y descriptivos.
- Evitar símbolos multi-caracter mientras no se necesite (simplifica lectura).
- Guardar export JSON antes de transformaciones irreversibles (como limpieza manual).

## 15. Flujo Sugerido de Trabajo

1. Diseñar NFA inicial (más natural para ciertas expresiones).
2. Probar cadenas claves (aceptadas y rechazadas).
3. Convertir a DFA.
4. Minimizar.
5. Generar expresión regular si se requiere para documentación.
6. Exportar JSON + PNG/SVG para informes.

## 16. Atajos de Teclado (Resumen)

| Atajo | Acción |
|-------|--------|
| N | Nuevo estado |
| T | Nueva transición |
| Space | Paso simulación |
| R | Reset simulación |
| Delete | Eliminar seleccionado |
| Ctrl+I | Importar JSON |
| Ctrl+E | Exportar JSON |
| Enter | Ejecutar simulación |

## 17. Resolución de Problemas

- Si el grafo se ve desordenado: refrescar (F5) o reimportar.
- Si se pierde el estado por error grave: limpiar `localStorage` del navegador (clave `automaton_state_v1`).
- Si no exporta SVG: confirmar que el plugin `cytoscape-svg` cargó (mirar consola).

## 18. Extender la Herramienta

- Añadir nuevos algoritmos en `utils/algorithms.ts` manteniendo pureza.
- Exponer acciones en la UI creando componentes en `components/` y usando el store.
- Actualizar pruebas en `__tests__/` asegurando cobertura.

## 19. Licencia

MIT. Ver archivo `LICENSE`.

---
¿Algo que falta? Abre un issue o mejora la guía.
