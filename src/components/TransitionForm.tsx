import React, { useState } from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';

export const TransitionForm: React.FC = () => {
  const { automaton, addTransition } = useAutomatonStore(s => ({ automaton: s.automaton, addTransition: s.addTransition }));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [symbol, setSymbol] = useState('');

  const submit = () => {
    if (from && to && symbol) {
      addTransition(from, symbol, to);
      setSymbol('');
    }
  };

  return (
    <div className="panel">
      <h3>Nueva Transición</h3>
      <div className="form-row">
        <select aria-label="Desde" value={from} onChange={e => setFrom(e.target.value)}>
          <option value="">Desde</option>
          {automaton.states.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
        <select aria-label="Símbolo" value={symbol} onChange={e => setSymbol(e.target.value)}>
          <option value="">Σ</option>
          {automaton.alphabet.concat('ε').map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select aria-label="Hacia" value={to} onChange={e => setTo(e.target.value)}>
          <option value="">Hacia</option>
          {automaton.states.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
        <button onClick={submit} disabled={!from || !to || !symbol}>Añadir</button>
      </div>
    </div>
  );
};
