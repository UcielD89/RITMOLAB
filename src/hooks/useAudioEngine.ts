import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioFilters } from '../types';

export function useAudioEngine(
  volume: number,
  metronomeVolume: number,
  isLoop: boolean,
  setIsPlaying: (playing: boolean) => void,
  setCurrentBeat: (beat: number) => void
) {
  const [filters, setFilters] = useState<AudioFilters>({
    lowpass: 20000, // Totalmente abierto por defecto
    highpass: 0,   // Totalmente cerrado por defecto
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const lowpassRef = useRef<BiquadFilterNode | null>(null);
  const highpassRef = useRef<BiquadFilterNode | null>(null);
  const songGainRef = useRef<GainNode | null>(null);
  const metronomeGainRef = useRef<GainNode | null>(null);

  // --- Inicialización Segura del AudioContext ---
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const audioEl = new Audio();
    audioEl.crossOrigin = 'anonymous';
    audioElRef.current = audioEl;

    // Crear el nodo fuente del elemento de audio
    const source = ctx.createMediaElementSource(audioEl);
    sourceNodeRef.current = source;

    // Filtros de frecuencia
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = filters.lowpass;
    lowpassRef.current = lowpass;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = filters.highpass;
    highpassRef.current = highpass;

    // Ganancia de la canción
    const songGain = ctx.createGain();
    songGain.gain.value = volume;
    songGainRef.current = songGain;

    // Ganancia del metrónomo
    const metronomeGain = ctx.createGain();
    metronomeGain.gain.value = metronomeVolume;
    metronomeGainRef.current = metronomeGain;

    // Conexiones de la cadena de música
    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(songGain);
    songGain.connect(ctx.destination);

    // Conectar la ganancia del metrónomo al destino directamente
    metronomeGain.connect(ctx.destination);

    // Suscribir eventos del elemento de audio
    audioEl.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentBeat(-1);
    });
  }, [volume, metronomeVolume, filters, setIsPlaying, setCurrentBeat]);

  // Asegurar que el contexto se reactive tras la interacción del usuario
  const resumeAudioContext = useCallback(async () => {
    initAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, [initAudio]);

  // --- Ajuste de Filtros ---
  const setFilter = useCallback((type: 'lowpass' | 'highpass', value: number) => {
    setFilters(prev => {
      const updated = { ...prev, [type]: value };
      if (type === 'lowpass' && lowpassRef.current) {
        lowpassRef.current.frequency.setValueAtTime(value, audioContextRef.current?.currentTime || 0);
      } else if (type === 'highpass' && highpassRef.current) {
        highpassRef.current.frequency.setValueAtTime(value, audioContextRef.current?.currentTime || 0);
      }
      return updated;
    });
  }, []);

  // --- Ajuste de Volúmenes ---
  useEffect(() => {
    if (songGainRef.current) {
      songGainRef.current.gain.setValueAtTime(volume, audioContextRef.current?.currentTime || 0);
    }
  }, [volume]);

  useEffect(() => {
    if (metronomeGainRef.current) {
      metronomeGainRef.current.gain.setValueAtTime(metronomeVolume, audioContextRef.current?.currentTime || 0);
    }
  }, [metronomeVolume]);

  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.loop = isLoop;
    }
  }, [isLoop]);

  return {
    audioContextRef,
    sourceNodeRef,
    audioElRef,
    lowpassRef,
    highpassRef,
    songGainRef,
    metronomeGainRef,
    initAudio,
    resumeAudioContext,
    filters,
    setFilter,
  };
}
