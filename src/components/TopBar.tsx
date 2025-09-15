import React, { useRef, useState } from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';
import { examples } from '../utils/examples';
import { HelpModal } from './HelpModal';

export const TopBar: React.FC = () => {
  const minimize = useAutomatonStore(s => s.minimize);
  const convertNFA = useAutomatonStore(s => s.convertNFA);
  const generateRegex = useAutomatonStore(s => s.generateRegex);
  const setDfaMode = useAutomatonStore(s => s.setDfaMode);
  const dfaMode = useAutomatonStore(s => s.dfaMode);
  const importAutomaton = useAutomatonStore(s => s.importAutomaton);
  const exportAutomaton = useAutomatonStore(s => s.exportAutomaton);
  const undo = useAutomatonStore(s => s.undo);
  const redo = useAutomatonStore(s => s.redo);
  const determinismIssues = useAutomatonStore(s => s.determinismIssues);
  const setAutomaton = useAutomatonStore(s => s.setAutomaton);
  const readOnly = useAutomatonStore(s => s.readOnly);
  const toggleReadOnly = useAutomatonStore(s => s.toggleReadOnly);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>('');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const handleImportClick = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importAutomaton(String(reader.result));
      if (!res.ok) setStatus('Error: ' + res.error);
      else setStatus('Importado OK');
      e.target.value = '';
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const data = exportAutomaton();
    navigator.clipboard.writeText(data).then(() => {
      setStatus('Exportado al portapapeles');
    }).catch(() => setStatus('No se pudo copiar'));
  };

  return (
    <div className="topbar-wrapper">
      <header className="topbar" role="banner">
  <h1 className="app-title">Automata Visualizer {dfaMode && determinismIssues().length > 0 && <span className="badge-warn" title="Conflictos deterministas">⚠ {determinismIssues().length}</span>}</h1>
        <div className="actions" role="toolbar" aria-label="Acciones globales">
          <button onClick={() => setDfaMode(!dfaMode)} data-state={dfaMode ? 'on' : 'off'}>Modo: {dfaMode ? 'DFA' : 'NFA'}</button>
          <button onClick={convertNFA} title="Convertir NFA a DFA">NFA→DFA</button>
          <button onClick={minimize} title="Minimizar DFA" disabled={readOnly}>Minimizar</button>
          <button onClick={generateRegex} title="Generar Regex">Regex</button>
          <button onClick={undo} title="Deshacer (Undo)">Undo</button>
          <button onClick={redo} title="Rehacer (Redo)">Redo</button>
          <select aria-label="Ejemplos" onChange={e => {
            const key = e.target.value as keyof typeof examples;
            if (key && examples[key]) {
              setAutomaton(examples[key]);
              setStatus('Ejemplo cargado: ' + key);
            }
          }} defaultValue=""> 
            <option value="" disabled>Ejemplos...</option>
            {Object.keys(examples).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={handleImportClick} title="Importar JSON" disabled={readOnly}>Importar</button>
          <button onClick={handleExport} title="Copiar JSON al portapapeles">Exportar</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden-input" onChange={onFileChange} aria-hidden="true" />
          <button onClick={() => setShowHelp(true)} title="Ver ayuda rápida">Ayuda</button>
          {readOnly && <button onClick={() => { toggleReadOnly(false); setStatus('Edición reactivada'); }} title="Reactivar edición">Editar</button>}
        </div>
      </header>
      {readOnly && <div className="status-bar warn" role="alert" aria-live="assertive">Modo lectura activo tras minimización. Pulsa "Editar" para modificar.</div>}
      {status && <div className="status-bar" role="status" aria-live="polite">{status}</div>}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};
