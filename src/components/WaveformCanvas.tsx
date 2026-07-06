import React, { useRef, useEffect, useState } from 'react';

interface WaveformCanvasProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  bpm: number;
  offset: number;
  onSeek: (time: number) => void;
  accentColor?: string;
}

export default function WaveformCanvas({
  audioBuffer,
  currentTime,
  duration,
  bpm,
  offset,
  onSeek,
  accentColor = '#f59e0b', // Amber 500
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Extraer un conjunto simplificado de picos cuando el audioBuffer cambie
  useEffect(() => {
    if (!audioBuffer) {
      setPeaks([]);
      return;
    }

    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / 320); // 320 barras de visualización de alta resolución
    const extractedPeaks: number[] = [];

    for (let i = 0; i < 320; i++) {
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      let maxVal = 0;
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > maxVal) {
          maxVal = val;
        }
      }
      extractedPeaks.push(maxVal);
    }

    // Normalizar picos
    const maxPeak = Math.max(...extractedPeaks) || 1;
    const normalizedPeaks = extractedPeaks.map(p => p / maxPeak);
    setPeaks(normalizedPeaks);
  }, [audioBuffer]);

  // Dibujar el canvas en cada actualización relevante
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar el tamaño del canvas al contenedor real y manejar pantallas Retina de alta resolución
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Fondo con gradiente sutil para darle profundidad al visor
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.45)'); // slate-900
    bgGradient.addColorStop(1, 'rgba(15, 23, 42, 0.75)'); // slate-900 más profundo
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Línea central de guía
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)'; // slate-600 tenue
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    ctx.lineTo(width, height * 0.55);
    ctx.stroke();

    // 2. Dibujar la forma de onda (Diseño reflectante asimétrico ultra-moderno)
    const barWidth = (width / peaks.length) * 0.65;
    const gap = (width / peaks.length) * 0.35;
    const centerY = height * 0.55; // Línea de tierra desplazada ligeramente hacia abajo

    const playedProgress = currentTime / duration;

    // Crear gradiente vertical para la parte activa
    const activeGradient = ctx.createLinearGradient(0, 0, 0, height * 0.85);
    activeGradient.addColorStop(0, '#fbbf24'); // Amber 400 (Brillante arriba)
    activeGradient.addColorStop(1, '#f59e0b'); // Amber 500 (Profundo abajo)

    peaks.forEach((peak, index) => {
      const x = index * (barWidth + gap) + barWidth / 2;
      const totalBarHeight = Math.max(2, peak * (height * 0.75)); // Al menos 2px de altura
      
      // Determinar si esta barra ya fue reproducida
      const isPlayed = (index / peaks.length) <= playedProgress;

      // Parte Principal (Hacia arriba)
      const topHeight = totalBarHeight * 0.7;
      const topY = centerY - topHeight;

      // Parte Reflejada (Hacia abajo, más pequeña y con menor opacidad para simular reflejo en vidrio)
      const bottomHeight = totalBarHeight * 0.3;

      // Dibujar Onda Principal
      ctx.fillStyle = isPlayed ? activeGradient : 'rgba(148, 163, 184, 0.3)'; // slate-400 traslúcido
      ctx.beginPath();
      ctx.roundRect(x - barWidth / 2, topY, barWidth, topHeight, Math.max(1, barWidth / 2));
      ctx.fill();

      // Dibujar Onda Reflejada (Efecto cristal)
      ctx.fillStyle = isPlayed ? 'rgba(245, 158, 11, 0.22)' : 'rgba(148, 163, 184, 0.1)';
      ctx.beginPath();
      ctx.roundRect(x - barWidth / 2, centerY + 2.5, barWidth, bottomHeight, Math.max(0.5, barWidth / 2));
      ctx.fill();
    });

    // 3. Dibujar indicador de Hover (Guía de pre-visualización)
    if (hoverX !== null && hoverX >= 0 && hoverX <= width) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]); // Restaurar
    }

    // 4. Dibujar la línea de reproducción actual (Playhead)
    const playheadX = (currentTime / duration) * width;
    if (playheadX >= 0 && playheadX <= width) {
      // Sombra de brillo de aguja
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 6;

      // Línea principal
      ctx.strokeStyle = '#ef4444'; // Red-500 para la aguja
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Resetear sombras para evitar problemas de rendimiento
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Indicador circular superior
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(playheadX, 4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Indicador circular inferior
      ctx.beginPath();
      ctx.arc(playheadX, height - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [peaks, currentTime, duration, bpm, offset, accentColor, hoverX]);

  // Manejar interacciones de seek continuas (Click y Arrastre)
  const handleInteraction = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleInteraction(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(Math.max(0, Math.min(rect.width, x)));

    if (e.buttons === 1 || isDragging) {
      handleInteraction(e.clientX);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setHoverX(null);
  };

  // Soporte para dispositivos táctiles (móviles)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handleInteraction(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches[0]) {
      handleInteraction(e.touches[0].clientX);
    }
  };

  return (
    <div ref={containerRef} className="w-full relative h-32 bg-slate-900/60 rounded-xl border border-slate-700/50 p-2 overflow-hidden select-none shadow-inner group transition-all duration-300 hover:border-slate-600/80">
      {peaks.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs font-sans">
          <span>Sube una canción para ver su forma de onda</span>
        </div>
      ) : (
        <>
          {/* Rejilla de tiempo flotante (Usa Inter/JetBrains Mono) */}
          <div className="absolute bottom-2 left-3 flex justify-between w-[calc(100%-1.5rem)] text-xs font-mono font-semibold text-slate-400 pointer-events-none select-none z-10">
            <span className="bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-slate-800/60">{formatTime(currentTime)}</span>
            <span className="bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-slate-800/60">{formatTime(duration)}</span>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-ew-resize transition-opacity duration-200"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
          />

          {/* Información flotante de previsualización de tiempo */}
          {hoverX !== null && duration > 0 && canvasRef.current && (
            <div 
              className="absolute top-2 bg-slate-950/95 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded pointer-events-none shadow-xl transition-all duration-75 z-20"
              style={{ 
                left: `${Math.max(10, Math.min(canvasRef.current.getBoundingClientRect().width - 60, hoverX - 25))}px` 
              }}
            >
              {formatTime((hoverX / canvasRef.current.getBoundingClientRect().width) * duration)}
            </div>
          )}

          {/* Instrucción flotante al pasar el mouse */}
          <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-[10px] font-sans font-medium bg-slate-950/80 px-2 py-0.5 rounded text-slate-300 border border-slate-800/60 z-10">
            Arrastra para desplazar la reproducción
          </div>
        </>
      )}
    </div>
  );
}

// Función auxiliar para dar formato a los tiempos (mm:ss)
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
