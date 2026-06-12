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
        className="m-8 p-6 bg-red-50 border border-red-200 rounded-lg text-sm"
      >
        <h2 className="text-lg font-semibold text-red-700 m-0 mb-2">
          Something went wrong.
        </h2>
        <p className="text-red-700 mb-4">
          The page hit an unexpected error and couldn&rsquo;t render. Try
          refreshing &mdash; if it keeps happening, let us know what you were
          doing.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          Reload page
        </button>
      </div>
    );
  }
}
