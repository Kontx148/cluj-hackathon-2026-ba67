import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it so a single bad component
 * can't reduce the whole SPA to a black screen. Logs to console so the
 * underlying error is still visible in DevTools.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-boundary">
        <div className="empty-state">
          <h3>Something broke while rendering this view</h3>
          <p className="muted">
            The page crashed. The original error is shown below — open DevTools
            for the full stack trace.
          </p>
          <pre className="json-block" style={{ textAlign: 'left' }}>
            {this.state.error.name}: {this.state.error.message}
            {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
          </pre>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                this.reset();
                window.history.back();
              }}
            >
              Go back
            </button>
            <button type="button" className="btn btn--primary" onClick={this.reset}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
