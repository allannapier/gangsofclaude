import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Add error boundary for mobile debugging
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('=== REACT ERROR BOUNDARY ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);

    // Try to log the error value that's being rendered
    try {
      const errorValue = (error as any).value;
      if (errorValue) {
        console.error('Error value:', errorValue);
        console.error('Error value type:', typeof errorValue);
        console.error('Error value keys:', errorValue ? Object.keys(errorValue) : 'N/A');
      }
    } catch (e) {
      console.error('Could not extract error value:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#18181b' }}>
          <h1>Something went wrong</h1>
          <p>Please try refreshing the page</p>
          <details style={{ marginTop: '20px' }}>
            <summary>Error details (for debugging)</summary>
            <p><strong>Error:</strong> {String(this.state.error)}</p>
            {this.state.errorInfo && (
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>{JSON.stringify({
                message: this.state.error.message,
                stack: this.state.error.stack?.substring(0, 500),
                componentStack: this.state.errorInfo.componentStack,
              }, null, 2)}</pre>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Log that main.tsx is executing
console.log('[main] Starting app...');
console.log('[main] User Agent:', navigator.userAgent);
console.log('[main] Platform:', navigator.platform);
console.log('[main] Vendor:', navigator.vendor);

try {
  const rootElement = document.getElementById('root');
  console.log('[main] Root element:', rootElement);

  if (!rootElement) {
    console.error('[main] Root element not found!');
    document.body.innerHTML = '<div style="color: white; padding: 20px;">Error: Root element not found</div>';
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    console.log('[main] App rendered successfully');
  }
} catch (error) {
  console.error('[main] Fatal error during render:', error);
  document.body.innerHTML = `<div style="color: white; padding: 20px;">Fatal error: ${String(error)}</div>`;
}
