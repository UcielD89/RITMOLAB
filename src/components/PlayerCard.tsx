import React from 'react';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, Sparkles } from 'lucide-react';
import Slider from '@mui/material/Slider';
import { AnalysisStatus } from '../types';

interface PlayerCardProps {
  analysisStatus: AnalysisStatus;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  seekSong: (time: number) => void;
  isPlaying: boolean;
  pauseSong: () => void;
  playSong: () => void;
  volume: number;
  changeVolume: (val: number) => void;
  toggleBoth: () => void;
  metronomePlaying: boolean;
  formatTime: (seconds: number) => string;
}

export default function PlayerCard({
  analysisStatus,
  audioBuffer,
  currentTime,
  duration,
  seekSong,
  isPlaying,
  pauseSong,
  playSong,
  volume,
  changeVolume,
  toggleBoth,
  metronomePlaying,
  formatTime,
}: PlayerCardProps) {
  if (analysisStatus !== 'success' || !audioBuffer) return null;

  return (
    <div className="bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 lg:shadow-md shadow-none flex-grow lg:h-full" id="player-main-card">
      <h2 className="text-base font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5 mb-1 font-sans">
        <Music className="w-5 h-5 text-amber-400" />
        Reproductor
      </h2>

      {/* Contenedor del Reproductor Estilo Spotify */}
      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-2.5 flex-grow justify-center">
        {/* Barra de Progreso / Timeline */}
        <div className="px-1 mt-1">
          <Slider
            value={currentTime}
            min={0}
            max={duration || 100}
            step={0.1}
            onChange={(_, value) => seekSong(value as number)}
            color="primary"
            size="small"
            aria-label="Progreso de la canción"
          />
        </div>

        {/* Tiempos de reproducción */}
        <div className="flex justify-between text-xs font-mono font-bold text-slate-400 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Fila de Botones de Control de Reproducción */}
        <div className="flex justify-center items-center gap-5 mt-1">
          {/* Anterior / Reiniciar */}
          <button
            onClick={() => seekSong(0)}
            className="p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer active:scale-90"
            title="Reiniciar canción"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Botón Play/Pause Principal Circular Blanco */}
          {isPlaying ? (
            <button
              onClick={pauseSong}
              className="w-12 h-12 bg-white text-slate-950 hover:bg-slate-100 rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-lg hover:shadow-white/10 shrink-0"
              title="Pausar"
            >
              <Pause className="w-5 h-5 fill-slate-950 stroke-slate-950" />
            </button>
          ) : (
            <button
              onClick={playSong}
              className="w-12 h-12 bg-white text-slate-950 hover:bg-slate-100 rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-lg hover:shadow-white/10 shrink-0"
              title="Reproducir"
            >
              <Play className="w-5 h-5 fill-slate-950 stroke-slate-950 ml-0.5" />
            </button>
          )}

          {/* Siguiente / Ir al final */}
          <button
            onClick={() => seekSong(duration)}
            className="p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer active:scale-90"
            title="Ir al final"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Volumen de la pista */}
      <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-slate-300 shrink-0" />
        <div className="flex-grow flex flex-col justify-center min-w-0">
          <div className="flex justify-between text-xs font-bold text-slate-300 mb-0.5 leading-none">
            <span>Volumen Canción</span>
            <span className="text-amber-400 font-extrabold font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <div className="px-0.5 mt-1">
            <Slider
              value={volume}
              min={0}
              max={1}
              step={0.05}
              onChange={(_, value) => changeVolume(value as number)}
              color="primary"
              aria-label="Volumen de la canción"
              size="small"
            />
          </div>
        </div>
      </div>

      {/* Botón de Reproducción Conjunta Sincronizada */}
      <button
        onClick={toggleBoth}
        className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide lg:shadow-md shadow-none active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ${
          isPlaying && metronomePlaying
            ? 'bg-red-500 hover:bg-red-400 text-white lg:shadow-red-500/10'
            : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 lg:shadow-amber-500/15 border border-amber-400/30'
        }`}
        id="joint-toggle-btn"
      >
        <Sparkles className="w-4 h-4" />
        {isPlaying && metronomePlaying 
          ? 'DETENER AMBOS' 
          : 'INICIAR CONJUNTO (CANCION + METRÓNOMO)'}
      </button>
    </div>
  );
}
