import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Unexpected error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <i className="ri-error-warning-line text-2xl text-red-500" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">
              {this.props.fallbackTitle || this.props.t('common.error')}
            </h2>
            <p className="text-sm text-foreground-600 mb-6">{this.state.message}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 cursor-pointer"
            >
              {this.props.t('common.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);
export default ErrorBoundary;
