import React from 'react';
import { Gauge, Minus, Plus } from 'lucide-react';
import Slider from '@mui/material/Slider';

interface MetronomeSetupPanelProps {
  bpm: number;
  setBpm: React.Dispatch<React.SetStateAction<number>> | ((bpm: number) => void);
  decreaseBpm: (amt: number) => void;
  increaseBpm: (amt: number) => void;
  timeSignature: number;
  setTimeSignature: (sig: number) => void;
  accentFirstBeat: boolean;
  setAccentFirstBeat: (accent: boolean) => void;
  activeTooltip: number | null;
  setActiveTooltip: (id: number | null) => void;
}

export default function MetronomeSetupPanel({
  bpm,
  setBpm,
  decreaseBpm,
  increaseBpm,
  timeSignature,
  setTimeSignature,
  accentFirstBeat,
  setAccentFirstBeat,
  activeTooltip,
  setActiveTooltip,
}: MetronomeSetupPanelProps) {
  return (
    <div className="col-span-12 lg:col-span-8 order-3 lg:order-3 bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 lg:shadow-md shadow-none" id="metronome-setup-panel">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-amber-400" />
          Control de Tempo Manual
        </h2>
      </div>

      {/* Gran display numérico */}
      <div className="flex items-center justify-around bg-slate-950/60 p-3 sm:p-5 rounded-2xl border border-slate-800 lg:shadow-inner shadow-none gap-1 sm:gap-3">
        {/* Botón de resta gruesa */}
        <button
          onClick={() => decreaseBpm(5)}
          className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 cursor-pointer active:scale-90 transition-all font-sans font-bold text-xs flex items-center justify-center"
          title="Restar 5 BPM"
        >
          -5
        </button>

        {/* Botón de resta fina */}
        <button
          onClick={() => decreaseBpm(1)}
          className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 cursor-pointer active:scale-90 transition-all flex items-center justify-center"
          title="Restar 1 BPM"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* BPM Principal */}
        <div className="text-center min-w-[70px] sm:min-w-[100px] flex-grow px-1">
          <div className="text-4xl sm:text-5xl font-extrabold font-sans tracking-tight text-amber-400 animate-none">
            {bpm}
          </div>
          <div className="text-[8px] sm:text-[9px] uppercase font-sans tracking-wider text-slate-500 mt-0.5">
            Beats Per Minute
          </div>
        </div>

        {/* Botón de suma fina */}
        <button
          onClick={() => increaseBpm(1)}
          className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 cursor-pointer active:scale-90 transition-all flex items-center justify-center"
          title="Sumar 1 BPM"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Botón de suma gruesa */}
        <button
          onClick={() => increaseBpm(5)}
          className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 cursor-pointer active:scale-90 transition-all font-sans font-bold text-xs flex items-center justify-center"
          title="Sumar 5 BPM"
        >
          +5
        </button>
      </div>

      {/* Slider de rango con MUI Slider */}
      <div className="flex flex-col gap-1 px-1">
        <Slider
          value={bpm}
          min={40}
          max={240}
          step={1}
          onChange={(_, value) => setBpm(value as number)}
          color="primary"
          aria-label="Beats Per Minute"
        />
         <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-400 mt-1.5 px-1">
          {/* Tooltip para 40 */}
          <div 
            className="group relative cursor-help"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTooltip(activeTooltip === 40 ? null : 40);
            }}
          >
            <span className="border-b border-dashed border-slate-600 hover:border-amber-400 hover:text-amber-400 transition-colors pb-0.5">
              40
            </span>
            <span className={`absolute bottom-full left-0 mb-2.5 ${activeTooltip === 40 ? 'block' : 'hidden group-hover:block'} bg-slate-900 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-roboto font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-30`}>
              Grave / Lento (Tempo bajo para estudio pausado)
            </span>
          </div>

          {/* Tooltip para 140 */}
          <div 
            className="group relative cursor-help"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTooltip(activeTooltip === 140 ? null : 140);
            }}
          >
            <span className="border-b border-dashed border-slate-600 hover:border-amber-400 hover:text-amber-400 transition-colors pb-0.5">
              140
            </span>
            <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 ${activeTooltip === 140 ? 'block' : 'hidden group-hover:block'} bg-slate-900 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-roboto font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-30`}>
              Moderado / Medio (Tempo estándar de pop y rock)
            </span>
          </div>

          {/* Tooltip para 240 */}
          <div 
            className="group relative cursor-help"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTooltip(activeTooltip === 240 ? null : 240);
            }}
          >
            <span className="border-b border-dashed border-slate-600 hover:border-amber-400 hover:text-amber-400 transition-colors pb-0.5">
              240
            </span>
            <span className={`absolute bottom-full right-0 mb-2.5 ${activeTooltip === 240 ? 'block' : 'hidden group-hover:block'} bg-slate-900 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-roboto font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-30`}>
              Presto / Rápido (Tempo muy veloz para virtuosismo)
            </span>
          </div>
        </div>
      </div>

      {/* Selectores de Métrica e Intervalos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Métrica / Time Signature */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-sans">
            Métrica (Compás)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[2, 3, 4, 6].map((sig) => (
              <button
                key={sig}
                onClick={() => setTimeSignature(sig)}
                className={`py-1.5 px-2 text-xs font-sans font-bold rounded-lg border transition-all cursor-pointer ${
                  timeSignature === sig
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {sig}/4
              </button>
            ))}
          </div>
        </div>

        {/* Acentuar Primer Beat */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-sans">
            Acento de Compás
          </label>
          <button
            onClick={() => setAccentFirstBeat(!accentFirstBeat)}
            className={`w-full py-1.5 px-3 text-xs font-sans rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              accentFirstBeat
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${accentFirstBeat ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
            {accentFirstBeat ? 'Acentuar primer tiempo' : 'Volumen plano uniformado'}
          </button>
        </div>

      </div>
    </div>
  );
}
