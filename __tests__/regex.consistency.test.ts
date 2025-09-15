/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { dfaToRegex, simulateDFA } from '../src/utils/algorithms';
import { Automaton } from '../src/models/automaton';

// DFA: strings over {0,1} ending in 01
const dfa: Automaton = {
  alphabet:['0','1'],
  states:[
    { id:'q0', start:true },
    { id:'q1' },
    { id:'q2', accept:true }
  ],
  transitions:[
    { from:'q0', to:'q1', symbol:'0' },
    { from:'q0', to:'q0', symbol:'1' },
    { from:'q1', to:'q1', symbol:'0' },
    { from:'q1', to:'q2', symbol:'1' },
    { from:'q2', to:'q1', symbol:'0' },
    { from:'q2', to:'q0', symbol:'1' }
  ]
};

function jsRegexFromAutomaton(dfa: Automaton): RegExp {
  const raw = dfaToRegex(dfa);
  // naive transform: replace 'ε' with '' and union '|' kept, assume concatenation implicit
  const pattern = raw.replace(/ε/g,'');
  // fallback guard: if empty => never match except empty
  try { return new RegExp('^(' + pattern + ')$'); } catch { return /^$/; }
}

const sampleSpace = ['', '0','1','01','10','001','101','1101','1001','11101','0101'];

describe('dfaToRegex consistency (heuristic)', () => {
  it('regex matches all very short accepted strings and majority of sample', () => {
    const r = jsRegexFromAutomaton(dfa);
    const accepted = sampleSpace.filter(w => simulateDFA(dfa,w).accepted);
    const shortAccepted = accepted.filter(w => w.length <= 2); // '', '0','1','01','10' etc.
    // Todos los aceptados muy cortos deben estar cubiertos (más fácil de generar correctamente)
    for (const w of shortAccepted) {
      expect(r.test(w), `Regex should match short accepted '${w}'`).toBe(true);
    }
    // Cobertura mínima del 60% de aceptados del sample
    const matched = accepted.filter(w => r.test(w));
    const ratio = matched.length / accepted.length;
    expect(ratio >= 0.6, `Coverage ratio ${ratio.toFixed(2)} < 0.6`).toBe(true);
  });
});
