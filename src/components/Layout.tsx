import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import SideMenu from './SideMenu';
import ResultsPanel from './ResultsPanel';
import { ModalProvider, ModalManager, useModalContext } from './modals';

interface LayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: LayoutProps) {
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
      />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <AnimatePresence>
        {resultsOpen && <ResultsPanel isOpen={resultsOpen} />}
      </AnimatePresence>
      <main style={{ paddingTop: '50px' }}>{children}</main>
      <ModalManager />
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ModalProvider>
      <LayoutInner>{children}</LayoutInner>
    </ModalProvider>
  );
}
