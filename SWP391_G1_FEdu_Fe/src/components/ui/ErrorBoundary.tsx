import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Đã có lỗi xảy ra
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            Hệ thống gặp sự cố khi tải trang này. Vui lòng tải lại trang hoặc thử lại sau.
          </p>
          {this.state.error && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-2xl w-full overflow-auto">
              <p className="text-xs font-mono text-red-600 whitespace-pre-wrap">
                {this.state.error.toString()}
              </p>
            </div>
          )}
          <Button 
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
