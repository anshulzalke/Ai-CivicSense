import React from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const title = this.props.title || "Something went wrong in the Government Portal";
      const message =
        this.state.error?.message ||
        "An unexpected rendering error occurred. The system has prevented a blank screen crash.";

      return (
        <div className="min-h-[420px] w-full flex items-center justify-center p-6 bg-paper">
          <div className="max-w-xl w-full bg-white border border-ink-200/80 rounded-2xl p-6 sm:p-8 shadow-lg text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Icon with Glow */}
            <div className="mx-auto w-14 h-14 rounded-2xl bg-signal-50 border border-signal-200 text-signal-600 flex items-center justify-center shadow-xs">
              <AlertTriangle size={28} className="text-signal-600" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-ink-900">
                {title}
              </h2>
              <p className="text-sm text-slate2 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-marigold-500 hover:bg-marigold-400 text-ink-950 font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-ink-900 hover:bg-ink-800 text-paper font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2.5 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-800 border border-ink-200 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Home size={14} />
                <span>Return Home</span>
              </button>
            </div>

            {/* Optional Collapsible Technical Details */}
            {this.state.error && (
              <div className="pt-3 border-t border-ink-100 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                  className="w-full flex items-center justify-between text-xs font-mono text-slate2 hover:text-ink-900 cursor-pointer"
                >
                  <span>Technical Diagnostics</span>
                  {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 bg-ink-950 text-paper font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 thin-scroll border border-ink-800 leading-relaxed">
                    <p className="text-signal-400 font-bold mb-1">
                      {String(this.state.error)}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-white/70 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
