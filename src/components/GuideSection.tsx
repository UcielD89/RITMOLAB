import React from 'react';

interface GuideSectionProps {
  showInstructions: boolean;
}

export default function GuideSection({ showInstructions }: GuideSectionProps) {
  if (!showInstructions) return null;

  return (
    <section className="bg-slate-900/80 p-5 rounded-2xl border border-amber-500/20 lg:shadow-xl shadow-none text-xs md:text-sm leading-relaxed text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-4 transition-all animate-fade-in" id="guide-section">
      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
        <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">1</span>
          Sube tu Canción
        </h3>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Arrastra tu archivo de audio (MP3, WAV, etc.) al panel de carga. Analizaremos automáticamente el audio para extraer su <strong>BPM nominal</strong> y estimar la alineación del primer pulso.
        </p>
      </div>
      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
        <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">2</span>
          Sincroniza y Ajusta
        </h3>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Usa el <strong>Ajuste de Sincronización</strong> (Nudge) para atrasar o adelantar los clics del metrónomo por milisegundos si la detección inicial tiene algún retraso con respecto al primer tiempo.
        </p>
      </div>
      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
        <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">3</span>
          Aisla y Practica
        </h3>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Ralentiza la canción (e.g. al <strong>0.75x</strong> de velocidad) para practicar secciones difíciles. Usa los <strong>filtros de frecuencia</strong> para aislar el bajo (Lowpass) o los agudos (Highpass).
        </p>
      </div>
    </section>
  );
}
