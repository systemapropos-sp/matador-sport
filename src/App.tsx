import { Component, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HistoricalSales from './pages/HistoricalSales';
import PlayMonitor from './pages/PlayMonitor';
import ClientPortal from './pages/ClientPortal';
import { ModalProvider } from './components/modals';
import { ThemeProvider } from './context/ThemeContext';

// ── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[NMV ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f9fafb', padding: 32, fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: 600, background: '#fff', borderRadius: 12,
            padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            border: '1px solid #fca5a5'
          }}>
            <h2 style={{ color: '#dc2626', marginTop: 0 }}>⚠️ Error de la aplicación</h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Hubo un problema al cargar la página. Por favor, reporta este error:
            </p>
            <pre style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 8, padding: 16, fontSize: 12,
              color: '#991b1b', overflowX: 'auto', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
            </pre>
            <button
              onClick={async () => {
                localStorage.clear();
                // Clear ALL Service Worker caches
                if ('caches' in window) {
                  try {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(k => caches.delete(k)));
                  } catch(e) { /* ignore */ }
                }
                // Unregister all service workers so the fresh SW loads
                if ('serviceWorker' in navigator) {
                  try {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map(r => r.unregister()));
                  } catch(e) { /* ignore */ }
                }
                window.location.reload();
              }}
              style={{
                marginTop: 16, padding: '10px 20px', background: '#3b82f6',
                color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 600
              }}
            >
              Limpiar caché y recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ModalProvider>
          <Routes>
            <Route path="/sessions/new" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/betting-pool/ticket/create" element={<Dashboard />} />
            <Route path="/betting-pool/historical-sale" element={<HistoricalSales />} />
            <Route path="/betting-pool/play-monitor" element={<PlayMonitor />} />
            <Route path="/portal" element={<ClientPortal />} />
            <Route path="/cliente" element={<ClientPortal />} />
            <Route path="/" element={<Navigate to="/sessions/new" replace />} />
          </Routes>
        </ModalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
