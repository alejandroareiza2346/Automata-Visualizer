import React, { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { StateList } from './components/StateList';
import { StateForm } from './components/StateForm';
import { TransitionForm } from './components/TransitionForm';
import { GraphView } from './components/GraphView';
import { TransitionTable } from './components/TransitionTable';
import { SimulatorPanel } from './components/SimulatorPanel';
import { SubsetPanel } from './components/SubsetPanel';
import { AlphabetPanel } from './components/AlphabetPanel';
import './styles/global.css';
import { useAutomatonStore } from './store/useAutomatonStore';

export const App: React.FC = () => {
  const {
    stepForward,
    resetSimulation,
    runDFASimulation,
    runNFASimulation,
    dfaMode,
    addState,
    addTransition,
    simInput,
    selectedStateId,
    selectedTransitionIndex,
    removeState,
    removeTransition,
    importAutomaton,
    exportAutomaton
  } = useAutomatonStore(s => ({
    stepForward: s.stepForward,
    resetSimulation: s.resetSimulation,
    runDFASimulation: s.runDFASimulation,
    runNFASimulation: s.runNFASimulation,
    dfaMode: s.dfaMode,
    addState: s.addState,
    addTransition: s.addTransition,
    simInput: s.simInput,
    selectedStateId: s.selectedStateId,
    selectedTransitionIndex: s.selectedTransitionIndex,
    removeState: s.removeState,
    removeTransition: s.removeTransition,
    importAutomaton: s.importAutomaton,
    exportAutomaton: s.exportAutomaton
  }));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      // Ctrl+I => Import JSON
      if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        const json = prompt('Pega el JSON del autómata a importar');
        if (json) {
          const res = importAutomaton(json);
          if (!res.ok) alert('Error al importar: ' + res.error);
          else alert('Autómata importado');
        }
        return;
      }
      // Ctrl+E => Export JSON (copiar al portapapeles y descargar archivo)
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        const data = exportAutomaton();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(data).catch(() => {});
        }
        try {
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'automata.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch {/* ignore */}
        alert('Exportado (copiado al portapapeles y descargado)');
        return;
      }
      switch (e.key) {
        case ' ': // Space for step
          e.preventDefault();
          stepForward();
          break;
        case 'Delete':
          if (selectedStateId) {
            removeState(selectedStateId);
          } else if (selectedTransitionIndex != null) {
            removeTransition(selectedTransitionIndex);
          }
          break;
        case 'r':
        case 'R':
          resetSimulation();
          break;
        case 'n':
        case 'N': {
          const id = prompt('Nuevo estado (id)');
            if (id) addState(id.trim());
          break; }
        case 't':
        case 'T': {
          const from = prompt('Desde estado');
          if (!from) break;
          const symbol = prompt('Símbolo');
          if (!symbol) break;
          const to = prompt('Hacia estado');
          if (!to) break;
          addTransition(from.trim(), symbol.trim(), to.trim());
          break; }
        case 'Enter':
          if (simInput.length > 0) {
            dfaMode ? runDFASimulation() : runNFASimulation();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    stepForward,
    resetSimulation,
    runDFASimulation,
    runNFASimulation,
    dfaMode,
    addState,
    addTransition,
    simInput,
    selectedStateId,
    selectedTransitionIndex,
    removeState,
    removeTransition,
    importAutomaton,
    exportAutomaton
  ]);

  return (
    <div className="app-root">
      <TopBar />
      <div className="main-layout">
        <aside className="sidebar">
          <StateForm />
          <TransitionForm />
          <StateList />
          <AlphabetPanel />
        </aside>
        <main className="canvas-area">
          <GraphView />
          <div className="table-wrapper"><TransitionTable /></div>
        </main>
        <aside className="right-panel">
          <SimulatorPanel />
          <SubsetPanel />
        </aside>
      </div>
    </div>
  );
};

export default App;
