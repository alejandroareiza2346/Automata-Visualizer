import React from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';

export const StateList: React.FC = () => {
  const { automaton, selectedStateId, selectState, toggleAccept, setStart } = useAutomatonStore(s => ({
    automaton: s.automaton,
    selectedStateId: s.selectedStateId,
    selectState: s.selectState,
    toggleAccept: s.toggleAccept,
    setStart: s.setStart
  }));

  return (
    <div className="panel" aria-label="Lista de estados">
      <h3>Estados</h3>
      <ul className="state-list">
        {automaton.states.map(st => (
          <li key={st.id} className={st.id === selectedStateId ? 'selected' : ''}>
            <button className="state-item" onClick={() => selectState(st.id)}>
              {st.start && '→'}{st.accept && '*'}{st.id}
            </button>
            <div className="inline-actions">
              <button onClick={() => setStart(st.id)} title="Marcar inicio">S</button>
              <button onClick={() => toggleAccept(st.id)} title="Toggle aceptación">A</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
