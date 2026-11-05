import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WorkHive UI Error Caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-state-card" style={{ maxWidth: '600px', width: '100%', borderColor: '#ef4444' }}>
            <div className="empty-icon" style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 style={{ color: '#fca5a5', marginBottom: '0.75rem' }}>Something went wrong</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              An unexpected error occurred while rendering this view.
              {this.state.error?.message && (
                <code style={{ display: 'block', margin: '0.75rem 0', padding: '0.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', color: '#f87171' }}>
                  {this.state.error.message}
                </code>
              )}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={this.handleReload}>
                🔄 Refresh Page
              </button>
              <button className="btn btn-primary" onClick={this.handleGoHome}>
                🏠 Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

