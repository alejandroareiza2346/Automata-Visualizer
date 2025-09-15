import { Automaton, DFASimulationResult, DFAStepLog, getAcceptStates, getStartState, StateId } from '../models/automaton';

export function simulateDFA(automaton: Automaton, input: string): DFASimulationResult {
  const start = getStartState(automaton);
  if (!start) {
    return { accepted: false, finalState: null, log: [], error: 'No start state defined' };
  }
  const acceptSet = new Set(getAcceptStates(automaton).map(s => s.id));
  const transIndex: Record<string, string> = {};
  for (const t of automaton.transitions) {
    // determinista: clave única from|symbol
    const key = `${t.from}|${t.symbol}`;
    if (transIndex[key]) {
      // conflicto determinista
      return { accepted: false, finalState: null, log: [], error: `Non-deterministic transition at ${key}` };
    }
    transIndex[key] = t.to;
  }

  let current = start.id;
  const log: DFAStepLog[] = [];
  let step = 1;
  for (const ch of input) {
    if (!automaton.alphabet.includes(ch)) {
      return { accepted: false, finalState: current, log, error: `Symbol '${ch}' not in alphabet` };
    }
    const key = `${current}|${ch}`;
    const next = transIndex[key];
    if (!next) {
      return { accepted: false, finalState: current, log, error: `No transition for (${current}, '${ch}')` };
    }
    log.push({ step, read: ch, from: current, to: next });
    current = next;
    step++;
  }
  return { accepted: acceptSet.has(current), finalState: current, log };
}

// ================= NFA SUPPORT =================

interface NFAStepLog extends DFAStepLog {
  // reuse base structure
}

export interface NFASimulationResult {
  accepted: boolean;
  finalStates: StateId[];
  log: NFAStepLog[];
  error?: string;
}

function epsilonClosure(automaton: Automaton, states: Set<StateId>): Set<StateId> {
  const closure = new Set<StateId>(states);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of automaton.transitions) {
      if (t.symbol === 'ε' && closure.has(t.from) && !closure.has(t.to)) {
        closure.add(t.to);
        changed = true;
      }
    }
  }
  return closure;
}

export function simulateNFA(automaton: Automaton, input: string): NFASimulationResult {
  const start = getStartState(automaton);
  if (!start) return { accepted: false, finalStates: [], log: [], error: 'No start state defined' };
  const acceptSet = new Set(getAcceptStates(automaton).map(s => s.id));
  let current = epsilonClosure(automaton, new Set([start.id]));
  const log: NFAStepLog[] = [];
  let step = 1;
  for (const ch of input) {
    if (!automaton.alphabet.includes(ch)) {
      return { accepted: false, finalStates: Array.from(current), log, error: `Symbol '${ch}' not in alphabet` };
    }
    const nextSet = new Set<StateId>();
    for (const t of automaton.transitions) {
      if (t.symbol === ch && current.has(t.from)) {
        nextSet.add(t.to);
      }
    }
    if (nextSet.size === 0) {
      return { accepted: false, finalStates: Array.from(current), log, error: `Dead on symbol '${ch}'` };
    }
    // epsilon closure of each reached state
    const withClosure = epsilonClosure(automaton, nextSet);
    // For logging, if deterministic path (single) record it; else record merged pseudo
    log.push({ step, read: ch, from: Array.from(current).join(','), to: Array.from(withClosure).join(',') });
    current = withClosure;
    step++;
  }
  const accepted = Array.from(current).some(s => acceptSet.has(s));
  return { accepted, finalStates: Array.from(current), log };
}

// ============ Subset Construction NFA -> DFA ============

export interface SubsetConversionTrace {
  subsetId: string; // joined sorted states
  states: StateId[];
  transitions: { symbol: string; to: string }[];
  isAccept: boolean;
}

export interface SubsetConstructionResult {
  dfa: Automaton;
  trace: SubsetConversionTrace[];
}

export function nfaToDFA(nfa: Automaton): SubsetConstructionResult {
  const start = getStartState(nfa);
  if (!start) {
    return { dfa: { alphabet: nfa.alphabet, states: [], transitions: [] }, trace: [] };
  }
  const acceptSet = new Set(getAcceptStates(nfa).map(s => s.id));
  const startClosure = epsilonClosure(nfa, new Set([start.id]));
  const queue: Set<string>[] = [startClosure];
  const seen = new Set<string>();
  const trace: SubsetConversionTrace[] = [];
  const dfaStates: { id: string; start?: boolean; accept?: boolean }[] = [];
  const dfaTransitions: { from: string; to: string; symbol: string }[] = [];

  function subsetId(set: Set<string>): string {
    return Array.from(set).sort().join('_') || '∅';
  }

  while (queue.length) {
    const subset = queue.shift()!;
    const id = subsetId(subset);
    if (seen.has(id)) continue;
    seen.add(id);
    const isAccept = Array.from(subset).some(s => acceptSet.has(s));
    dfaStates.push({ id, start: id === subsetId(startClosure), accept: isAccept });
    const localTransitions: { symbol: string; to: string }[] = [];
    for (const symbol of nfa.alphabet) {
      const moveSet = new Set<StateId>();
      for (const t of nfa.transitions) {
        if (t.symbol === symbol && subset.has(t.from)) moveSet.add(t.to);
      }
      if (moveSet.size === 0) continue;
      const closure = epsilonClosure(nfa, moveSet);
      const targetId = subsetId(closure);
      dfaTransitions.push({ from: id, to: targetId, symbol });
      localTransitions.push({ symbol, to: targetId });
      if (!seen.has(targetId)) queue.push(closure);
    }
    trace.push({ subsetId: id, states: Array.from(subset).sort(), transitions: localTransitions, isAccept });
  }

  return { dfa: { alphabet: nfa.alphabet, states: dfaStates, transitions: dfaTransitions }, trace };
}

// ============ Minimization (Hopcroft) STUB ============
export function minimizeDFA(dfa: Automaton): Automaton {
  // Preconditions: determinism assumed (caller responsible). Handle empty.
  if (!dfa.states.length) return dfa;
  const start = getStartState(dfa);
  if (!start) return dfa;

  // Build transition map δ(q,a) -> q'
  const delta: Record<string, Record<string, string>> = {};
  for (const s of dfa.states) delta[s.id] = {};
  for (const t of dfa.transitions) {
    (delta[t.from] ||= {})[t.symbol] = t.to;
  }

  // Remove unreachable states first
  const reachable = new Set<string>();
  const stack = [start.id];
  while (stack.length) {
    const q = stack.pop()!;
    if (reachable.has(q)) continue;
    reachable.add(q);
    for (const a of dfa.alphabet) {
      const nxt = delta[q]?.[a];
      if (nxt && !reachable.has(nxt)) stack.push(nxt);
    }
  }
  const states = dfa.states.filter(s => reachable.has(s.id));
  const acceptSet = new Set(states.filter(s => s.accept).map(s => s.id));
  const nonAcceptSet = new Set(states.filter(s => !s.accept).map(s => s.id));

  // Edge case: all accepting or all non-accepting -> single state result
  if (acceptSet.size === 0 || nonAcceptSet.size === 0) {
    const mergedId = Array.from(reachable).sort().join('_');
    return {
      alphabet: dfa.alphabet,
      states: [{ id: mergedId, start: true, accept: acceptSet.size > 0 }],
      transitions: [] // will rebuild below
    };
  }

  // Hopcroft algorithm
  let P: Set<string>[] = [acceptSet, nonAcceptSet];
  let W: Set<string>[] = [acceptSet.size <= nonAcceptSet.size ? acceptSet : nonAcceptSet];

  function signature(q: string, a: string): string | undefined {
    return delta[q]?.[a];
  }

  function splitBlock(block: Set<string>, a: string, splitter: Set<string>): [Set<string>, Set<string>] | null {
    const X: string[] = [];
    const Y: string[] = [];
    for (const q of block) {
      const to = signature(q, a);
      if (to && splitter.has(to)) X.push(q); else Y.push(q);
    }
    if (X.length && Y.length) return [new Set(X), new Set(Y)];
    return null;
  }

  while (W.length) {
    const A = W.pop()!; // splitter
    for (const a of dfa.alphabet) {
      // For each block in P attempt split
      const newP: Set<string>[] = [];
      const newW: Set<string>[] = [];
      for (const block of P) {
        const res = splitBlock(block, a, A);
        if (res) {
          const [X, Y] = res;
            newP.push(X, Y);
          // Maintain W: if block was in W replace; else add smaller part
          if (W.includes(block)) {
            // Replace block by both
            newW.push(X, Y);
          } else {
            newW.push(X.size <= Y.size ? X : Y);
          }
        } else {
          newP.push(block);
        }
      }
      P = newP;
  // Update work list
  W = newW;
    }
  }

  // Build mapping from state -> representative (merged id = sorted states in block)
  const blockId = (block: Set<string>) => Array.from(block).sort().join('_');
  const repMap: Record<string, string> = {};
  const newStates: { id: string; start?: boolean; accept?: boolean }[] = [];
  for (const block of P) {
    const id = blockId(block);
    let isStart = false;
    let isAccept = false;
    for (const q of block) {
      repMap[q] = id;
      if (q === start.id) isStart = true;
      if (acceptSet.has(q)) isAccept = true;
    }
    newStates.push({ id, start: isStart, accept: isAccept });
  }

  // Build minimized transitions (avoid duplicates)
  const newTransKey = new Set<string>();
  const newTransitions: { from: string; to: string; symbol: string }[] = [];
  for (const q of Object.keys(delta)) {
    if (!repMap[q]) continue; // skip unreachable filtered out earlier
    for (const a of dfa.alphabet) {
      const to = delta[q][a];
      if (!to || !repMap[to]) continue;
      const fromId = repMap[q];
      const toId = repMap[to];
      const key = `${fromId}|${a}|${toId}`;
      if (!newTransKey.has(key)) {
        newTransKey.add(key);
        newTransitions.push({ from: fromId, to: toId, symbol: a });
      }
    }
  }

  return { alphabet: dfa.alphabet, states: newStates, transitions: newTransitions };
}

// ============ DFA -> Regex (State Elimination) STUB ============
export function dfaToRegex(dfa: Automaton): string {
  if (dfa.states.length === 0) return '∅';
  const start = getStartState(dfa);
  if (!start) return '∅';
  const acceptStates = dfa.states.filter(s => s.accept).map(s => s.id);
  if (acceptStates.length === 0) return '∅';

  // Clone states list and add new super start and super accept if needed
  const states = dfa.states.map(s => s.id);
  const superStart = '__S__';
  const superAccept = '__F__';
  if (!states.includes(superStart)) states.unshift(superStart);
  if (!states.includes(superAccept)) states.push(superAccept);

  // Build adjacency regex map R[i][j]
  const R: Record<string, Record<string, string>> = {};
  function addEdge(i: string, j: string, re: string) {
    if (!R[i]) R[i] = {};
    if (!R[i][j]) R[i][j] = re;
    else {
      if (R[i][j] === re) return;
      // union simplify duplicate entries
      R[i][j] = unionRegex(R[i][j], re);
    }
  }

  // Initialize with existing transitions (merge parallel edges)
  for (const t of dfa.transitions) {
    addEdge(t.from, t.to, escapeSymbol(t.symbol));
  }
  // ε edges from superStart to original start
  addEdge(superStart, start.id, 'ε');
  // ε edges from each accept to superAccept
  for (const f of acceptStates) addEdge(f, superAccept, 'ε');

  // Eliminate intermediate states (all except superStart & superAccept)
  const eliminables = states.filter(s => s !== superStart && s !== superAccept);
  for (const k of eliminables) {
    const loop = R[k]?.[k];
    for (const i of states) {
      if (!R[i] || !R[i][k] || i === k) continue;
      for (const j of states) {
        if (!R[k] || !R[k][j] || j === k) continue;
        const part1 = R[i][k];
        const part2 = loop ? `(${loop})*` : '';
        const part3 = R[k][j];
        const concat = simplifyConcat([part1, part2, part3]);
        addEdge(i, j, concat || 'ε');
      }
    }
    // Remove k
    for (const i of Object.keys(R)) delete R[i][k];
    delete R[k];
  }
  const result = R[superStart]?.[superAccept];
  if (!result) return '∅';
  return simplifyFinal(result);
}

// ===== Regex helpers (very light heuristic simplification) =====
function escapeSymbol(sym: string): string {
  if (sym === 'ε') return 'ε';
  if (/^[a-zA-Z0-9]$/.test(sym)) return sym;
  return `\\${sym}`;
}

function unionRegex(a: string, b: string): string {
  if (a === b) return a;
  const parts = new Set(
    a.split('|').concat(b.split('|')).map(p => p).filter(p => p.length > 0)
  );
  return Array.from(parts).sort().join('|');
}

function simplifyConcat(parts: string[]): string {
  const filtered = parts.filter(p => p && p !== 'ε');
  if (filtered.length === 0) return 'ε';
  return filtered.join('');
}

function simplifyFinal(re: string): string {
  // Remove redundant unions like a|a
  re = unionRegex(re, ''); // ensures normalization of union duplicates
  // Basic parentheses cleanup: (a) -> a when safe
  re = re.replace(/\((\w)\)/g, '$1');
  return re;
}
