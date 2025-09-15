import React from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';
import { nfaToDFA } from '../utils/algorithms';

// Simple on-demand subset construction visualization
export const SubsetPanel: React.FC = () => {
  const automaton = useAutomatonStore(s => s.automaton);
  const dfaMode = useAutomatonStore(s => s.dfaMode);
  if (dfaMode) return null; // Only relevant in NFA mode
  const { trace } = nfaToDFA(automaton);
  if (!trace.length) return <div className="panel" aria-label="Subset construction">Sin datos subset</div>;
  return (
    <div className="panel" aria-label="Subset construction">
      <h3>Subset Construction</h3>
      <table className="transition-table" aria-label="Subconjuntos">
        <thead>
          <tr><th>Subset</th><th>Estados NFA</th><th>Transiciones</th><th>Acept.</th></tr>
        </thead>
        <tbody>
          {trace.map(row => (
            <tr key={row.subsetId}>
              <td>{row.subsetId}</td>
              <td>{row.states.join(',')}</td>
              <td>{row.transitions.map(t => `${t.symbol}→${t.to}`).join(', ')}</td>
              <td>{row.isAccept ? '✔' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
