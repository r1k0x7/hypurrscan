import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
      <footer className="border-t border-border py-4 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-cyan/20 flex items-center justify-center shrink-0">
              <span className="text-cyan text-[8px] font-bold">H</span>
            </div>
            <span className="text-center md:text-left text-pretty">HypurrScan — Blockchain Analytics Platform</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>Built for Hyperliquid Network</span>
            <span className="text-border hidden md:inline">|</span>
            <span>Data updates every 2s</span>
            <span className="text-border hidden md:inline">|</span>
            <span>
              Created by{' '}
              <span className="text-cyan font-semibold font-mono">r1k0x7</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
          }
