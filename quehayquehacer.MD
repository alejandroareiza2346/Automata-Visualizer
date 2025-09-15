<!--
Documento maestro de especificación y documentación del proyecto
-->

# Proyecto: Visualizador y Simulador de Autómatas Finito (DFA / NFA) con Conversión y Regex

Versión: 1.0.0
Estado: En planificación
Autor: (Completar)
Fecha: 2025-09-14

---

## 0. Resumen Ejecutivo

Aplicación web (SPA) para crear, editar, visualizar y simular autómatas finitos deterministas (DFA) y no deterministas (NFA, con transiciones ε). Incluye: editor gráfico y tabular, simulación paso a paso, conversión NFA→DFA (construcción de subconjuntos), minimización de DFA, generación de expresión regular equivalente (eliminación de estados), exportación (JSON, SVG, PNG, log de simulación) y soporte de accesibilidad básica. Se basa en los principios expuestos en el "Dragon Book".

Metas inmediatas (MVP ≤ 5 días):

1. Editor gráfico + tabla sincronizada
2. Simulación DFA paso a paso + export JSON + export SVG
3. Conversión NFA→DFA básica (sin animación avanzada)

Extensiones posteriores: minimización, regex detallada, export PDF, theming avanzado.

---

## 1. Objetivos SMART

| Objetivo | Métrica | Plazo | Criterio de éxito |
|----------|---------|-------|-------------------|
| Implementar editor y simulación DFA | 100% funcionalidades núcleo definidas | Día 3 | Suite de pruebas básicas verde |
| Conversión NFA→DFA visible | Tabla de subconjuntos + grafo resultante | Día 4 | Comparación aleatoria de 50 cadenas igual en NFA y resultado |
| Exportación JSON/SVG | Archivo válido y SVG legible | Día 2 | Validación de esquema y apertura en visor |
| Cobertura pruebas lógica | ≥70% statements en /utils | Día 5 | Reporte coverage |
| Regex generada (fase 2) | Lenguajes equivalentes (muestreo) | Iteración 2 | 100% coincidencia en 200 cadenas aleatorias |

---

## 2. Alcance

Incluye: UI web, lógica algorítmica, documentación, pruebas unitarias, despliegue estático.
Excluye (fase inicial): autenticación de usuarios, colaboración en tiempo real, persistencia remota, internacionalización avanzada, import DOT/Graphviz.

---

## 3. Stakeholders

- Estudiantes de compiladores / teoría de lenguajes
- Docentes que necesitan herramienta didáctica
- Desarrolladores que depuran analizadores léxicos

---

## 4. Glosario

| Término | Definición |
|---------|-----------|
| DFA | Autómata finito determinista |
| NFA | Autómata finito no determinista |
| ε | Transición vacía (epsilon) |
| Cierre-ε | Conjunto de estados alcanzables sólo con ε |
| Subconjuntos | Método para convertir NFA→DFA |
| Minimización | Proceso de reducir estados preservando lenguaje |

---

## 5. Requerimientos Funcionales (MoSCoW)

Must Have (MVP):

1. Crear / renombrar / eliminar estados
2. Marcar estado inicial y de aceptación
3. Agregar / eliminar transiciones (incluye ε)
4. Visualización de grafo interactivo (arrastrar estados)
5. Tabla de transición sincronizada con el grafo
6. Simulación paso a paso DFA (log + resaltado)
7. Importar / exportar JSON (validación de esquema)
8. Exportar grafo a SVG

Should Have:
9. Simulación NFA (conjuntos + cierre-ε)
10. Conversión NFA→DFA mostrando pasos
11. Minimización DFA (Hopcroft)
12. Generación de expresión regular (eliminación estados)

Could Have:
13. Export PNG, PDF (log + diagrama)
14. Temas (claro / oscuro / alto contraste)
15. Panel historial de acciones (undo/redo básico)

Won't (por ahora):
16. Colaboración multiusuario tiempo real
17. Persistencia en nube

---

## 6. Requerimientos No Funcionales

| Categoría | Requisito |
|-----------|----------|
| Performance | Simulación de 200 pasos < 150ms en laptop media |
| Portabilidad | Funciona en navegadores evergreen últimas 2 versiones |
| Accesibilidad | Contraste mínimo AA; navegación con teclado en simulación |
| Seguridad | Sin ejecución de código externo; sanitización de import JSON |
| Mantenibilidad | >70% cobertura lógica; funciones < 60 líneas |
| Observabilidad | Log interno (dev) de operaciones clave (creación, simulación) |

---

## 7. Arquitectura

Arquitectura cliente (SPA) con React + TypeScript.
Capas:

1. UI (componentes presentacionales)
2. Estado (Zustand)
3. Dominio (modelos + servicios algorítmicos)
4. Infra (helpers export, validación schema)

Diagrama lógico (texto):
User → UI Components → Store (Zustand) → Servicios (algoritmos.ts) → Modelos / Validadores → Render Graph (Cytoscape) & Tablas.

---

## 8. Decisiones Tecnológicas (ADR resumido)

| ID | Decisión | Alternativas | Estado | Racional |
|----|----------|--------------|--------|----------|
| ADR-01 | React + TS + Vite | Svelte, Vue | Aprobada | Ecosistema amplio + rapidez prototipo |
| ADR-02 | Cytoscape.js | D3 drawer manual | Aprobada | Menos código para interacciones de nodos |
| ADR-03 | Zustand | Redux Toolkit | Aprobada | Boilerplate mínimo |
| ADR-04 | Vitest | Jest | Aprobada | Integración nativa con Vite y velocidad |
| ADR-05 | JSON Schema validación | Validación ad-hoc | Aprobada | Estandarización y escalabilidad |

---

## 9. Modelo de Datos (JSON Schema)

Versión empleada: draft-07 (alineada con `automaton.schema.json` en el repositorio). Si en el futuro se migra a 2020-12 habrá que ajustar la inicialización de AJV (`Ajv2020`).

```jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/automaton.schema.json",
  "title": "Automaton",
  "type": "object",
  "required": ["alphabet", "states", "transitions"],
  "properties": {
    "alphabet": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "uniqueItems": true,
      "description": "Símbolos válidos (excluye ε)."
    },
    "states": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id"],
        "properties": {
          "id": { "type": "string", "minLength": 1 },
          "label": { "type": "string" },
          "start": { "type": "boolean" },
          "accept": { "type": "boolean" },
          "x": { "type": "number" },
          "y": { "type": "number" }
        },
        "additionalProperties": false
      },
      "minItems": 1,
      "description": "Lista de estados. Exactamente uno con start=true."
    },
    "transitions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["from", "to", "symbol"],
        "properties": {
          "from": { "type": "string", "minLength": 1 },
          "to": { "type": "string", "minLength": 1 },
          "symbol": { "type": "string", "minLength": 1, "description": "Símbolo del alfabeto o 'ε' para epsilon." }
        },
        "additionalProperties": false
      },
      "description": "Transiciones dirigidas etiquetadas con símbolo."
    }
  },
  "additionalProperties": false
}
```

Ejemplo mínimo (válido):

```json
{
  "alphabet": ["0", "1"],
  "states": [
    {"id": "q0", "start": true},
    {"id": "q1"},
    {"id": "q2", "accept": true}
  ],
  "transitions": [
    {"from": "q0", "to": "q1", "symbol": "0"},
    {"from": "q0", "to": "q0", "symbol": "1"},
    {"from": "q1", "to": "q2", "symbol": "1"},
    {"from": "q1", "to": "q1", "symbol": "0"},
    {"from": "q2", "to": "q0", "symbol": "1"},
    {"from": "q2", "to": "q1", "symbol": "0"}
  ]
}
```

Reglas de validación adicionales (lógica):

1. Un único estado start verdadero
2. IDs únicos
3. Todos los `from` / `to` existen
4. `symbol` ∈ alphabet ∪ {ε}

---

## 10. Casos de Uso (User Stories)

| ID | Story | Criterios de Aceptación |
|----|-------|-------------------------|
| US-01 | Como usuario quiero crear estados | Puedo agregar estado con ID único y aparece en grafo y tabla |
| US-02 | Como usuario quiero definir transiciones | Tras guardar, se visualiza arista con etiqueta símbolo |
| US-03 | Simular palabra | Ingreso cadena, veo resaltado paso a paso y resultado final |
| US-04 | Exportar JSON | Descarga archivo válido y reimportable |
| US-05 | Importar JSON | Valida esquema y actualiza UI |
| US-06 | Convertir NFA→DFA | Muestro tabla de subconjuntos y grafo resultante |
| US-07 | Obtener regex | Veo lista de pasos y expresión final |

---

## 11. Algoritmos (Detalles y Complejidad)

### 11.1 Simulación DFA

Complejidad: O(|w|) tiempo, O(1) memoria adicional.
Errores gestionados: símbolo no perteneciente al alfabeto → abortar con mensaje.

### 11.2 Simulación NFA

Uso de conjuntos. Peor caso: O(|w|·|Q|·|Σ|). Cierre-ε mediante DFS/BFS.

### 11.3 Construcción de Subconjuntos (NFA→DFA)

Genera hasta 2^|Q| estados (práctico: mucho menor). Optimización: memo de conjuntos visitados.

### 11.4 Minimización (Hopcroft)

Complejidad: O(|Σ| * |Q| log |Q|).

### 11.5 Eliminación de Estados (Regex)

Complejidad polinómica alta (O(n^3) en general). Representar expresiones con simplificaciones: (A|∅)=A, (A∅)=∅, (Aε)=A.

### 11.6 Simplificación de Regex (Heurística)

1. Remover dobles paréntesis
2. Orden lexicográfico uniones (opcional)
3. Eliminar redundancias A|A → A.

---

## 12. Interfaces Lógicas (Contratos)

simulateDFA(input: string, dfa: Automaton) → { accepted: boolean; log: Step[] }
simulateNFA(input: string, nfa: Automaton) → { accepted: boolean; log: NFAStep[] }
convertNFAtoDFA(nfa) → { dfa, trace }
minimizeDFA(dfa) → { minimized, partitionsTrace }
dfaToRegex(dfa) → { regex: string, steps: RegexStep[] }

---

## 13. Diseño UI / UX (Detallado)

Layout (desktop ≥ 1024px):

| Zona | Función |
|------|---------|
| TopBar | Botones globales / tema / ayuda |
| Left Panel | Estados + transiciones (formularios) |
| Center | Lienzo grafo interactivo |
| Right | Simulación / conversión / regex steps tabs |
| Bottom | Tabla de transición + estado sistema |

Interacción principal: CRUD en panel izquierdo → actualiza store → rerender grafo + tabla.
Resaltado: estado actual (borde grueso), transición usada (color acento), otros atenuados.

Accesibilidad:

1. Roles ARIA en botones y tabla
2. Atajos: Space = siguiente paso simulación, R = reiniciar
3. Focus visible en nodos seleccionados

Paleta (ejemplo):

| Rol | Color |
|-----|-------|
| Fondo | #0f172a (oscuro) / #ffffff (claro) |
| Estado normal | #1d4ed8 |
| Estado aceptador | #059669 |
| Estado actual | #f59e0b |
| Transición activa | #ef4444 |
| Transición normal | #64748b |

---

## 14. Accesibilidad (WCAG 2.1 AA – Subconjunto)

| Criterio | Implementación |
|----------|---------------|
| 1.4.3 Contraste | Paleta con contraste ≥ 4.5:1 texto principal |
| 2.1.1 Teclado | Simulación y navegación de lista sin mouse |
| 2.4.7 Focus Visible | Outline personalizado para elementos interactivos |

---

## 15. Estructura de Carpetas (Propuesta)

```text
src/
  components/
    graph/
    simulation/
    forms/
  store/
  models/
  utils/
  hooks/
  styles/
  tests/
public/
```

---

## 16. Estrategia de Pruebas

Niveles:

1. Unit: algoritmos (simulate, convert, minimize, regex)
2. Integration: sincronización grafo-tabla
3. UI (ligero): render básico + interacción simulación
4. Property-based (opcional): equivalencia NFA vs DFA post conversión (fast-check)

Casos clave:

| Algoritmo | Test |
|-----------|------|
| simulateDFA | Palabra aceptada/no aceptada, símbolo inválido |
| simulateNFA | Cierre-ε correcto, convergencia |
| convertNFAtoDFA | Lenguaje igual en muestreo |
| minimizeDFA | Estados disminuyen o se mantienen |
| dfaToRegex | Regex no vacía y reproduce muestras |

Cobertura: excluir componentes puramente visuales.

---

## 17. Calidad y Reglas

Linters: ESLint + Prettier
Type checking: tsc strict
Commits: Conventional Commits (feat:, fix:, docs: ...)
CI (futuro): ejecución vitest + build.

Definición de Hecho:

1. Código + tests + docs actualizados
2. Sin warnings TypeScript
3. Cobertura acorde objetivo

---

## 18. Roadmap Iterativo

| Sprint | Entregables |
|--------|-------------|
| 0 (Setup) | Proyecto Vite, lint, store base |
| 1 | Editor + grafo + JSON export/import |
| 2 | Simulación DFA/NFA |
| 3 | NFA→DFA + minimización |
| 4 | Regex + simplificación + export SVG/PNG |
| 5 | Accesibilidad + mejoras UX + PDF |

---

## 19. Backlog (Refinado Inicial)

- Undo/Redo (historial de acciones)
- Guardado localStorage automático
- Compartir permalink (serializar JSON en querystring compress)
- Explicaciones teóricas expandibles

---

## 20. Gestión de Riesgos

| Riesgo | Impacto | Prob | Mitigación |
|--------|---------|------|------------|
| Complejidad regex | Alto | Medio | Implementar después de base estable |
| Performance grafo grande | Medio | Bajo | Virtualizar lista y limitar tamaño avisando |
| Inflación técnica | Medio | Medio | ADR y foco en MVP |

---

## 21. Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Tiempo crear autómata simple | < 2 min |
| Errores validación por import | < 5% de archivos |
| Cobertura lógica | ≥ 70% |
| Interacciones por sesión (estudiantes) | ≥ 5 |

---

## 22. Guía de Contribución (Resumen)

1. Fork & branch convención: feature/nombre-corto
2. Ejecutar `npm run lint && npm test` antes de PR
3. Pull Request: describir propósito + capturas si UI
4. Revisiones: mínimo 1 aprobación externa

---

## 23. Licencia (Sugerencia)

MIT (pendiente confirmación). Incluir archivo LICENSE.

---

## 24. Ejemplo de Flujo de Simulación (DFA)

Palabra: 1101 (ver log en tabla de pasos). Resultado aceptado. Se muestra resaltado incremental.

---

## 25. Ejemplo de Conversión NFA→DFA (Resumen del Proceso)

1. Cierre-ε del start = S0
2. Para cada símbolo generar move + cierre-ε
3. Crear nuevo estado si conjunto no visto
4. Repetir hasta cierre
5. Marcar aceptadores: cualquier conjunto con un estado aceptador original.

---

## 26. Minimización (Hopcroft) – Pasos

1. Particionar aceptadores / no aceptadores
2. Refinar por clases distinguibles según símbolos
3. Combinar estados de misma clase

---

## 27. Generación de Expresión Regular – Pasos Visuales

1. Crear s' y f'
2. Listar matriz R^(0)
3. Eliminar estado intermedio r
4. Actualizar expresiones según fórmula
5. Repetir hasta quedar s', f'
6. Resultado: R_{s',f'}.

---

## 28. Exportaciones

| Tipo | Formato | Método |
|------|---------|--------|
| Automata | JSON | Blob descarga |
| Grafo | SVG | Serializar nodo root |
| Imagen | PNG | Canvas + drawImage SVG |
| Log simulación | TXT | Generar join líneas |

---

## 29. Validaciones de Integridad (Checklist)

Al guardar / exportar:

1. Un (y solo uno) start
2. ≥1 estado aceptador (warning si no)
3. No transiciones huérfanas
4. Sin símbolos vacíos salvo ε

---

## 30. Ejemplos Adicionales Pre-cargados

1. Terminación en 01 (DFA)
2. NFA con ε para (ab|a)
3. DFA para múltiplos de 3 en binario
4. DFA redundante para minimización (estados equivalentes)

---

## 31. Scripts (Planificados)

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "coverage": "vitest run --coverage"
  }
}
```

---

## 32. Despliegue (Guía Rápida)

Vercel:

1. Importar repo
2. Framework: Vite
3. Build: `npm run build`
4. Output: `dist`

Netlify (alternativa): set build = npm run build, publish = dist.

---

## 33. Plantillas (Issue / PR – Sugerencia)

Issue:

```markdown
### Descripción

### Reproducción (si bug)

### Comportamiento esperado

### Evidencia / Capturas
```

Pull Request:

```markdown
### Objetivo

### Cambios Clave

### Evidencia UI

### Checklist
- [ ] Tests pasan
- [ ] Linter OK
- [ ] Documentación actualizada
```

---

## 34. Apertura a Extensiones Futuras

- Autómatas con pesos (AFN probabilísticos)
- Export Graphviz DOT
- Generador de cadenas aleatorias aceptadas

---

## 35. Referencias Teóricas

1. Aho, Sethi, Ullman – Dragon Book (capítulos autómatas y ER)
2. Hopcroft & Ullman – Introducción a autómatas
3. RFC JSON Schema Draft 2020-12

---

## 36. Apéndice: Pseudocódigo Clave (Consolidado)

### simulateDFA

```text
current = start
log = []
for symbol in input:
  if (current, symbol) no definido -> error
  next = δ(current, symbol)
  log.push({from: current, read: symbol, to: next})
  current = next
accepted = current ∈ F
return {accepted, log}
```

### epsilonClosure

```text
stack = [...states]
closure = set(states)
while stack not empty:
  s = stack.pop()
  for t in ε-transiciones(s):
    if t not in closure:
      closure.add(t)
      stack.push(t)
return closure
```

### NFA→DFA (resumen)

```text
startSet = ε-closure({start})
queue = [startSet]
while queue:
  S = queue.pop()
  for a in alphabet:
    U = ε-closure(move(S, a))
    if U not conocido:
      agregar U
      queue.push(U)
    registrar transición S -a-> U
```

---

## 37. Checklist Final del MVP

- [ ] Editor estados + transiciones
- [ ] Grafo interactivo
- [ ] Tabla sincronizada
- [ ] Simulación DFA
- [ ] Export JSON / SVG
- [ ] Validación de esquema
- [ ] Docs actualizadas (este archivo)

---

## 38. Guía Rápida para Docente / Revisor

1. Crear un estado nuevo → aparece en grafo y tabla
2. Simular cadena de ejemplo → coincide con pasos teóricos
3. Importar JSON ejemplo → representación fiel
4. Exportar y reimportar → no pérdida de datos

---

## 39. Prompt Técnico Sintético (para IA / Dev Onboarding)

Construir SPA React+TS con editor + grafo (Cytoscape) + simulador DFA/NFA, NFA→DFA, minimización y regex. Export JSON/SVG. Validar contra JSON Schema. Proveer tests de algoritmos. Foco en claridad, modularidad y accesibilidad básica.

---

## 40. Notas Finales

Este documento es la única fuente de verdad (SSOT) hasta crear documentación separada (README + /docs). Mantener sincronizado ante cambios arquitectónicos (actualizar ADRs).

---

Fin del documento.
