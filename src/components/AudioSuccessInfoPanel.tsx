import React from 'react';
import { Music, Clock, Sliders, Trash2, Zap, RefreshCw, Sparkles } from 'lucide-react';
import Switch from '@mui/material/Switch';
import { AnalysisStatus, AudioMetadata } from '../types';

interface AudioSuccessInfoPanelProps {
  analysisStatus: AnalysisStatus;
  audioBuffer: AudioBuffer | null;
  metadata: AudioMetadata | null;
  unloadSong: () => void;
  highPrecision: boolean;
  setHighPrecision: (val: boolean) => void;
  reanalyzeSong: () => void;
  detectedBPM: number | null;
  detectedOffset: number | null;
  confidence: number | null;
  formatTime: (seconds: number) => string;
}

export default function AudioSuccessInfoPanel({
  analysisStatus,
  audioBuffer,
  metadata,
  unloadSong,
  highPrecision,
  setHighPrecision,
  reanalyzeSong,
  detectedBPM,
  detectedOffset,
  confidence,
  formatTime,
}: AudioSuccessInfoPanelProps) {
  if (!audioBuffer || !metadata) return null;

  return (
    <div className="col-span-12 lg:col-span-12 order-4 lg:order-4 bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 lg:shadow-md shadow-none" id="audio-success-info-panel-full">
      {/* Título de la Card por encima de la información de la canción */}
      <div className="border-b border-slate-800/40 pb-3">
        <h2 className="text-base font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5 font-sans">
          <Music className="w-4 h-4 text-amber-400" />
          Archivo de Práctica
        </h2>
      </div>

      {/* Información y controles del archivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex-1">
          <p className="text-sm font-bold text-slate-100 truncate text-left" title={metadata.name}>
            {metadata.name}
          </p>
          <div className="flex justify-start gap-4 text-xs font-sans text-slate-400 mt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              <span>Duración: <strong className="text-slate-200 font-mono">{formatTime(metadata.duration)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              <span>Tamaño: <strong className="text-slate-200 font-mono">{metadata.size}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={unloadSong}
          className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 lg:shadow-md shrink-0 h-fit"
        >
          <Trash2 className="w-4 h-4" />
          QUITAR CANCIÓN ACTUAL
        </button>
      </div>

      {/* Grid interior de 2 columnas para Alta Precisión y Detección Automática */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Switch de Alta Precisión */}
        <div className="p-3.5 sm:p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-3">
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

          {audioBuffer && (
            <button
              onClick={reanalyzeSong}
              disabled={analysisStatus === 'analyzing'}
              className="w-full mt-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-amber-400 disabled:opacity-50 text-xs font-bold font-sans tracking-wider border border-slate-800 rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 lg:shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analysisStatus === 'analyzing' ? 'animate-spin text-amber-400' : ''}`} />
              REANALIZAR CON ESTE MODO
            </button>
          )}
        </div>

        {/* Resultados de la detección automática */}
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col justify-between gap-3 lg:shadow-md">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
              Detección Automática
            </span>
            {confidence && (
              <span className="text-xs font-semibold font-sans bg-amber-500/10 px-2.5 py-0.5 rounded-lg text-amber-300 border border-amber-500/20">
                Confianza: <span className="font-mono">{Math.round(confidence * 100)}%</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-100 bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
                {detectedBPM}
              </span>
              <span className="text-sm font-bold text-slate-400 uppercase font-sans">BPM</span>
            </div>

            <div className="text-xs font-sans text-slate-300 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span>Offset inicial:</span>
                <span className="text-amber-400 font-extrabold font-mono text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">{detectedOffset} ms</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            El metrónomo se ha ajustado y sincronizado automáticamente a estos parámetros.
          </p>
        </div>
      </div>
    </div>
  );
}
