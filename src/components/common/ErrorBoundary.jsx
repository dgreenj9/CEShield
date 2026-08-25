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
        style={{ background: '#F6F3E7', border: '1px dashed #1B1A17' }}
      >
        <h2 className="font-display text-lg font-semibold m-0 mb-2">
          Something went wrong.
        </h2>
        <p className="mb-4" style={{ color: "#45433C" }}>
          The page hit an unexpected error and couldn&rsquo;t render. Try
          refreshing &mdash; if it keeps happening, let us know what you were
          doing.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: '#235E6B', color: '#FAFAF5', fontWeight: 600 }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
