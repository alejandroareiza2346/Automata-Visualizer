/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { minimizeDFA, simulateDFA } from '../src/utils/algorithms';
import { Automaton } from '../src/models/automaton';

describe('minimizeDFA', () => {
  // DFA for language: binary strings ending in 01 with redundant equivalent states
  const redundantDFA: Automaton = {
    alphabet: ['0','1'],
    states: [
      { id: 'A', start: true }, // start
      { id: 'B' }, // after reading 0 (potentially before 1)
      { id: 'C', accept: true }, // ends with 01
      { id: 'D' }, // dead state 1
      { id: 'E' }  // dead state 2 (equivalent to D)
    ],
    transitions: [
      { from: 'A', to: 'B', symbol: '0' },
      { from: 'A', to: 'D', symbol: '1' },
      { from: 'B', to: 'B', symbol: '0' },
      { from: 'B', to: 'C', symbol: '1' },
      { from: 'C', to: 'B', symbol: '0' },
      { from: 'C', to: 'D', symbol: '1' },
      // dead transitions
      { from: 'D', to: 'D', symbol: '0' },
      { from: 'D', to: 'D', symbol: '1' },
      { from: 'E', to: 'E', symbol: '0' },
      { from: 'E', to: 'E', symbol: '1' }
    ]
  };

  it('reduces equivalent dead states', () => {
    const minimized = minimizeDFA(redundantDFA);
    expect(minimized.states.length).toBeLessThan(redundantDFA.states.length);
    // Behavior equivalence sample
    const samples = ['','0','1','01','101','001','111','0101','0001'];
    for (const w of samples) {
      const before = simulateDFA(redundantDFA, w).accepted;
      const after = simulateDFA(minimized, w).accepted;
      expect(after).toBe(before);
    }
  });
});
