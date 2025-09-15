import React from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';

export const TransitionTable: React.FC = () => {
  const automaton = useAutomatonStore((s) => s.automaton);
  const headers: string[] = automaton.alphabet;
  return (
    <table className="transition-table">
      <thead>
        <tr>
          <th>Estado</th>
          {headers.map((h: string) => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
  {automaton.states.map((st) => (
          <tr key={st.id}>
            <td>{st.start ? '→ ' : ''}{st.accept ? '* ' : ''}{st.id}</td>
            {headers.map((h: string) => {
              const tr = automaton.transitions.find((t) => t.from === st.id && t.symbol === h);
              return <td key={h}>{tr ? tr.to : '—'}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
