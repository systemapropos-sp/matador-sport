import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// ── Capture beforeinstallprompt BEFORE React renders ──────────────────────
// Chrome fires this event very early — before component mount.
// We store it globally so Navbar can use it later.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__installPrompt = e;
  // Dispatch custom event so Navbar can react if it's already mounted
  window.dispatchEvent(new CustomEvent('nmv-install-ready'));
  console.log('[NMV] Install prompt captured');
});
window.addEventListener('appinstalled', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__installPrompt = null;
  window.dispatchEvent(new CustomEvent('nmv-app-installed'));
  console.log('[NMV] App installed');
});

// ── Service Worker: VitePWA handles registration via sw.js (Workbox) ──
// Custom nmv-sw.js is NOT registered separately to avoid SW conflicts.
// VitePWA (skipWaiting + clientsClaim) ensures fresh content on every deploy.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NMV_SW_UPDATED') {
      console.log('[NMV] SW active — fresh content available');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);
