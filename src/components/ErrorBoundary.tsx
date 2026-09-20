/**
 * Error boundary: a crashed panel shows a retry instead of a blank page.
 *
 * @module components/ErrorBoundary
 */

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  label: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error(`[ErrorBoundary:${this.props.label}]`, error);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            {this.props.label} crashed
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
