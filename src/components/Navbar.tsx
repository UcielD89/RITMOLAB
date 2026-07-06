import React from 'react';
import { Radio, HelpCircle } from 'lucide-react';

interface NavbarProps {
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
}

export default function Navbar({ showInstructions, setShowInstructions }: NavbarProps) {
  return (
    <nav className="w-full border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 py-3.5 px-4 md:px-8 flex justify-center shadow-md shadow-slate-950/20" id="navbar-section">
      <div className="w-full max-w-5xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1.5 bg-amber-500 rounded-lg text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </span>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent leading-none">
              RITMOLAB
            </h1>
            <p className="text-[10px] text-slate-400 truncate hidden sm:block mt-1">
              Detector de tempo automático y metrónomo inteligente para práctica instrumental
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800/60 hover:bg-slate-850 text-xs font-semibold rounded-lg text-slate-300 border border-slate-700/50 transition-all cursor-pointer shrink-0"
          id="toggle-help-btn"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>{showInstructions ? 'Ocultar Guía' : '¿Cómo usar?'}</span>
        </button>
      </div>
    </nav>
  );
}
