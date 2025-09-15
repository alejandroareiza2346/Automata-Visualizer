import React from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';

export const AutomatonGraph: React.FC = () => {
  const automaton = useAutomatonStore((s) => s.automaton);
  return (
    <div className="panel">
      <h3>Grafo (placeholder)</h3>
  <div><strong>Estados:</strong> {automaton.states.map((s) => s.id).join(', ')}</div>
      <div><strong>Transiciones:</strong></div>
      <ul className="list-unstyled">
        {automaton.transitions.map((t, i) => (
          <li key={i}>{t.from} -[{t.symbol}]→ {t.to}</li>
        ))}
      </ul>
    </div>
  );
};
