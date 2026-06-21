import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import SideMenu from './SideMenu';
import ResultsPanel from './ResultsPanel';
import { ModalManager, useModalContext } from './modals';
import { ThemeProvider } from '@/context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  onMenuToast?: (message: string) => void;
}

function LayoutInner({ children, onMenuToast }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const { openModal } = useModalContext();

  return (
    <div className="min-h-[100dvh]">
      <Navbar
        onMenuToggle={() => setMenuOpen(true)}
        onResultsToggle={() => setResultsOpen(!resultsOpen)}
        resultsOpen={resultsOpen}
        onSettings={() => openModal('config')}
        onTicketMonitor={() => openModal('ticketMonitor')}
        onOpenModal={openModal}
      />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onToast={onMenuToast} />
      <AnimatePresence>
        {resultsOpen && <ResultsPanel isOpen={resultsOpen} />}
      </AnimatePresence>
      <main style={{ paddingTop: '50px' }}>{children}</main>
      <ModalManager />
    </div>
  );
}

// ModalProvider is already provided by App.tsx — do NOT nest another one here.
// LayoutInner uses useModalContext() which resolves to App.tsx's ModalProvider.
export default function Layout({ children, onMenuToast }: LayoutProps) {
  return (
    <ThemeProvider>
      <LayoutInner onMenuToast={onMenuToast}>{children}</LayoutInner>
    </ThemeProvider>
  );
}
