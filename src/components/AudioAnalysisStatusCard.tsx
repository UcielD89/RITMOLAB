import React from 'react';
import { Music, Zap } from 'lucide-react';
import Switch from '@mui/material/Switch';
import { AnalysisStatus } from '../types';

interface AudioAnalysisStatusCardProps {
  analysisStatus: AnalysisStatus;
  progressText: string;
  highPrecision: boolean;
  setHighPrecision: (val: boolean) => void;
}

export default function AudioAnalysisStatusCard({
  analysisStatus,
  progressText,
  highPrecision,
  setHighPrecision,
}: AudioAnalysisStatusCardProps) {
  if (analysisStatus === 'success') return null;

  return (
    <div className="bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 justify-between flex-grow" id="audio-info-panel">
      <div>
        <h2 className="text-base font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5 mb-3">
          <Music className="w-4 h-4 text-amber-400" />
          Archivo de Práctica
        </h2>

        {/* Switch de Alta Precisión */}
        <div className="p-3.5 sm:p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col gap-3 mb-1">
          <div className="flex items-center justify-between gap-3 min-w-0 w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Zap className={`w-5 h-5 shrink-0 transition-colors ${highPrecision ? 'text-amber-400 fill-amber-400/20' : 'text-slate-500'}`} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
                  Alta Precisión (Modo Profundo)
                </span>
                <span className="text-xs text-slate-400 font-sans leading-tight mt-1">
                  Para ritmos complejos, requiere más procesamiento
                </span>
              </div>
            </div>
            
            {/* Botón Switch MUI */}
            <div className="shrink-0 flex items-center justify-center">
              <Switch
                checked={highPrecision}
                onChange={(e) => setHighPrecision(e.target.checked)}
                color="primary"
                sx={{ transform: 'scale(1.15)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {analysisStatus === 'idle' && (
        <div className="flex flex-col items-center justify-center text-center py-8 text-slate-500 font-sans text-sm">
          <p className="font-semibold text-slate-400">No se ha cargado ninguna canción.</p>
          <p className="text-xs text-slate-500 mt-1">Sube una pista arriba para empezar.</p>
        </div>
      )}

      {(analysisStatus === 'loading' || analysisStatus === 'decoding' || analysisStatus === 'analyzing') && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="relative mb-5">
            <span className="absolute inset-0 rounded-full border-4 border-slate-800"></span>
            <span className="block w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></span>
          </div>
          <p className="text-sm font-sans text-amber-400 font-bold mb-1.5 animate-pulse">
            {analysisStatus === 'loading' && 'Cargando archivo...'}
            {analysisStatus === 'decoding' && 'Decodificando audio...'}
            {analysisStatus === 'analyzing' && 'Analizando ritmo...'}
          </p>
          <p className="text-xs text-slate-400 max-w-[280px] font-sans leading-relaxed">
            {progressText}
          </p>
        </div>
      )}

      {analysisStatus === 'error' && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <p className="text-sm font-sans text-red-400 font-bold mb-1">¡Error en el Archivo!</p>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {progressText}
          </p>
        </div>
      )}
    </div>
  );
}
