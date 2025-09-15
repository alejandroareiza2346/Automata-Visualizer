/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { nfaToDFA, simulateDFA, simulateNFA } from '../src/utils/algorithms';
import { Automaton } from '../src/models/automaton';

// Simple NFA with epsilon: accepts strings ending in 'ab'
const nfa: Automaton = {
  alphabet: ['a','b'],
  states: [
    { id: 'q0', start: true },
    { id: 'q1' },
    { id: 'q2' },
    { id: 'q3', accept: true }
  ],
  transitions: [
    { from: 'q0', to: 'q0', symbol: 'a' },
    { from: 'q0', to: 'q0', symbol: 'b' },
    { from: 'q0', to: 'q1', symbol: 'a' },
    { from: 'q1', to: 'q2', symbol: 'b' },
    { from: 'q2', to: 'q3', symbol: 'ε' }
  ]
};

function randomStrings(alphabet: string[], count: number, maxLen: number): string[] {
  const out: string[] = [];
  for (let i=0;i<count;i++) {
    const len = Math.floor(Math.random()* (maxLen+1));
    let s = '';
    for (let j=0;j<len;j++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
    out.push(s);
  }
  return out;
}

describe('nfaToDFA equivalence', () => {
  it('NFA and converted DFA agree on random samples', () => {
    const { dfa } = nfaToDFA(nfa);
    const samples = randomStrings(nfa.alphabet, 25, 5);
    for (const w of samples) {
      const nfaRes = simulateNFA(nfa, w);
      const dfaRes = simulateDFA(dfa, w);
      expect(nfaRes.accepted).toBe(dfaRes.accepted);
    }
  });
});
