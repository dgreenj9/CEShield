import React from 'react';

// Minimal error boundary. Catches render-time exceptions so a single broken
// component (e.g. malformed citation data) doesn't blank the entire dashboard.
// Hooks can't catch errors yet; this stays a class on purpose.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Logging hook — wire to a telemetry endpoint when one exists.
    // For now, keep the dev console output. Production users see the fallback.
    // eslint-disable-next-line no-console
    console.error('CE Shield render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const Fallback = this.props.fallback;
    if (Fallback) {
      return <Fallback error={this.state.error} reset={this.handleReset} />;
    }
    return (
      <div
        role="alert"
        className="m-8 p-6 text-sm"
        style={{ background: 'rgba(224,168,90,0.06)', border: '1px solid rgba(224,168,90,0.35)', borderRadius: 6 }}
      >
        <h2 className="font-display text-2xl font-normal m-0 mb-2">
          This page failed to render.
        </h2>
        <p className="mb-4" style={{ color: "#D5C9D9" }}>
          The error is in the page, not your data. Reload to recover. If it
          repeats, email hello@ceshield.com with what you were doing.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: '#F0C3A8', color: '#2A2230', fontWeight: 500, borderRadius: 999, minHeight: 44 }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
