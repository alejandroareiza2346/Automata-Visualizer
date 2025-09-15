/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { simulateDFA } from '../src/utils/algorithms';
import { dfaEndsWith01 } from '../src/utils/examples';

// dfaEndsWith01 acepta cadenas que terminan en 01
describe('simulateDFA', () => {
  it('acepta cadena que termina en 01', () => {
    const res = simulateDFA(dfaEndsWith01, '1101');
    expect(res.accepted).toBe(true);
  });
  it('rechaza cadena que no termina en 01', () => {
    const res = simulateDFA(dfaEndsWith01, '1011');
    expect(res.accepted).toBe(false);
  });
  it('rechaza símbolo fuera del alfabeto', () => {
    const res = simulateDFA(dfaEndsWith01, '01x');
    expect(res.error).toBeDefined();
    expect(res.accepted).toBe(false);
  });
});
