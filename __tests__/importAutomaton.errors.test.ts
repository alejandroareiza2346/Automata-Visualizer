/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { useAutomatonStore } from '../src/store/useAutomatonStore';

function importJSON(obj: any) {
  const json = JSON.stringify(obj);
  return useAutomatonStore.getState().importAutomaton(json);
}

describe('importAutomaton error handling', () => {
  it('duplicate state id', () => {
    const res = importJSON({ alphabet:['a'], states:[{id:'A',start:true},{id:'A'}], transitions:[] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/duplicado/i);
  });
  it('missing start state', () => {
    const res = importJSON({ alphabet:['a'], states:[{id:'A'}], transitions:[] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/inicial/i);
  });
  it('transition references unknown state', () => {
    const res = importJSON({ alphabet:['a'], states:[{id:'A',start:true}], transitions:[{from:'A',to:'B',symbol:'a'}] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/inexistente/i);
  });
});
