/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { minimizeDFA, simulateDFA } from '../src/utils/algorithms';
import { Automaton } from '../src/models/automaton';

function run(dfa: Automaton, w: string) { return simulateDFA(dfa, w).accepted; }

describe('minimizeDFA edge cases', () => {
  it('single state already minimal', () => {
    const dfa: Automaton = { alphabet: ['0'], states:[{ id:'A', start:true, accept:true }], transitions:[] };
    const m = minimizeDFA(dfa);
    expect(m.states.length).toBe(1);
    expect(run(m,'')).toBe(true);
  });
  it('all accepting collapse', () => {
    const dfa: Automaton = { alphabet: ['0'], states:[{id:'A',start:true,accept:true},{id:'B',accept:true}], transitions:[{from:'A',to:'B',symbol:'0'},{from:'B',to:'B',symbol:'0'}]};
    const m = minimizeDFA(dfa);
    expect(m.states.length).toBe(1);
  });
  it('unreachable removed', () => {
    const dfa: Automaton = { alphabet:['0'], states:[{id:'A',start:true},{id:'B',accept:true},{id:'C'}], transitions:[{from:'A',to:'B',symbol:'0'},{from:'B',to:'B',symbol:'0'}]};
    const m = minimizeDFA(dfa);
    const ids = m.states.map(s=>s.id);
    expect(ids.includes('C')).toBe(false);
  });
});
