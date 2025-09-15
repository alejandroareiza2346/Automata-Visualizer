import React from 'react';

interface ErrorBoundaryState { hasError: boolean; message?: string; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    if (error instanceof Error) {
      return { hasError: true, message: error.message };
    }
    return { hasError: true, message: String(error) };
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary', error, info);
  }
  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
  };
  render() {
    if (this.state.hasError) {
      return (
  <div role="alert" className="error-boundary-box">
          <h2>Ha ocurrido un error en la interfaz</h2>
          <p>{this.state.message}</p>
          <button onClick={() => window.location.reload()}>Recargar página</button>
          <button onClick={this.handleReload} className="ml-2">Intentar continuar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
