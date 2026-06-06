import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HistoricalSales from './pages/HistoricalSales';
import PlayMonitor from './pages/PlayMonitor';
import { ModalProvider } from './components/modals';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <ModalProvider>
        <Routes>
          <Route path="/sessions/new" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/betting-pool/ticket/create" element={<Dashboard />} />
          <Route path="/betting-pool/historical-sale" element={<HistoricalSales />} />
          <Route path="/betting-pool/play-monitor" element={<PlayMonitor />} />
          <Route path="/" element={<Navigate to="/sessions/new" replace />} />
        </Routes>
      </ModalProvider>
    </ThemeProvider>
  );
}
