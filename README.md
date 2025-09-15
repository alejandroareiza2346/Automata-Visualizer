# Automata Visualizer

<!-- Badges (actualizar OWNER/REPO tras subir a GitHub) -->
![CI](https://img.shields.io/github/actions/workflow/status/OWNER/REPO/ci.yml?branch=main&label=CI)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Aplicación React + TypeScript para crear, simular y transformar autómatas finitos (DFA/NFA) incluyendo:

- Conversión NFA → DFA (subset construction) con traza detallada
- Minimización de DFA (Hopcroft adaptado + poda de inalcanzables)
- Generación heurística de expresión regular a partir de un DFA
- Simulación paso a paso (log estructurado) y simulación completa
- Detección de no determinismo (conflictos `from+symbol`)
- Importación / Exportación JSON con validación (AJV + chequeos manuales)
- Persistencia localStorage y undo/redo (cap 50 estados históricos)
- Atajos de teclado para productividad
- Cobertura de pruebas con Vitest (c8)

Especificación extendida: ver `quehayquehacer.MD`.

## Estado Actual (Feature Set)

- DFA y NFA: simulación (incluye ε) y log
- Subset construction: conversión y traza (`subsetTrace` en store)
- Minimización: particionamiento iterativo, colapso estados equivalentes
- Regex: generación (state elimination) básica
- Undo/Redo: implementado con límite de 50 snapshots
- Import/Export: JSON derivando alfabeto de transiciones
- Validación: JSON Schema draft-07 + validaciones lógicas
- Accesibilidad: alertas de error de simulación (role=alert), atajos teclado globales
- Tests: equivalencia NFA→DFA, minimización bordes, errores importación, conflictos determinismo, consistencia regex
- Persistencia: localStorage automática tras mutaciones
- Atajos: Delete, Ctrl+I, Ctrl+E, N, T, Space, R, Enter

## Roadmap (Pendiente / Próximo)

- Mejoras de simplificación regex (absorción, factoring, redundancias)
- Heurísticas para reducir crecimiento en DFA densos (orden de eliminación de estados)
- Optimizar layout (preservar posiciones manuales y animaciones)
- Export JSON incremental (solo diff) para integraciones externas
- Pruebas de rendimiento automatizadas (bench minimización / regex)
- Internacionalización (i18n) interfaz

## Limitaciones de la Generación de Regex

La conversión DFA→Regex implementada es heurística y NO garantiza una expresión mínima. Limitaciones conocidas:

1. Explosión combinatoria: en DFAs densos el tamaño crece rápidamente (state elimination sin heurísticas avanzadas de reducción).
2. Redundancias: no se aplican simplificaciones agresivas (ej. `(a|a)` → `a`, `εa` → `a`, factorizaciones comunes profundas).
3. Agrupación mínima: paréntesis añadidos de forma conservadora.
4. No se detectan subexpresiones equivalentes para reuso.
5. Posible crecimiento exponencial en autómatas no minimizados (recomendado minimizar antes de generar regex).

Recomendaciones al usuario:

- Minimizar siempre el DFA antes de generar la regex.
- Para análisis formal, considerar aplicar herramientas externas de simplificación regex.
- Evitar generar regex de autómatas con > ~25 estados sin minimización previa.

## Quick Start

Clonar y ejecutar (Windows PowerShell):

```powershell
git clone https://github.com/OWNER/REPO.git
cd REPO
npm ci
npm run verify
npm run dev
```

Abrir: <http://localhost:5173>

Actualizar OWNER/REPO tras publicar el repositorio.

## Guía de Uso

Para un recorrido detallado de todas las funciones (creación/edición de estados y transiciones, simulación paso a paso, conversión NFA→DFA, minimización, generación de regex, importación/exportación y buenas prácticas) consulta la guía completa en:

`docs/GUIA_USO.md`

Si visualizas este README en GitHub puedes abrirla directamente: [Guía de Uso](./docs/GUIA_USO.md)

## Requisitos

- Node.js 18 (archivo `.nvmrc` incluido)
- npm 9+

## Instalación

```powershell
npm install
```

## Desarrollo

```powershell
npm run dev
```

## Pruebas y Cobertura

```powershell
npm test           # pruebas
npm run verify     # type-check + lint + test
npm run coverage   # genera reporte html en coverage/
```

LCOV (para servicios externos):

```powershell
npm run coverage:lcov
```

Para un badge de cobertura sin servicio externo puedes subir el archivo `coverage/coverage-final.json` a un generador o integrar Coveralls / Codecov.

## Scripts principales

| Script | Descripción |
|--------|-------------|
| dev | Servidor desarrollo |
| build | Compila a `dist/` |
| preview | Sirve `dist/` |
| test | Ejecuta Vitest |
| coverage | Cobertura pruebas |
| lint | Linter |
| lint:fix | Correcciones automáticas |
| type-check | Verificación TypeScript sin emitir |
| verify | Lint + type-check + tests |

## Estructura

```text
src/
  models/        # Tipos de dominio
  utils/         # Algoritmos (DFA/NFA, subset, stubs)
  store/         # Zustand store
  components/    # Componentes UI
  styles/        # Estilos globales
```

## JSON de ejemplo

```json
{
  "alphabet": ["0","1"],
  "states": [
    {"id": "q0", "start": true},
    {"id": "q1"},
    {"id": "q2", "accept": true}
  ],
  "transitions": [
    {"from":"q0","to":"q1","symbol":"0"},
    {"from":"q0","to":"q0","symbol":"1"},
    {"from":"q1","to":"q2","symbol":"1"},
    {"from":"q1","to":"q1","symbol":"0"},
    {"from":"q2","to":"q0","symbol":"1"},
    {"from":"q2","to":"q1","symbol":"0"}
  ]
}
```

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| N | Nuevo estado (prompt) |
| T | Nueva transición (prompts) |
| Space | Siguiente paso de simulación |
| R | Reset simulación |
| Delete | Eliminar estado o transición seleccionada |
| Ctrl+I | Importar JSON (prompt) |
| Ctrl+E | Exportar JSON (copiar + descarga) |
| Enter | Ejecutar simulación (si hay cadena) |

Notas:

- Los atajos se ignoran si el foco está en un campo editable.
- Exportar intenta copiar al portapapeles y además descarga `automata.json`.

## Importar / Exportar

- Importar: prompt (Ctrl+I) o UI (pendiente botón dedicado) pega JSON con `states` y `transitions`.
- Reglas: exactamente un estado con `start:true`; ids únicos; transiciones referencian estados existentes.
- Validación: JSON Schema (si AJV cargó) + verificaciones lógicas manuales.
- Alfabeto: derivado automáticamente de los símbolos presentes.
- Exportar: Ctrl+E genera descarga y copia el JSON formateado.

## Consideraciones de Rendimiento (Planeado)

Se emitirá advertencia cuando:

- Estados > 150
- Transiciones > 500

Motivo: operaciones como minimización y generación de regex pueden volverse costosas y la interfaz menos receptiva.

## Despliegue rápido GitHub Pages

1. Agregar a `package.json`: `"homepage": "https://USUARIO.github.io/REPO"`
2. Instalar: `npm i -D gh-pages`
3. Añadir scripts:

```jsonc
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

1. Ejecutar: `npm run deploy`

## Contribución

PRs bienvenidos. Recomendaciones (versión resumida):

- Ejecutar `npm run verify` antes de enviar.
- Añadir pruebas para nuevos algoritmos o ramas lógicas.
- Mantener funciones puras en `utils/` y side effects en el store.
- Documentar decisiones no triviales en `quehayquehacer.MD` o comentarios JSDoc.

Guía ampliada (pendiente) incluirá: naming, convenciones commit, estrategia de ramas.

### Checklist Accesibilidad

Estado actual (✔ hecho / ✖ pendiente / ◐ parcial):

| Criterio | Estado | Notas |
|----------|--------|-------|
| Roles ARIA en regiones principales | ✔ | `role="region"`, `role="toolbar"`, `role="status"`, `role="alert"` |
| Live region para mensajes dinámicos | ✔ | `#graph-live-region` y barra de estado |
| Navegación por teclado (botones/inputs) | ✔ | Todos focusables nativos |
| Resaltado de foco visible | ✔ | Estilos globales (outline) |
| Anuncios en exportaciones | ✔ | PNG/SVG actualiza live region |
| Indicador estados activos simulación | ✔ | Clase `.active` (color contraste) |
| Descripción nodos (aria-label granular) | ✖ | Podría añadirse info de tipo (start/accept) |
| Atajos documentados | ✔ | Sección Atajos |
| Evitar dependencia solo color | ◐ | Estados aceptadores tienen borde extra; falta leyenda textual |
| Soporte screen readers en tabla transiciones | ◐ | Tabla básica; falta `scope` en headers |
| Preferencia reducción movimiento | ✖ | No animaciones condicionales aún |
| Relaciones nombre-control (labels) | ✔ | Formularios básicos etiquetados |

Próximos pasos accesibilidad: añadir aria-label enriquecido para nodos (`Estado q0 (inicial, aceptador)`), legend textual de estilos, y atributos `scope="col"` en tabla.

### Guía de Contribución Ampliada

Flujo de ramas:

- `main`: estable.
- feature branches: `feat/<tema-descriptivo>`.
- fixes: `fix/<breve>`.

Commits (Conventional-like):

- Prefijos: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`.
- Mensaje imperativo, primera línea ≤ 72 chars.

Estilo TypeScript:

- Evitar `any` salvo justificación (comentar si inevitable).
- Funciones puras en `utils/`; componentes sin lógica de dominio pesada.

Pruebas:

- Nuevos algoritmos => casos nominales + límites.
- Mantener cobertura (`npm run coverage`).

Performance:

- Evitar recrear estructuras grandes en cada render.
- Algoritmos O(n^2)+: documentar complejidad al inicio.

Accesibilidad:

- No introducir widgets inaccesibles por teclado.
- Respetar prefers-reduced-motion para animaciones nuevas.

Import/Export:

- No romper compatibilidad JSON sin migración clara.

Revisión PR:

- Breve resumen, screenshots UI si cambia, riesgos y consideraciones.

Lint / Type check:

- Ejecutar `npm run lint && npm run type-check` antes del PR.

Documentación:

- Actualizar README o `quehayquehacer.MD` si cambia el alcance.

Plantilla PR sugerida:

```text
### Resumen
Breve descripción del cambio.

### Tipo
feat | fix | refactor | docs | test | chore | perf

### Detalles
- Punto 1
- Punto 2

### Pruebas
Incluir comandos ejecutados y resultados relevantes.

### Consideraciones
Riesgos, performance, accesibilidad.
```

## Licencia

MIT
