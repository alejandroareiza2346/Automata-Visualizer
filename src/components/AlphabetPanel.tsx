import React, { useState } from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';

export const AlphabetPanel: React.FC = () => {
  const { automaton, addSymbol, removeSymbol } = useAutomatonStore(s => ({
    automaton: s.automaton,
    addSymbol: s.addSymbol,
    removeSymbol: s.removeSymbol
  }));
  const [value, setValue] = useState('');
  const onAdd = () => {
    const sym = value.trim();
    if (!sym) return;
    addSymbol(sym);
    setValue('');
  };
  return (
    <div className="alphabet-panel" aria-label="Panel alfabeto" role="region">
      <h3 style={{ marginTop: 0 }}>Alfabeto</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {automaton.alphabet.map(sym => (
          <span key={sym} className="chip" aria-label={`Símbolo ${sym}`}>
            {sym}
            {!automaton.transitions.some(t => t.symbol === sym) && (
              <button onClick={() => removeSymbol(sym)} aria-label={`Eliminar símbolo ${sym}`}>×</button>
            )}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <input aria-label="Nuevo símbolo" value={value} maxLength={4} onChange={e => setValue(e.target.value)} style={{ width: 80 }} />
        <button onClick={onAdd} disabled={!value.trim()}>Añadir</button>
      </div>
      <p style={{ fontSize: '0.7rem', marginTop: 4 }}>Un símbolo no se puede eliminar si está usado en alguna transición.</p>
    </div>
  );
};
