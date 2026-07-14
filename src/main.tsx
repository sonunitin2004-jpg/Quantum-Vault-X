import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center font-sans">
          <div className="max-w-2xl w-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg text-left">
            <h1 className="text-2xl font-bold text-red-400 mb-4 text-center">Application Error</h1>
            <p className="text-gray-300 mb-6 text-sm text-center">
              An uncaught error occurred in the application. Please see the details below:
            </p>
            <div className="bg-black/40 p-4 rounded-lg font-mono text-xs text-red-300 overflow-x-auto whitespace-pre-wrap max-h-96 mb-6">
              {this.state.error?.toString()}
              {"\n\n"}
              {this.state.error?.stack}
            </div>
            <div className="text-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-105 transition-transform"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
