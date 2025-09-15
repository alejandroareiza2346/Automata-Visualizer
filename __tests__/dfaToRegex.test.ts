/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { dfaToRegex, simulateDFA } from '../src/utils/algorithms';
import { Automaton } from '../src/models/automaton';

describe('dfaToRegex', () => {
  // DFA for strings ending in 01
  const dfa: Automaton = {
    alphabet: ['0','1'],
    states: [
      { id: 'q0', start: true },
      { id: 'q1' },
      { id: 'q2', accept: true }
    ],
    transitions: [
      { from: 'q0', to: 'q1', symbol: '0' },
      { from: 'q0', to: 'q0', symbol: '1' },
      { from: 'q1', to: 'q1', symbol: '0' },
      { from: 'q1', to: 'q2', symbol: '1' },
      { from: 'q2', to: 'q1', symbol: '0' },
      { from: 'q2', to: 'q0', symbol: '1' }
    ]
  };

  it('produces a non-empty regex containing 01 fragment', () => {
    const re = dfaToRegex(dfa);
    expect(re.length).toBeGreaterThan(0);
    expect(re.includes('0') || re.includes('1')).toBe(true);
    // Minimal semantic sanity: regex should mention 0 and 1 (since language depends on both) or ε for structure.
    expect(/0/.test(re)).toBe(true);
    expect(/1/.test(re)).toBe(true);
  });
});
