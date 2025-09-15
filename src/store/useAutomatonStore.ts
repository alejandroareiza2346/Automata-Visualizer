import { create } from 'zustand';
import { Automaton, State } from '../models/automaton';
import { simulateDFA, simulateNFA, nfaToDFA, minimizeDFA, dfaToRegex, SubsetConversionTrace } from '../utils/algorithms';
import { dfaEndsWith01 } from '../utils/examples';
// JSON Schema validation (lazy) - expects ajv installed
// Using minimal typing to avoid hard dependency on AJV types.
type AjvValidateFn = ((data: unknown) => boolean) & { errors?: Array<{ message?: string }> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ajv: any; // dynamic import container
let validateSchema: AjvValidateFn | undefined;
async function ensureValidator() {
  if (!ajv) {
    try {
      const mod = await import('ajv');
	// eslint-disable-next-line new-cap
	ajv = new mod.default({ allErrors: true });
      const schema = await fetch('/automaton.schema.json').then(r => r.json()).catch(() => null);
      if (schema) validateSchema = ajv.compile(schema) as AjvValidateFn;
    } catch {
      // validator optional; failures ignored intentionally
    }
  }
}

const LS_KEY = 'automaton_state_v1';
function loadPersisted(): Automaton | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.states) && Array.isArray(parsed.transitions) && Array.isArray(parsed.alphabet)) {
      return parsed as Automaton;
    }
  } catch { /* ignore */ }
  return null;
}

// Default example automaton
const exampleEndsWith01 = dfaEndsWith01;

interface SimulationLogEntry {
  step: number;
  from: string;
  to: string;
  read: string;
}

interface AutomatonStore {
  automaton: Automaton;
  subsetTrace?: SubsetConversionTrace[];
  _history: Automaton[];
  _future: Automaton[];
  readOnly: boolean;
  selectedStateId?: string;
  selectedTransitionIndex?: number;
  dfaMode: boolean; // true => enforce determinism
  simInput: string;
  simResult?: { accepted: boolean; error?: string; log: SimulationLogEntry[] };
  regex?: string;
  simStep: number; // 0 = before first move
  simRunning: boolean;
  // actions
  setAutomaton: (a: Automaton) => void;
  toggleReadOnly: (v?: boolean) => void;
  setDfaMode: (v: boolean) => void;
  setSimInput: (v: string) => void;
  selectState: (id?: string) => void;
  addState: (id: string) => void;
  renameState: (oldId: string, newId: string) => void;
  toggleAccept: (id: string) => void;
  setStart: (id: string) => void;
  removeState: (id: string) => void;
  addTransition: (from: string, symbol: string, to: string) => void;
  removeTransition: (index: number) => void;
  editTransition: (index: number, update: { from?: string; to?: string; symbol?: string }) => void;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  runDFASimulation: () => void;
  runNFASimulation: () => void;
  resetSimulation: () => void;
  stepForward: () => void;
  runFull: () => void;
  convertNFA: () => void;
  minimize: () => void;
  generateRegex: () => void;
  importAutomaton: (json: string) => { ok: boolean; error?: string };
  exportAutomaton: () => string;
  undo: () => void;
  redo: () => void;
  determinismIssues: () => string[]; // list of from+symbol collisions
}

export const useAutomatonStore = create<AutomatonStore>((set, get) => ({
  automaton: loadPersisted() || exampleEndsWith01,
  _history: [],
  _future: [],
  readOnly: false,
  dfaMode: true,
  simInput: '',
  simStep: 0,
  simRunning: false,
  setAutomaton: (a) => set(state => {
    if (state.readOnly) return state;
    const next = { _history: [...state._history, state.automaton], _future: [], automaton: a };
    try { localStorage.setItem(LS_KEY, JSON.stringify(next.automaton)); } catch {
      // persistence best-effort
    }
    return next;
  }),
  toggleReadOnly: (v) => set(state => ({ readOnly: typeof v === 'boolean' ? v : !state.readOnly })),
  setDfaMode: (v) => set({ dfaMode: v }),
  setSimInput: (v) => set({ simInput: v }),
  selectState: (id) => set({ selectedStateId: id }),
  addState: (id) => set(state => {
    if (state.readOnly) return state;
    if (state.automaton.states.some(s => s.id === id)) return state; // ignore duplicate
    const newState: State = { id, start: state.automaton.states.length === 0, accept: false };
    const automaton = { ...state.automaton, states: [...state.automaton.states, newState] };
    try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
      /* ignore */
    }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  renameState: (oldId, newId) => set(state => {
    if (state.readOnly) return state;
    if (oldId === newId) return state;
    if (!newId || /\s/.test(newId) || state.automaton.states.some(s => s.id === newId)) return state; // invalid or duplicate
    const target = state.automaton.states.find(s => s.id === oldId);
    if (!target) return state;
    const states = state.automaton.states.map(s => s.id === oldId ? { ...s, id: newId } : s);
    const transitions = state.automaton.transitions.map(t => ({
      from: t.from === oldId ? newId : t.from,
      to: t.to === oldId ? newId : t.to,
      symbol: t.symbol
    }));
    const automaton = { ...state.automaton, states, transitions };
  try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
    /* ignore persist error */
  }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton, selectedStateId: state.selectedStateId === oldId ? newId : state.selectedStateId };
  }),
  toggleAccept: (id) => set(state => {
    if (state.readOnly) return state;
    const automaton = {
      ...state.automaton,
      states: state.automaton.states.map(s => s.id === id ? { ...s, accept: !s.accept } : s)
    };
  try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
    /* ignore persist error */
  }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  setStart: (id) => set(state => {
    if (state.readOnly) return state;
    const automaton = {
      ...state.automaton,
      states: state.automaton.states.map(s => ({ ...s, start: s.id === id }))
    };
  try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
    /* ignore persist error */
  }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  removeState: (id) => set(state => {
    if (state.readOnly) return state;
    const automaton = {
      ...state.automaton,
      states: state.automaton.states.filter(s => s.id !== id),
      transitions: state.automaton.transitions.filter(t => t.from !== id && t.to !== id)
    };
  try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
    /* ignore persist error */
  }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton, selectedStateId: state.selectedStateId === id ? undefined : state.selectedStateId };
  }),
  addTransition: (from, symbol, to) => set(state => {
    if (state.readOnly) return state;
    if (!from || !to || !symbol) return state;
    const ids = new Set(state.automaton.states.map(s => s.id));
    if (!ids.has(from) || !ids.has(to)) return state;
    if (/\s/.test(symbol)) return state;
    if (state.dfaMode && state.automaton.transitions.some(t => t.from === from && t.symbol === symbol)) return state;
    const alphabet = state.automaton.alphabet.includes(symbol) ? state.automaton.alphabet : [...state.automaton.alphabet, symbol].sort();
    const automaton = { ...state.automaton, alphabet, transitions: [...state.automaton.transitions, { from, symbol, to }] };
  try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
    /* ignore persist error */
  }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  removeTransition: (index) => set(state => {
    if (state.readOnly) return state;
    const automaton = {
      ...state.automaton,
      transitions: state.automaton.transitions.filter((_, i) => i !== index)
    };
  try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
    /* ignore persist error */
  }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  editTransition: (index, update) => set(state => {
    if (state.readOnly) return state;
    const transitions = [...state.automaton.transitions];
    if (!transitions[index]) return state;
    const current = transitions[index];
    const from = update.from ?? current.from;
    const to = update.to ?? current.to;
    const symbol = update.symbol ?? current.symbol;
    // Validaciones básicas
    const ids = new Set(state.automaton.states.map(s => s.id));
    if (!ids.has(from) || !ids.has(to)) return state;
    if (!symbol || /\s/.test(symbol)) return state;
    if (state.dfaMode) {
      // Evitar duplicado determinista (excepto misma transición editada)
      const conflict = transitions.some((t, i) => i !== index && t.from === from && t.symbol === symbol);
      if (conflict) return state;
    }
    transitions[index] = { from, to, symbol };
    const automaton = { ...state.automaton, transitions };
    try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
      /* ignore persist error */
    }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  addSymbol: (symbol) => set(state => {
    if (state.readOnly) return state;
    if (!symbol || /\s/.test(symbol)) return state;
    if (state.automaton.alphabet.includes(symbol)) return state;
    const automaton = { ...state.automaton, alphabet: [...state.automaton.alphabet, symbol].sort() };
    try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
      /* ignore persist error */
    }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  removeSymbol: (symbol) => set(state => {
    if (state.readOnly) return state;
    if (!state.automaton.alphabet.includes(symbol)) return state;
    // No eliminar si alguna transición lo usa
    if (state.automaton.transitions.some(t => t.symbol === symbol)) return state;
    const automaton = { ...state.automaton, alphabet: state.automaton.alphabet.filter(s => s !== symbol) };
    try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
      /* ignore persist error */
    }
    const history = [...state._history, state.automaton];
    const capped = history.length > 50 ? history.slice(history.length - 50) : history;
    return { _history: capped, _future: [], automaton };
  }),
  runDFASimulation: () => {
    const { automaton, simInput } = get();
    const res = simulateDFA(automaton, simInput);
    set({ simResult: { accepted: res.accepted, error: res.error, log: res.log as SimulationLogEntry[] }, simStep: 0, simRunning: false });
  },
  runNFASimulation: () => {
    const { automaton, simInput } = get();
    const res = simulateNFA(automaton, simInput);
    const log = res.log.map(l => ({ step: l.step, from: l.from, to: l.to, read: l.read }));
    set({ simResult: { accepted: res.accepted, error: res.error, log }, simStep: 0, simRunning: false });
  },
  resetSimulation: () => set({ simStep: 0, simRunning: false }),
  stepForward: () => set(state => {
    if (!state.simResult) return state;
    const next = Math.min(state.simStep + 1, state.simResult.log.length);
    return { simStep: next };
  }),
  runFull: () => set(state => {
    if (!state.simResult) return state;
    return { simStep: state.simResult.log.length };
  }),
  convertNFA: () => {
    const { automaton } = get();
    const { dfa, trace } = nfaToDFA(automaton);
    set(state => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(dfa)); } catch {
    /* ignore persist error */
  }
      const history = [...state._history, state.automaton];
      const capped = history.length > 50 ? history.slice(history.length - 50) : history;
      return { _history: capped, _future: [], automaton: dfa, subsetTrace: trace, dfaMode: true };
    });
  },
  minimize: () => {
    const { automaton } = get();
    const minimized = minimizeDFA(automaton);
    set(state => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(minimized)); } catch {
    /* ignore persist error */
  }
      const history = [...state._history, state.automaton];
      const capped = history.length > 50 ? history.slice(history.length - 50) : history;
      return { _history: capped, _future: [], automaton: minimized, readOnly: true };
    });
  },
  generateRegex: () => {
    const { automaton } = get();
    set({ regex: dfaToRegex(automaton) });
  },
  importAutomaton: (json: string) => {
    try {
      const data = JSON.parse(json);
      // schema validation if available
      if (validateSchema) {
        const valid = validateSchema(data);
        if (!valid) {
          return { ok: false, error: 'Schema inválido: ' + (validateSchema.errors || []).map(e => e.message).join(', ') };
        }
      } else {
        ensureValidator();
      }
      if (!Array.isArray(data.states) || !Array.isArray(data.transitions)) {
        return { ok: false, error: 'Formato inválido' };
      }
      // normalize states
      const ids = new Set<string>();
      for (const rawState of data.states as Array<{ id?: unknown; start?: unknown; accept?: unknown }>) {
        if (!rawState.id || typeof rawState.id !== 'string') return { ok: false, error: 'Estado sin id válido' };
        if (ids.has(rawState.id)) return { ok: false, error: `Estado duplicado: ${rawState.id}` };
        ids.add(rawState.id);
      }
      const startStates = (data.states as Array<{ id: string; start?: unknown }>).filter(s => !!s.start);
      if (startStates.length !== 1) return { ok: false, error: 'Debe haber exactamente un estado inicial' };
      for (const rawT of data.transitions as Array<{ from?: unknown; to?: unknown; symbol?: unknown }>) {
        if (!rawT.from || !rawT.to || typeof rawT.symbol !== 'string') return { ok: false, error: 'Transición inválida' };
        if (!ids.has(String(rawT.from)) || !ids.has(String(rawT.to))) return { ok: false, error: 'Transición referencia estado inexistente' };
      }
      // alphabet derivation
      const alphabet = Array.from(new Set<string>((data.transitions as Array<{ symbol: unknown }>).map(t => String(t.symbol)))).sort();
      const automaton: Automaton = {
        alphabet,
        states: (data.states as Array<{ id: string; start?: unknown; accept?: unknown }>).map(s => ({ id: s.id, start: !!s.start, accept: !!s.accept })),
        transitions: (data.transitions as Array<{ from: string; to: string; symbol: string }>).map(t => ({ from: t.from, to: t.to, symbol: t.symbol }))
      };
      set(state => {
        try { localStorage.setItem(LS_KEY, JSON.stringify(automaton)); } catch {
          /* ignore persist error */
        }
        return { _history: [...state._history, state.automaton], _future: [], automaton, simResult: undefined, simStep: 0 };
      });
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      return { ok: false, error: message };
    }
  },
  exportAutomaton: () => {
    const { automaton } = get();
    return JSON.stringify(automaton, null, 2);
  },
  undo: () => {
    const { _history, automaton, _future } = get();
    if (_history.length === 0) return;
    const prev = _history[_history.length - 1];
    set({ automaton: prev, _history: _history.slice(0, -1), _future: [automaton, ..._future] });
  },
  redo: () => {
    const { _future, automaton, _history } = get();
    if (_future.length === 0) return;
    const next = _future[0];
    set({ automaton: next, _future: _future.slice(1), _history: [..._history, automaton] });
  },
  determinismIssues: () => {
    const { automaton } = get();
    const map = new Map<string, string[]>();
    for (const t of automaton.transitions) {
      const key = t.from + '|' + t.symbol;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t.to);
    }
    const issues: string[] = [];
    map.forEach((targets, key) => {
      if (targets.length > 1) issues.push(key);
    });
    return issues;
  }
}));
