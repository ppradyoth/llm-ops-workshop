import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("frontend_error_boundary", { error, info });
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-slate-950">
        <section className="w-full max-w-xl rounded-md border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Application error
          </p>
          <h1 className="mt-3 text-2xl font-bold">Something went wrong in the interface.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The backend may still be healthy. Reset the interface and try the request again.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
            {this.state.error.message || "Unknown frontend error"}
          </pre>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Reset interface
          </button>
        </section>
      </main>
    );
  }
}
