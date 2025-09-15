import { Automaton } from '../models/automaton';

export const dfaEndsWith01: Automaton = {
  alphabet: ['0','1'],
  states: [
    { id: 'q0', start: true },
    { id: 'q1' },
    { id: 'q2', accept: true }
  ],
  transitions: [
    { from: 'q0', to: 'q1', symbol: '0' },
    { from: 'q0', to: 'q0', symbol: '1' },
    { from: 'q1', to: 'q2', symbol: '1' },
    { from: 'q1', to: 'q1', symbol: '0' },
    { from: 'q2', to: 'q0', symbol: '1' },
    { from: 'q2', to: 'q1', symbol: '0' }
  ]
};

// DFA que reconoce números binarios (sin ceros a la izquierda obligatorios) múltiplos de 3
// Estados representan resto mod 3
export const dfaBinaryMultiplesOf3: Automaton = {
  alphabet: ['0','1'],
  states: [
    { id: 'r0', start: true, accept: true },
    { id: 'r1' },
    { id: 'r2' }
  ],
  transitions: [
    // desde r0
    { from: 'r0', to: 'r0', symbol: '0' },
    { from: 'r0', to: 'r1', symbol: '1' },
    // desde r1
    { from: 'r1', to: 'r2', symbol: '0' },
    { from: 'r1', to: 'r0', symbol: '1' },
    // desde r2
    { from: 'r2', to: 'r1', symbol: '0' },
    { from: 'r2', to: 'r2', symbol: '1' }
  ]
};

// NFA con transiciones epsilon que acepta cadenas sobre {a,b} que contienen 'ab' como substring
export const nfaContainsAB: Automaton = {
  alphabet: ['a','b'],
  states: [
    { id: 's0', start: true },
    { id: 's1' },
    { id: 's2', accept: true }
  ],
  transitions: [
    // bucles en s0 para a/b antes de encontrar 'a'
    { from: 's0', to: 's0', symbol: 'a' },
    { from: 's0', to: 's0', symbol: 'b' },
    // epsilon a s1 cuando vemos una 'a' (no determinista: podemos decidir que esta 'a' sea el inicio del patrón)
    { from: 's0', to: 's1', symbol: '' },
    // desde s1 esperamos 'a' real para movernos o descartamos
    { from: 's1', to: 's1', symbol: 'a' },
    { from: 's1', to: 's2', symbol: 'b' },
    // aceptar: una vez en s2 podemos consumir cualquier cosa
    { from: 's2', to: 's2', symbol: 'a' },
    { from: 's2', to: 's2', symbol: 'b' }
  ]
};

export const examples = { dfaEndsWith01, dfaBinaryMultiplesOf3, nfaContainsAB };
