import React, { useState } from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';

export const StateForm: React.FC = () => {
  const addState = useAutomatonStore(s => s.addState);
  const [value, setValue] = useState('');
  const onAdd = () => {
    if (/^[A-Za-z0-9_]+$/.test(value)) {
      addState(value);
      setValue('');
    }
  };
  return (
    <div className="panel">
      <h3>Nuevo Estado</h3>
      <div className="form-row">
        <input aria-label="ID estado" value={value} onChange={e => setValue(e.target.value)} placeholder="q3" />
        <button onClick={onAdd} disabled={!value}>Añadir</button>
      </div>
    </div>
  );
};
