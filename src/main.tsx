import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </HashRouter>,
);
