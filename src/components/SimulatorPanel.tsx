import React, { useEffect, useRef } from 'react';
import { useAutomatonStore } from '../store/useAutomatonStore';

export const SimulatorPanel: React.FC = () => {
  const {
    simInput,
    setSimInput,
    runDFASimulation,
    runNFASimulation,
    simResult,
    simStep,
    stepForward,
    resetSimulation,
    runFull,
    dfaMode
  } = useAutomatonStore(s => ({
    simInput: s.simInput,
    setSimInput: s.setSimInput,
    runDFASimulation: s.runDFASimulation,
    runNFASimulation: s.runNFASimulation,
    simResult: s.simResult,
    simStep: s.simStep,
    stepForward: s.stepForward,
    resetSimulation: s.resetSimulation,
    runFull: s.runFull,
    dfaMode: s.dfaMode
  }));

  const run = () => (dfaMode ? runDFASimulation() : runNFASimulation());
  const currentHighlight = simResult?.log && simStep > 0 ? simResult.log[simStep - 1] : undefined;
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!liveRef.current || !currentHighlight) return;
    liveRef.current.textContent = `Paso ${currentHighlight.step}: ${currentHighlight.from} a ${currentHighlight.to} leyendo ${currentHighlight.read}`;
  }, [currentHighlight]);

  return (
    <div className="panel" aria-label="Simulación">
      <h3>Simulación {dfaMode ? 'DFA' : 'NFA'}</h3>
      <div className="form-row">
        <input aria-label="Cadena" value={simInput} onChange={e => setSimInput(e.target.value)} placeholder="Cadena" />
        <button onClick={run}>Preparar</button>
        <button onClick={stepForward} disabled={!simResult || simStep >= (simResult?.log.length || 0)}>Paso</button>
        <button onClick={runFull} disabled={!simResult}>Completo</button>
        <button onClick={resetSimulation} disabled={!simResult}>Reset</button>
      </div>
      {simResult && (
        <>
          {simResult.error && (
            <div
              role="alert"
              className="error-banner"
              aria-live="assertive"
              style={{
                background:'#fee2e2',
                color:'#991b1b',
                padding:'0.5rem 0.75rem',
                border:'1px solid #fca5a5',
                borderRadius:4,
                marginBottom:'0.5rem'
              }}
            >Error de simulación: {simResult.error}</div>
          )}
          <div className="result" aria-live="polite">
            {!simResult.error && `Resultado: ${simResult.accepted ? 'Aceptada' : 'Rechazada'}`}
          </div>
          <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
          <table className="transition-table" aria-label="Log de pasos">
            <thead>
              <tr><th>#</th><th>Desde</th><th>Leer</th><th>Hacia</th></tr>
            </thead>
            <tbody>
              {simResult.log.map((l,i) => (
                <tr key={i} className={i < simStep ? 'done-row' : i === simStep ? 'active-row' : ''}>
                  <td>{l.step}</td>
                  <td>{l.from}</td>
                  <td>{l.read}</td>
                  <td>{l.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentHighlight && <div className="hint">Paso actual: {currentHighlight.from} -[{currentHighlight.read}]→ {currentHighlight.to}</div>}
        </>
      )}
    </div>
  );
};
