/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { simulateNFA } from '../src/utils/algorithms';
import { dfaEndsWith01 } from '../src/utils/examples';
import { Automaton } from '../src/models/automaton';

describe('simulateNFA', () => {
  it('accepts 01 using DFA as NFA', () => {
    const res = simulateNFA(dfaEndsWith01 as Automaton, '01');
    expect(res.accepted).toBe(true);
  });

  it('rejects 10 using DFA as NFA', () => {
    const res = simulateNFA(dfaEndsWith01 as Automaton, '10');
    expect(res.accepted).toBe(false);
  });

  it('handles epsilon transition acceptance', () => {
    const nfaWithEpsilon: Automaton = {
      alphabet: ['a'],
      states: [
        { id: 's', start: true },
        { id: 'h', accept: true }
      ],
      transitions: [
        { from: 's', to: 'h', symbol: 'ε' }
      ]
    };
    const res = simulateNFA(nfaWithEpsilon, '');
    expect(res.accepted).toBe(true);
  });
});
