/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { useAutomatonStore } from '../src/store/useAutomatonStore';
import { Automaton } from '../src/models/automaton';

describe('determinismIssues', () => {
  it('detects collisions on same (from,symbol)', () => {
    const automaton: Automaton = {
      alphabet:['0','1'],
      states:[{id:'A',start:true},{id:'B'},{id:'C',accept:true}],
      transitions:[
        {from:'A',to:'B',symbol:'0'},
        {from:'A',to:'C',symbol:'0'} // collision
      ]
    };
    useAutomatonStore.getState().setAutomaton(automaton);
    const issues = useAutomatonStore.getState().determinismIssues();
    expect(issues.length).toBe(1);
    expect(issues[0]).toMatch(/^A\|0$/);
  });
});
