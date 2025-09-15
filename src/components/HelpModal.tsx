import React, { useEffect, useRef } from 'react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
    } else if (lastFocus.current) {
      lastFocus.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const close = () => onClose();

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={close}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onMouseDown={e => e.stopPropagation()}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-header">
          <h2 id="help-title">Ayuda Rápida</h2>
          <button onClick={close} aria-label="Cerrar ayuda">×</button>
        </div>
        <div className="modal-body">
          <p>Esta es una versión resumida de la guía completa. Para detalles ver <code>docs/GUIA_USO.md</code>.</p>
          <h3>Acciones Básicas</h3>
          <ul>
            <li><strong>N</strong>: nuevo estado</li>
            <li><strong>T</strong>: nueva transición</li>
            <li><strong>Space</strong>: siguiente paso simulación</li>
            <li><strong>R</strong>: reiniciar simulación</li>
            <li><strong>Ctrl+I</strong>: importar JSON</li>
            <li><strong>Ctrl+E</strong>: exportar JSON</li>
          </ul>
          <h3>Flujo Sugerido</h3>
          <ol>
            <li>Construir (o importar) NFA.</li>
            <li>Probar cadenas críticas.</li>
            <li>Convertir a DFA.</li>
            <li>Minimizar.</li>
            <li>Generar regex (opcional).</li>
            <li>Exportar JSON + imagen.</li>
          </ol>
          <h3>Consejos</h3>
          <ul>
            <li>Minimiza antes de generar regex.</li>
            <li>Evita símbolos duplicados innecesarios.</li>
            <li>Revisa conflictos deterministas (badge ⚠ en título) antes de minimizar.</li>
          </ul>
          <p>Más información: abre el archivo <code>docs/GUIA_USO.md</code> en el repositorio.</p>
        </div>
        <div className="modal-footer">
          <button onClick={close}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
