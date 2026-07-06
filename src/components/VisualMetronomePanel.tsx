import React from 'react';
import { Clock, Radio, Volume2, VolumeX } from 'lucide-react';
import Slider from '@mui/material/Slider';

interface VisualMetronomePanelProps {
  metronomePlaying: boolean;
  timeSignature: number;
  currentBeat: number;
  accentFirstBeat: boolean;
  toggleMetronome: () => void;
  metronomeVolume: number;
  changeMetronomeVolume: (val: number) => void;
}

export default function VisualMetronomePanel({
  metronomePlaying,
  timeSignature,
  currentBeat,
  accentFirstBeat,
  toggleMetronome,
  metronomeVolume,
  changeMetronomeVolume,
}: VisualMetronomePanelProps) {
  return (
    <div className="col-span-12 lg:col-span-8 order-1 lg:order-2 bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 lg:shadow-md shadow-none" id="visual-flash-panel">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-400" />
          Metrónomo
        </h2>
        
        {metronomePlaying && (
          <span className="text-[9px] font-sans text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Reloj de Audio Activo
          </span>
        )}
      </div>

      {/* LEDs del Compás */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-4 px-2 bg-slate-950/60 rounded-xl border border-slate-800">
        {Array.from({ length: timeSignature }).map((_, index) => {
          const isActive = currentBeat === index;
          const isFirst = index === 0;

          return (
            <div key={index} className="flex flex-col items-center gap-1.5 min-w-[48px] sm:min-w-[64px]">
              <div
                className={`w-11 h-11 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center transition-all duration-75 ${
                  isActive
                    ? isFirst && accentFirstBeat
                      ? 'bg-red-500 border-red-400 text-white lg:shadow-lg lg:shadow-red-500/50 shadow-none scale-110 animate-beat-flash'
                      : 'bg-amber-400 border-amber-300 text-slate-950 lg:shadow-lg lg:shadow-amber-500/50 shadow-none scale-110 animate-beat-flash'
                    : 'bg-slate-900 border-slate-800/80 text-slate-400'
                }`}
              >
                <span className="text-sm sm:text-xl font-mono font-bold">
                  {index + 1}
                </span>
              </div>
              <span className={`text-[9px] sm:text-[11px] font-sans font-bold uppercase tracking-wider ${
                isActive
                  ? isFirst && accentFirstBeat
                    ? 'text-red-400'
                    : 'text-amber-400'
                  : 'text-slate-500'
              }`}>
                {isFirst ? 'Fuerte' : 'Débil'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botón principal del metrónomo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Toggle Metrónomo */}
        <button
          onClick={toggleMetronome}
          className={`py-3 px-4 rounded-xl font-bold text-sm tracking-wide lg:shadow-md shadow-none active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            metronomePlaying
              ? 'bg-red-500 hover:bg-red-400 text-white lg:shadow-red-500/10'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 lg:shadow-amber-500/15'
          }`}
          id="metronome-toggle-btn"
        >
          <Radio className={`w-5 h-5 ${metronomePlaying ? 'animate-spin' : ''}`} />
          {metronomePlaying ? 'DETENER METRÓNOMO' : 'ENCENDER METRÓNOMO'}
        </button>

        {/* Volumen del Metrónomo */}
        <div className="flex items-center gap-3.5 bg-slate-950/30 px-4 py-3 rounded-xl border border-slate-800/60">
          <span className="text-slate-400 cursor-pointer shrink-0" onClick={() => changeMetronomeVolume(metronomeVolume === 0 ? 0.5 : 0)}>
            {metronomeVolume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </span>
          <div className="flex-grow flex flex-col justify-center min-w-0">
            <div className="flex justify-between text-xs sm:text-[13px] font-semibold text-slate-300 mb-1 leading-none">
              <span>Volumen Metrónomo</span>
              <span className="text-amber-400 font-extrabold font-mono">{Math.round(metronomeVolume * 100)}%</span>
            </div>
            <div className="px-0.5 mt-1">
              <Slider
                value={metronomeVolume}
                min={0}
                max={1}
                step={0.05}
                onChange={(_, value) => changeMetronomeVolume(value as number)}
                color="primary"
                aria-label="Volumen del Metrónomo"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
