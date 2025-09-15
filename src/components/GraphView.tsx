import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error svg extension types not bundled
import cytoscapeSvg from 'cytoscape-svg';

declare global {
  // minimal augmentation for runtime flag
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace cytoscape {
    // allow storing a flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface CytoscapeGlobal extends Record<string, unknown> { registeredSvg?: boolean }
  }
}

// register extension once
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cyAny = cytoscape as unknown as { registeredSvg?: boolean; use: (ext: unknown) => void };
if (cyAny.registeredSvg !== true) {
  cyAny.use(cytoscapeSvg as unknown);
  cyAny.registeredSvg = true;
}
import { useAutomatonStore } from '../store/useAutomatonStore';

export const GraphView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const { automaton, simResult, simStep } = useAutomatonStore(s => ({
    automaton: s.automaton,
    simResult: s.simResult,
    simStep: s.simStep
  }));
  const [lastExportMsg, setLastExportMsg] = useState<string>('');
  const [pngScale, setPngScale] = useState<number>(2);

  useEffect(() => {
    if (!containerRef.current) return;
    // If already initialized, just update elements to avoid losing positions
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.batch(() => {
        cy.elements().remove();
        cy.add([
          ...automaton.states.map(s => ({ data: { id: s.id }, classes: s.accept ? 'accept' : '' })),
          ...automaton.transitions.map(t => ({ data: { id: `${t.from}|${t.symbol}|${t.to}`, source: t.from, target: t.to, label: t.symbol } }))
        ]);
      });
      // Relayout for now (could preserve positions later)
      cy.layout({ name: 'breadthfirst', directed: true, padding: 20 }).run();
      return;
    }
    const cy: Core = cytoscape({
      container: containerRef.current,
      style: [
  { selector: 'node', style: { 'background-color': '#1d4ed8', 'label': 'data(id)', 'color': '#fff', 'text-valign': 'center', 'text-halign': 'center' } },
        { selector: 'node.accept', style: { 'border-width': 4, 'border-color': '#059669' } },
  { selector: 'node.active', style: { 'background-color': '#2563eb', 'border-color': '#90caf9', 'border-width':6 } },
  { selector: 'edge', style: { 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'label': 'data(label)', 'font-size': 10 } },
        { selector: 'edge.active', style: { 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b', width: 5 } }
      ],
      elements: [
        ...automaton.states.map(s => ({ data: { id: s.id }, classes: s.accept ? 'accept' : '' })),
        ...automaton.transitions.map(t => ({ data: { id: `${t.from}|${t.symbol}|${t.to}`, source: t.from, target: t.to, label: t.symbol } }))
      ],
      layout: { name: 'breadthfirst', directed: true, padding: 20 }
    });
    cyRef.current = cy;
    return () => { cy.destroy(); cyRef.current = null; };
  }, [automaton]);
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.nodes().removeClass('active');
    cy.edges().removeClass('active');
    if (!simResult || simStep === 0) return;
    const step = simResult.log[simStep - 1];
    if (!step) return;
    const edgeId = `${step.from}|${step.read}|${step.to}`;
    const edge = cy.getElementById(edgeId);
    if (edge) edge.addClass('active');
    const node = cy.getElementById(step.to);
    if (node) {
      node.addClass('active');
      // animación ligera pulsante (fallback simple si API soportada)
      try {
        node.animate({ style: { 'background-color': '#1d4ed8' } }, { duration: 120 })
            .animate({ style: { 'background-color': '#2563eb' } }, { duration: 160 });
      } catch {/* ignore animation errors */}
    }
  }, [simResult, simStep]);

  const exportPng = () => {
    if (!cyRef.current) return;
    try {
      const png = cyRef.current.png({ full: true, scale: pngScale });
      const a = document.createElement('a');
      a.href = png;
      a.download = 'automata.png';
      a.click();
      setLastExportMsg(`PNG exportado (escala x${pngScale})`);
      const live = document.getElementById('graph-live-region');
      if (live) live.textContent = `PNG exportado correctamente`;
    } catch (e) {
      setLastExportMsg('Error exportando PNG');
      const live = document.getElementById('graph-live-region');
      if (live) live.textContent = 'Error exportando PNG';
    }
  };
  const exportSvg = () => {
    if (!cyRef.current) return;
    try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error plugin method injected at runtime
  const svgContent: string = cyRef.current.svg({ scale: 1, full: true });
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'automata.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Fallo export SVG', err);
      alert('Error exportando SVG');
    }
  };
  const big = automaton.states.length > 150 || automaton.transitions.length > 500;
  return (
    <div className="graph-wrapper" aria-label="Visualización del autómata" role="region">
      {big && <div className="badge-warn" aria-live="polite">Grande: puede afectar rendimiento</div>}
      <div className="graph-container" ref={containerRef} aria-label="Grafo del autómata" tabIndex={0} />
      <div className="graph-export" role="toolbar" aria-label="Exportar imagen del grafo">
        <label>Escala
          <input aria-label="Escala PNG" type="number" min={1} max={5} value={pngScale} onChange={e => setPngScale(Math.max(1, Math.min(5, Number(e.target.value) || 1)))} />
        </label>
        <button onClick={exportPng} title="Exportar PNG" aria-label="Exportar como PNG">PNG</button>
        <button onClick={exportSvg} title="Exportar SVG" aria-label="Exportar como SVG">SVG</button>
        {lastExportMsg && <span className="export-msg">{lastExportMsg}</span>}
      </div>
      <div className="sr-only" aria-live="polite" id="graph-live-region" />
    </div>
  );
};
