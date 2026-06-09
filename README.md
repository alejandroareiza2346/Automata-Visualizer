# Automata-Visualizer
**Engineering Lead: Alejandro Areiza Alzate**
**Technical Domain: Formal Language Theory / Algorithm Engineering / Frontend Systems**

---

## 1. Executive Summary and Architectural Vision

This project delivers a production-structured **React + TypeScript single-page application** for the interactive construction, simulation, and algorithmic transformation of finite automata — both Deterministic (DFA) and Non-Deterministic (NFA), including ε-transitions. The application implements four formal computer science algorithms from scratch: NFA-to-DFA conversion via subset construction, DFA minimization via an adapted Hopcroft partition refinement algorithm with unreachable-state pruning, DFA-to-regular-expression generation via state elimination, and step-by-step string simulation with structured execution logging. The architecture enforces strict separation between the algorithmic core (`src/utils/`), reactive state management (`src/store/` via Zustand), and the presentation layer (`src/components/`), ensuring that all formal algorithms are implemented as pure functions with no side effects — independently testable and reusable outside the UI context. A JSON Schema (draft-07, validated with AJV) governs all import/export operations, providing a typed contract for automaton data interchange.

**CI status:** GitHub Actions pipeline runs type-check + lint + full Vitest test suite on every push to `main`.

---

## 2. Requirement Analysis and Strategic Alignment

- **Functional:** Interactive graph-based construction of DFA and NFA states and transitions; ε-transition support in NFA simulation; step-by-step simulation with structured log output and full-run mode; NFA→DFA conversion via subset construction with full conversion trace (`subsetTrace`) stored in the Zustand store; DFA minimization via iterative partition refinement with equivalence-class collapse; heuristic DFA→regex generation via state elimination; non-determinism conflict detection (`from + symbol` collision reporting); JSON import/export with AJV schema validation and manual logical checks (unique state IDs, exactly one start state, transition referential integrity); localStorage persistence with undo/redo up to 50 historical snapshots; 12 keyboard shortcuts for productivity; WCAG-aligned accessibility (ARIA roles, live regions, keyboard navigation, visible focus indicators).
- **Non-Functional:** Performance warning threshold at 150 states / 500 transitions beyond which minimization and regex generation complexity may degrade UI responsiveness; Vitest test suite with c8 coverage reporting; ESLint + Prettier enforced code style; TypeScript strict mode throughout; Node.js 18 pinned via `.nvmrc`.
- **Strategic Goal:** Demonstration of end-to-end frontend systems engineering competency applied to formal language theory — covering algorithm implementation, typed reactive state management, schema-validated data interchange, test coverage, and accessibility compliance within a single production-structured codebase.

---

## 3. Technical Stack and Infrastructure

- **Core Language:** TypeScript 5.x (strict mode, `tsconfig.json`)
- **Framework:** React 18 — component-based UI with hooks
- **State Management:** Zustand — reactive global store with undo/redo snapshot history (cap: 50 states) and automatic localStorage persistence after every mutation
- **Build Tool:** Vite — development server on `localhost:5173`, production build to `dist/`
- **Testing:** Vitest + c8 — unit tests in `__tests__/` covering NFA→DFA equivalence, minimization edge cases, import error handling, non-determinism conflict detection, and DFA→regex consistency
- **Schema Validation:** AJV (Ajv JSON Schema Validator) — draft-07 schema defined in `automaton.schema.json`; logical validation layer applied after schema validation for referential integrity checks
- **Code Quality:** ESLint (`.eslintrc.json`) + Prettier (`.prettierrc.json`) + TypeScript type-check — all enforced in the `npm run verify` script
- **CI/CD:** GitHub Actions (`.github/workflows/`) — `npm run verify` on push and pull request to `main`
- **Execution Environment:** Any modern browser; Node.js 18+ for local development
- **Design Pattern:** Functional core / reactive shell — all algorithms are pure functions in `src/utils/`; all side effects and state mutations are isolated in the Zustand store; components are thin presentation layers with no embedded domain logic

---

## 4. Engineering Logic and Implementation

The application implements four distinct formal algorithms, each as a pure function in `src/utils/`:

**NFA → DFA Conversion (Subset Construction):** Starting from the ε-closure of the NFA's initial state, the algorithm computes reachable DFA state sets iteratively. Each DFA state represents a subset of NFA states; transitions are derived by computing the ε-closure of the union of NFA transitions on each symbol. A DFA state is accepting if any member of its NFA subset is an NFA accepting state. The full conversion trace is stored in `subsetTrace` within the Zustand store for inspection. Complexity: O(2^n) worst-case in NFA state count (unavoidable given the subset construction lower bound), O(n × |Σ|) in the number of reachable DFA states.

**DFA Minimization (Adapted Hopcroft):** Unreachable states are pruned in a preprocessing pass via BFS/DFS from the initial state. The remaining states are partitioned into accepting and non-accepting groups; partitions are iteratively refined by splitting groups whose states have transitions to different partitions on the same symbol. The algorithm terminates when no partition can be further refined. Equivalent states within each final partition are collapsed into a single representative state. Complexity: O(n log n × |Σ|) in the number of DFA states.

**DFA → Regular Expression (State Elimination):** An iterative state elimination algorithm removes intermediate states one at a time, replacing each removed state with augmented regular expressions on the remaining transitions using the generalized NFA (GNFA) representation. The order of state elimination is heuristic — states are selected to minimize expression length growth. The result is a regular expression over the original alphabet that accepts the same language as the DFA. Known limitation: expression size can grow exponentially in dense DFAs; minimizing the DFA before regex generation is recommended for automata with more than ~25 states.

**Step-by-Step Simulation:** The simulator maintains a current state pointer and a remaining-input queue. Each step advances the pointer by consuming one input symbol and following the appropriate transition; for NFA simulation, the current state is a set of active NFA states updated via ε-closure after each symbol. Rejected strings (no valid transition or no active state after full consumption) are distinguished from accepted strings (at least one active state is an accepting state after full input consumption).

- **Complexity summary:** Subset construction O(2^n) worst-case / O(reachable × |Σ|) practical; Hopcroft minimization O(n log n × |Σ|); state elimination O(n³) in state count; simulation O(|w| × |Q|) in string length and state count.
- **Data Structures:** Hash maps for transition tables (O(1) lookup per symbol); sets for NFA active state tracking and DFA subset representation; partition arrays for Hopcroft refinement; adjacency lists for graph traversal in reachability pruning.

---

## 5. Quality Assurance and Systematic Testing

The test suite in `__tests__/` covers the full algorithmic surface under Vitest with c8 coverage reporting.

- **Analytical Testing:** TypeScript strict mode enforced across all modules — all type errors surface at compile time via `npm run type-check`; ESLint rules enforce pure-function conventions in `src/utils/` and prevent side effects from leaking into the algorithmic layer.
- **Constructive Testing (Vitest):** NFA→DFA equivalence tests verify that the converted DFA accepts and rejects the same strings as the original NFA across a representative set of inputs; minimization edge-case tests cover single-state DFAs, DFAs with all accepting states, DFAs with no accepting states, and DFAs with unreachable states; import error tests verify that malformed JSON, schema violations, duplicate state IDs, multiple start states, and dangling transition references all produce structured error messages without crashing the application; non-determinism conflict detection tests confirm that `from + symbol` collisions are correctly identified and reported; regex consistency tests verify that the generated regular expression accepts at least the strings accepted by the source DFA on a sampled input set.
- **Edge Case Handlers:** ε-transitions in NFA simulation handled via iterative ε-closure computation before and after each symbol consumption; empty alphabet derived automatically from transition symbols (no manual alphabet declaration required on import); automata with zero transitions handled without null-pointer exceptions in simulation; undo/redo bounded at 50 snapshots — oldest snapshot discarded when limit is reached.

---

## 6. Security Governance and Compliance

- **Input Validation:** All imported JSON is first validated against `automaton.schema.json` (AJV draft-07) before any parsing or state mutation occurs. Schema validation rejects structurally malformed inputs before logical checks run. Logical validation then enforces: exactly one `start: true` state, unique state IDs across the state array, and all transition `from`/`to` references resolve to declared state IDs.
- **No Dynamic Code Execution:** No `eval()`, `Function()`, or dynamic import of user-supplied content. All algorithm logic is statically compiled TypeScript. Imported JSON is parsed as data, never as executable code.
- **localStorage Scope:** Persisted automaton state is scoped to the application's localStorage origin. No data is transmitted to any external endpoint; all state is local to the user's browser session.
- **Accessibility Compliance (WCAG alignment):** ARIA roles applied to primary regions (`role="region"`, `role="toolbar"`, `role="status"`, `role="alert"`); live regions (`#graph-live-region`) announce dynamic simulation output to screen readers; all interactive controls are natively focusable with visible focus outlines; keyboard shortcuts documented and suppressed when focus is in an editable field; accepting states visually distinguished via border in addition to color to avoid sole-color dependence.

---

## 7. Deployment and Initialization

**Prerequisites:** Node.js 18 (`.nvmrc` included for `nvm use` compatibility), npm 9+

```bash
# Clone the repository
git clone https://github.com/alejandroareiza2346/Automata-Visualizer.git

cd Automata-Visualizer

# Install dependencies
npm install

# Run full verification (type-check + lint + tests)
npm run verify

# Start development server
npm run dev
# Open http://localhost:5173
```

**Available scripts:**

| Script | Description |
|---|---|
| `npm run dev` | Vite development server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Run Vitest test suite |
| `npm run coverage` | Generate HTML coverage report in `coverage/` |
| `npm run coverage:lcov` | Generate LCOV report for external coverage services |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run type-check` | TypeScript type verification without emit |
| `npm run verify` | Full pipeline: lint + type-check + tests |

**Deploy to GitHub Pages:**

```bash
# Add to package.json: "homepage": "https://alejandroareiza2346.github.io/Automata-Visualizer"
npm install -D gh-pages

# Add scripts to package.json:
# "predeploy": "npm run build"
# "deploy": "gh-pages -d dist"

npm run deploy
```

---

## 8. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `N` | New state (prompt) |
| `T` | New transition (prompts) |
| `Space` | Next simulation step |
| `R` | Reset simulation |
| `Delete` | Delete selected state or transition |
| `Ctrl+I` | Import JSON (prompt) |
| `Ctrl+E` | Export JSON (clipboard copy + file download) |
| `Enter` | Run full simulation on current input string |

All shortcuts are suppressed when focus is in an editable input field.

---

## 9. JSON Import Format

```json
{
  "alphabet": ["0", "1"],
  "states": [
    { "id": "q0", "start": true },
    { "id": "q1" },
    { "id": "q2", "accept": true }
  ],
  "transitions": [
    { "from": "q0", "to": "q1", "symbol": "0" },
    { "from": "q0", "to": "q0", "symbol": "1" },
    { "from": "q1", "to": "q2", "symbol": "1" },
    { "from": "q1", "to": "q1", "symbol": "0" },
    { "from": "q2", "to": "q0", "symbol": "1" },
    { "from": "q2", "to": "q1", "symbol": "0" }
  ]
}
```

Alphabet is derived automatically from transition symbols if not explicitly declared. Exactly one state must carry `"start": true`. State IDs must be unique. All `from`/`to` values in transitions must reference declared state IDs.

---

## 10. Repository Structure

```
Automata-Visualizer/
├── .github/workflows/        # GitHub Actions CI pipeline
├── __tests__/                # Vitest test suite
├── docs/
│   └── GUIA_USO.md           # Full user guide (Spanish)
├── src/
│   ├── models/               # Domain type definitions
│   ├── utils/                # Pure algorithm functions (DFA/NFA, subset, Hopcroft, state elimination)
│   ├── store/                # Zustand reactive store with undo/redo and localStorage persistence
│   ├── components/           # React UI components
│   └── styles/               # Global CSS
├── automaton.schema.json     # AJV JSON Schema draft-07 for import validation
├── index.html                # Vite entry point
├── vite.config.ts            # Vite configuration
├── vitest.config.ts          # Vitest configuration
├── tsconfig.json             # TypeScript strict configuration
├── .eslintrc.json            # ESLint rules
├── .prettierrc.json          # Prettier formatting rules
└── .nvmrc                    # Node.js 18 version pin
```

---

## 11. Professional Background

Project designed and developed by **Alejandro Areiza Alzate**, Computer Engineering student at Universidad Autónoma Latinoamericana (UNAULA), Medellín, and GitHub Developer Program member.

- **LinkedIn:** [Alejandro A. Alzate](https://www.linkedin.com/in/alejandroareizaa/)
- **Research (ORCID):** [0009-0002-2116-6918](https://orcid.org/0009-0002-2116-6918)
- **Certifications:** Microsoft Learn Level 6 — 26,950 XP (Azure Identity, Network Security & SQL Security); Cisco; Google; IBM; OWASP Top 10

---

## 12. License

Distributed under the **MIT License**. See `LICENSE` for full terms.
