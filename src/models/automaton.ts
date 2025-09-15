export type StateId = string;

export interface State {
  id: StateId;
  label?: string;
  start?: boolean;
  accept?: boolean;
  x?: number;
  y?: number;
}

export interface Transition {
  from: StateId;
  to: StateId;
  symbol: string; // 'ε' permitido para NFA
}

export interface Automaton {
  alphabet: string[]; // excluye 'ε'
  states: State[];
  transitions: Transition[];
}

export interface DFAStepLog {
  step: number;
  read: string;
  from: StateId;
  to: StateId;
}

export interface DFASimulationResult {
  accepted: boolean;
  finalState: StateId | null;
  log: DFAStepLog[];
  error?: string;
}

export function getStartState(automaton: Automaton): State | undefined {
  return automaton.states.find(s => s.start);
}

export function getAcceptStates(automaton: Automaton): State[] {
  return automaton.states.filter(s => s.accept);
}
