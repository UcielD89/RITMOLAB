import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  RefreshCw,
  Github
} from 'lucide-react';
import { useMetronome } from './hooks/useMetronome';
import WaveformCanvas from './components/WaveformCanvas';
import Navbar from './components/Navbar';
import GuideSection from './components/GuideSection';
import FileUploadZone from './components/FileUploadZone';
import PlayerCard from './components/PlayerCard';
import AudioAnalysisStatusCard from './components/AudioAnalysisStatusCard';
import VisualMetronomePanel from './components/VisualMetronomePanel';
import MetronomeSetupPanel from './components/MetronomeSetupPanel';
import AudioSuccessInfoPanel from './components/AudioSuccessInfoPanel';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import Slider from '@mui/material/Slider';

const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f59e0b', // amber-500
    },
    background: {
      default: '#020617', // slate-950
      paper: '#0f172a', // slate-900
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  components: {
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#f59e0b',
        },
        thumb: {
          width: 14,
          height: 14,
          backgroundColor: '#f59e0b',
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0px 0px 0px 6px rgba(245, 158, 11, 0.16)',
          },
          '&.Mui-active': {
            boxShadow: '0px 0px 0px 10px rgba(245, 158, 11, 0.16)',
          },
        },
        rail: {
          backgroundColor: '#1e293b', // slate-800
          opacity: 1,
        },
        track: {
          backgroundColor: '#f59e0b',
          border: 'none',
        },
        mark: {
          display: 'none !important',
        },
        markActive: {
          display: 'none !important',
        },
        markLabel: {
          display: 'none !important',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 44,
          height: 24,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
        },
        switchBase: {
          padding: 3,
          color: '#475569', // slate-600
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            color: '#020617', // slate-950
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: '#f59e0b', // amber-500
            },
          },
        },
        thumb: {
          width: 18,
          height: 18,
          boxShadow: 'none',
        },
        track: {
          borderRadius: 12,
          opacity: 1,
          backgroundColor: '#1e293b', // slate-800
          boxSizing: 'border-box',
        },
      },
    },
  },
});

export default function App() {
  const {
    bpm,
    setBpm,
    timeSignature,
    setTimeSignature,
    volume,
    changeVolume,
    metronomeVolume,
    changeMetronomeVolume,
    accentFirstBeat,
    setAccentFirstBeat,
    syncOffset,
    setSyncOffset,
    playbackRate,
    changePlaybackRate,
    nudgeOffset,

    audioBuffer,
    metadata,
    currentTime,
    duration,
    isPlaying,
    metronomePlaying,
    currentBeat,

    playSong,
    pauseSong,
    playBoth,
    unloadSong,
    toggleBoth,
    seekSong,
    toggleMetronome,
    tapTempo,
    handleFileUpload,

    analysisStatus,
    progressText,
    detectedBPM,
    detectedOffset,
    confidence,
    highPrecision,
    setHighPrecision,
    reanalyzeSong,
  } = useMetronome();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveTooltip(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // --- Manejo del Drag & Drop ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        handleFileUpload(file);
      } else {
        alert('Por favor, arrastra solo archivos de audio (MP3, WAV, etc.)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // --- Funciones Auxiliares ---
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const increaseBpm = (amount: number) => {
    setBpm(prev => Math.min(240, prev + amount));
  };

  const decreaseBpm = (amount: number) => {
    setBpm(prev => Math.max(40, prev - amount));
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center pb-8">
        
        {/* --- NAVBAR --- */}
        <Navbar 
          showInstructions={showInstructions} 
          setShowInstructions={setShowInstructions} 
        />

        {/* Contenedor Principal (Bento Dashboard) */}
        <div className="w-full max-w-5xl flex flex-col gap-4 py-4 px-4 md:px-8">
          
          {/* --- GUÍA DE INSTRUCCIONES --- */}
          <GuideSection showInstructions={showInstructions} />

          {/* --- GRID PRINCIPAL (Bento) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* --- COLUMNA IZQUIERDA (Carga y Metadatos de la Canción) --- */}
            <div className="col-span-12 lg:col-span-4 order-2 lg:order-1 lg:row-span-2 flex flex-col gap-4 lg:h-full">
              
              {/* 1. Panel de Carga de Archivos */}
              <FileUploadZone
                analysisStatus={analysisStatus}
                isDragging={isDragging}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleFileSelect={handleFileSelect}
                fileInputRef={fileInputRef}
              />

              {/* 2. Reproductor de Acompañamiento */}
              <PlayerCard
                analysisStatus={analysisStatus}
                audioBuffer={audioBuffer}
                currentTime={currentTime}
                duration={duration}
                seekSong={seekSong}
                isPlaying={isPlaying}
                pauseSong={pauseSong}
                playSong={playSong}
                volume={volume}
                changeVolume={changeVolume}
                toggleBoth={toggleBoth}
                metronomePlaying={metronomePlaying}
                formatTime={formatTime}
              />

              {/* 3. Panel de Estado del Análisis */}
              <AudioAnalysisStatusCard
                analysisStatus={analysisStatus}
                progressText={progressText}
                highPrecision={highPrecision}
                setHighPrecision={setHighPrecision}
              />

            </div>

            {/* --- COLUMNA DERECHA --- */}
            {/* 4. Panel del Metrónomo Visual (Destellos LED) */}
            <VisualMetronomePanel
              metronomePlaying={metronomePlaying}
              timeSignature={timeSignature}
              currentBeat={currentBeat}
              accentFirstBeat={accentFirstBeat}
              toggleMetronome={toggleMetronome}
              metronomeVolume={metronomeVolume}
              changeMetronomeVolume={changeMetronomeVolume}
            />

            {/* 5. Panel de Ajuste de Metrónomo */}
            <MetronomeSetupPanel
              bpm={bpm}
              setBpm={setBpm}
              decreaseBpm={decreaseBpm}
              increaseBpm={increaseBpm}
              timeSignature={timeSignature}
              setTimeSignature={setTimeSignature}
              accentFirstBeat={accentFirstBeat}
              setAccentFirstBeat={setAccentFirstBeat}
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
            />

            {/* 6. Archivo de Práctica en 12 Columnas (cuando se carga con éxito) */}
            <AudioSuccessInfoPanel
              analysisStatus={analysisStatus}
              audioBuffer={audioBuffer}
              metadata={metadata}
              unloadSong={unloadSong}
              highPrecision={highPrecision}
              setHighPrecision={setHighPrecision}
              reanalyzeSong={reanalyzeSong}
              detectedBPM={detectedBPM}
              detectedOffset={detectedOffset}
              confidence={confidence}
              formatTime={formatTime}
            />

          </div>

          {/* --- 5. PANEL DE FORMA DE ONDA E INTERFAZ DEL REPRODUCTOR --- */}
          <section className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-5 lg:shadow-lg shadow-none" id="player-and-waveform-section">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                Sincronizador & Visualizador de Onda
              </h2>
            </div>

            {/* Componente Waveform */}
            <WaveformCanvas
              audioBuffer={audioBuffer}
              currentTime={currentTime}
              duration={duration}
              bpm={bpm}
              offset={syncOffset / 1000} // Pasar en segundos
              onSeek={seekSong}
              accentColor="#f59e0b"
            />

            {/* Ajuste fino de offset para calzar transitorios */}
            {audioBuffer && (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                <div className="md:col-span-4">
                  <div className="text-xs font-semibold text-slate-200">
                    Desfase de Sincronización (Grid)
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Ajusta la grilla rítmica por milisegundos para alinear los ticks del metrónomo con la percusión visual de la onda.
                  </p>
                </div>

                {/* Slider de offset con MUI */}
                <div className="md:col-span-5 flex flex-col gap-0.5 justify-center px-1">
                  <div className="px-1">
                    <Slider
                      value={syncOffset}
                      min={-300}
                      max={300}
                      step={10}
                      onChange={(_, value) => setSyncOffset(value as number)}
                      color="primary"
                      size="small"
                      aria-label="Desfase de sincronización"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-300 mt-2 bg-slate-950/40 py-1.5 px-3 rounded-xl border border-slate-800/40">
                    {/* Tooltip para -300 ms */}
                    <div 
                      className="group relative cursor-help"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(activeTooltip === -300 ? null : -300);
                      }}
                    >
                      <span className="border-b border-dashed border-slate-600 text-slate-400 hover:text-amber-400 hover:border-amber-400 transition-colors pb-0.5 whitespace-nowrap font-bold">
                        -300 ms
                      </span>
                      <span className={`absolute bottom-full left-0 mb-2.5 ${activeTooltip === -300 ? 'block' : 'hidden group-hover:block'} bg-slate-900 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-roboto font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-30`}>
                        Atrasar (Retrasa el metrónomo)
                      </span>
                    </div>

                    <span className="text-amber-400 font-extrabold bg-amber-500/10 px-2.5 py-0.5 rounded-xl border border-amber-500/15 whitespace-nowrap text-sm">
                      {syncOffset >= 0 ? `+${syncOffset}` : syncOffset} ms
                    </span>

                    {/* Tooltip para +300 ms */}
                    <div 
                      className="group relative cursor-help"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(activeTooltip === 300 ? null : 300);
                      }}
                    >
                      <span className="border-b border-dashed border-slate-600 text-slate-400 hover:text-amber-400 hover:border-amber-400 transition-colors pb-0.5 whitespace-nowrap font-bold">
                        +300 ms
                      </span>
                      <span className={`absolute bottom-full right-0 mb-2.5 ${activeTooltip === 300 ? 'block' : 'hidden group-hover:block'} bg-slate-900 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-roboto font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-30`}>
                        Adelantar (Adelanta el metrónomo)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de Nudge rápido */}
                <div className="md:col-span-3 flex justify-end gap-1.5">
                  <button
                    onClick={() => nudgeOffset(-10)}
                    className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 text-[10px] font-mono border border-slate-800 rounded-lg active:scale-95 transition-all cursor-pointer"
                    title="Atrasar grilla por 10ms"
                  >
                    -10ms
                  </button>
                  <button
                    onClick={() => nudgeOffset(10)}
                    className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 text-[10px] font-mono border border-slate-800 rounded-lg active:scale-95 transition-all cursor-pointer"
                    title="Adelantar grilla por 10ms"
                  >
                    +10ms
                  </button>
                  <button
                    onClick={() => {
                      setSyncOffset(detectedOffset || 0);
                      seekSong(currentTime);
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg active:scale-95 transition-all cursor-pointer"
                    title="Restablecer desfase automático"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* CONTROLES DE LA VELOCIDAD DE PRÁCTICA */}
            {audioBuffer && (
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold sm:text-sm text-slate-300 uppercase tracking-wider block font-sans">
                    Velocidad de Reproducción (Ralentizar/Acelerar)
                  </label>
                  <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/15">
                    <span className="font-mono">{playbackRate.toFixed(2)}x</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1 bg-slate-950/40 p-4.5 rounded-2xl border border-slate-800/60">
                  <div className="px-1">
                    <Slider
                      value={playbackRate}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      onChange={(_, value) => changePlaybackRate(value as number)}
                      color="primary"
                      size="small"
                      aria-label="Velocidad de reproducción"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mt-1 px-0.5">
                    <span>0.50x (Mitad)</span>
                    <span>1.00x (Normal)</span>
                    <span>1.50x (Rápido)</span>
                  </div>

                  {/* Botones predefinidos de velocidad */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                    {[0.5, 0.75, 0.9, 1.0, 1.1, 1.25].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`py-2 px-1 text-xs sm:text-[13px] font-bold rounded-xl border transition-all cursor-pointer ${
                          playbackRate === rate
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {rate.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aviso indicando el BPM resultante en tiempo real */}
                <div className="text-xs sm:text-[13px] font-sans text-slate-400 leading-relaxed mt-2 bg-slate-950/30 p-3 rounded-xl border border-slate-800/40">
                  * Al ralentizar o acelerar la pista, el metrónomo se sincroniza automáticamente adaptando su pulso a <span className="text-amber-400 font-semibold font-mono">{Math.round(bpm * playbackRate)} BPM</span> reales.
                </div>
              </div>
            )}

          </section>

          {/* --- CREDITO DE PIE DE PAGINA (Elegante y con GitHub) --- */}
          <footer className="w-full text-center py-6 text-xs font-sans text-slate-500 border-t border-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6" id="footer-section">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-left">
              <span>RITMOLAB © {new Date().getFullYear()}</span>
            </div>
            <a
              href="https://github.com/ucielprogramador/ritmolab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors bg-slate-900/50 hover:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800/60"
            >
              <Github className="w-4 h-4" />
              <span className="font-medium text-xs">Repositorio en GitHub</span>
            </a>
          </footer>

        </div>

      </div>
    </ThemeProvider>
  );
}
