import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import SideMenu from './SideMenu';
import ResultsPanel from './ResultsPanel';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);

  return (
    <div className="min-h-[100dvh]">
      <Navbar
        onMenuToggle={() => setMenuOpen(true)}
        onResultsToggle={() => setResultsOpen(!resultsOpen)}
        resultsOpen={resultsOpen}
      />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <AnimatePresence>
        {resultsOpen && <ResultsPanel isOpen={resultsOpen} />}
      </AnimatePresence>
      <main style={{ paddingTop: '50px' }}>{children}</main>
    </div>
  );
}
