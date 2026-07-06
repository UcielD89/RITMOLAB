import { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisStatus, AudioMetadata, MetronomeConfig, AudioFilters } from '../types';
import { detectBPM } from '../lib/bpmDetector';
import { saveAudioToDB, getAudioFromDB, clearAudioFromDB } from '../lib/indexedDb';
import { useTapTempo } from './useTapTempo';
import { useAudioEngine } from './useAudioEngine';
import { useAudioAnalyzer } from './useAudioAnalyzer';

export function useMetronome() {
  // --- Estados Principales ---
  const [bpm, setBpm] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<number>(4);
  const [volume, setVolume] = useState<number>(0.8);
  const [metronomeVolume, setMetronomeVolume] = useState<number>(0.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // Del reproductor de la canción
  const [metronomePlaying, setMetronomePlaying] = useState<boolean>(false); // Tick del metrónomo
  const [accentFirstBeat, setAccentFirstBeat] = useState<boolean>(true);
  const [syncOffset, setSyncOffset] = useState<number>(0); // En milisegundos

  // --- Estados de Audio y Archivo ---
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLoop, setIsLoop] = useState<boolean>(false);

  // --- Estado Visual del Pulso ---
  const [currentBeat, setCurrentBeat] = useState<number>(-1); // -1 significa inactivo, 0-3 para 4/4

  // --- Sub-Hooks Extraídos ---
  const {
    analysisStatus,
    setAnalysisStatus,
    progressText,
    setProgressText,
    detectedBPM,
    setDetectedBPM,
    detectedOffset,
    setDetectedOffset,
    confidence,
    setConfidence,
    highPrecision,
    setHighPrecision,
  } = useAudioAnalyzer();

  const {
    audioContextRef,
    audioElRef,
    metronomeGainRef,
    initAudio,
    resumeAudioContext,
    filters,
    setFilter,
  } = useAudioEngine(volume, metronomeVolume, isLoop, setIsPlaying, setCurrentBeat);

  const { tapTempo } = useTapTempo((calculatedBpm) => {
    setBpm(calculatedBpm);
  });

  // --- Referencias del Planificador (Scheduler) ---
  const schedulerTimerRef = useRef<any>(null);
  const nextTickTimeRef = useRef<number>(0); // Para modo Metrónomo Solo
  const currentSoloBeatRef = useRef<number>(0); // Para modo Metrónomo Solo
  const lastScheduledBeatIndexRef = useRef<number>(-1); // Para modo Sincronizado

  const hasRestoredRef = useRef<boolean>(false);

  // --- Referencias Actualizadas para evitar re-crear timers ---
  const bpmRef = useRef(bpm);
  const timeSignatureRef = useRef(timeSignature);
  const syncOffsetRef = useRef(syncOffset);
  const metronomePlayingRef = useRef(metronomePlaying);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { timeSignatureRef.current = timeSignature; }, [timeSignature]);
  useEffect(() => { syncOffsetRef.current = syncOffset; }, [syncOffset]);
  useEffect(() => { metronomePlayingRef.current = metronomePlaying; }, [metronomePlaying]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // --- Restaurar desde IndexedDB/localStorage al cargar ---
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const storedMetadata = localStorage.getItem('ritmolab_metadata');
    const storedBpm = localStorage.getItem('ritmolab_detected_bpm');
    const storedOffset = localStorage.getItem('ritmolab_detected_offset');
    const storedConfidence = localStorage.getItem('ritmolab_confidence');
    const storedHighPrecision = localStorage.getItem('ritmolab_high_precision');

    if (storedMetadata) {
      hasRestoredRef.current = true;
      try {
        const meta = JSON.parse(storedMetadata) as AudioMetadata;
        setMetadata(meta);
        setDuration(meta.duration);

        if (storedBpm) {
          const parsedBpm = Number(storedBpm);
          setBpm(parsedBpm);
          setDetectedBPM(parsedBpm);
        }
        if (storedOffset) {
          const parsedOffset = Number(storedOffset);
          setSyncOffset(parsedOffset);
          setDetectedOffset(parsedOffset);
        }
        if (storedConfidence) {
          setConfidence(Number(storedConfidence));
        }
        if (storedHighPrecision) {
          setHighPrecision(storedHighPrecision === 'true');
        }

        const restoreAudio = async () => {
          setAnalysisStatus('loading');
          setProgressText('Restaurando sesión guardada...');
          try {
            initAudio();
            const ctx = audioContextRef.current;
            const audioEl = audioElRef.current;

            if (!ctx || !audioEl) {
              console.warn('Audio no inicializado para restaurar.');
              setAnalysisStatus('idle');
              setProgressText('');
              return;
            }

            // Obtener el Blob de IndexedDB
            const blob = await getAudioFromDB();
            if (!blob) {
              console.warn('No se encontró el archivo de audio en IndexedDB.');
              setAnalysisStatus('idle');
              setProgressText('');
              return;
            }

            // Convertir el Blob en ArrayBuffer para decodificar
            const arrayBuffer = await blob.arrayBuffer();
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

            setAudioBuffer(decodedBuffer);

            // Crear un Object URL temporal para el elemento de audio
            const audioUrl = URL.createObjectURL(blob);
            audioEl.src = audioUrl;
            audioEl.load();
            audioEl.playbackRate = playbackRate;

            setAnalysisStatus('success');
            setProgressText('');
          } catch (err) {
            console.error('Error al restaurar canción desde IndexedDB:', err);
            setAnalysisStatus('idle');
            setProgressText('');
          }
        };

        restoreAudio();
      } catch (e) {
        console.error('Error al restaurar desde IndexedDB:', e);
        setAnalysisStatus('idle');
      }
    }
  }, [initAudio, playbackRate, setAnalysisStatus, setProgressText, setHighPrecision, setDetectedBPM, setDetectedOffset, setConfidence]);

  // --- Generación precisa del Tick del metrónomo (Sintetizador Analógico) ---
  const playTickSound = useCallback((time: number, isDownbeat: boolean) => {
    const ctx = audioContextRef.current;
    const metronomeGain = metronomeGainRef.current;
    if (!ctx || !metronomeGain) return;

    const osc = ctx.createOscillator();
    const tickGain = ctx.createGain();

    osc.connect(tickGain);
    tickGain.connect(metronomeGain);

    // Downbeat (primer golpe) con tono de campana brillante y agudo, golpes débiles con sonido de madera
    const freq = isDownbeat && accentFirstBeat ? 1000 : 550;
    const durationSec = isDownbeat && accentFirstBeat ? 0.12 : 0.06;

    osc.frequency.setValueAtTime(freq, time);
    tickGain.gain.setValueAtTime(1.0, time);
    
    // Caída exponencial para un sonido de percusión natural, eliminando clics bruscos
    tickGain.gain.exponentialRampToValueAtTime(0.001, time + durationSec);

    osc.start(time);
    osc.stop(time + durationSec);
  }, [accentFirstBeat, audioContextRef, metronomeGainRef]);

  // --- Planificador en Tiempo Real (Scheduler) ---
  useEffect(() => {
    const lookahead = 25.0; // Milisegundos entre chequeos del planificador
    const scheduleAheadTime = 0.2; // Cuánto tiempo adelante planificar el audio (s) para evitar clics del hardware y latencia de CPU

    const scheduler = () => {
      const ctx = audioContextRef.current;
      const audioEl = audioElRef.current;
      if (!ctx || !metronomePlayingRef.current) return;

      const currentBpm = bpmRef.current;
      const currentSignature = timeSignatureRef.current;
      const offsetMs = syncOffsetRef.current;

      // --- CASO A: Metrónomo Sincronizado con la Canción ---
      if (audioEl && !audioEl.paused && audioBuffer) {
        const songTime = audioEl.currentTime;
        const rate = audioEl.playbackRate || 1.0;
        const beatDurationInSong = 60 / currentBpm; // Duración de beat en tiempo original

        // Calcular la ventana en tiempo de la canción (segundos)
        const lookaheadSongSeconds = scheduleAheadTime * rate;

        // El desplazamiento del offset (convertido a segundos)
        const offsetSec = offsetMs / 1000;

        // Auto-sincronización y curación del índice planificado:
        const currentBeatIdx = (songTime - offsetSec) / beatDurationInSong;
        const expectedBeatIdx = Math.floor(currentBeatIdx);

        if (
          lastScheduledBeatIndexRef.current === -1 ||
          lastScheduledBeatIndexRef.current > expectedBeatIdx + 1 ||
          lastScheduledBeatIndexRef.current < expectedBeatIdx - 20
        ) {
          lastScheduledBeatIndexRef.current = expectedBeatIdx;
        }

        // Algoritmo de planificación secuencial robusto:
        const maxBeatIdx = Math.floor((songTime + lookaheadSongSeconds - offsetSec) / beatDurationInSong);
        const startBeat = Math.max(0, lastScheduledBeatIndexRef.current + 1);

        for (let k = startBeat; k <= maxBeatIdx; k++) {
          const beatTimeInSong = offsetSec + k * beatDurationInSong;
          const songSecondsRemaining = beatTimeInSong - songTime;

          if (songSecondsRemaining >= 0) {
            const realSecondsRemaining = songSecondsRemaining / rate;
            const scheduledCtxTime = ctx.currentTime + realSecondsRemaining;

            const isDownbeat = (k % currentSignature) === 0;
            playTickSound(scheduledCtxTime, isDownbeat);

            // Actualizar el destello visual de manera sincronizada
            const beatNum = k % currentSignature;
            const delayMs = realSecondsRemaining * 1000;
            setTimeout(() => {
              if (metronomePlayingRef.current && isPlayingRef.current) {
                setCurrentBeat(beatNum);
              }
            }, delayMs);
          }
          lastScheduledBeatIndexRef.current = k;
        }
      } 
      // --- CASO B: Metrónomo Solo (Independiente o Canción Pausada) ---
      else {
        if (nextTickTimeRef.current < ctx.currentTime) {
          nextTickTimeRef.current = ctx.currentTime;
        }
        while (nextTickTimeRef.current < ctx.currentTime + scheduleAheadTime) {
          const time = nextTickTimeRef.current;
          const isDownbeat = currentSoloBeatRef.current === 0;

          playTickSound(time, isDownbeat);

          // Actualizar el destello visual
          const beatNum = currentSoloBeatRef.current;
          const delayMs = (time - ctx.currentTime) * 1000;
          
          setTimeout(() => {
            if (metronomePlayingRef.current && (!audioEl || audioEl.paused)) {
              setCurrentBeat(beatNum);
            }
          }, Math.max(0, delayMs));

          // Avanzar reloj
          const secondsPerBeat = 60.0 / currentBpm;
          nextTickTimeRef.current += secondsPerBeat;
          currentSoloBeatRef.current = (currentSoloBeatRef.current + 1) % currentSignature;
        }
      }
    };

    // Iniciar el interval solo si el metrónomo está activo
    if (metronomePlaying) {
      if (audioContextRef.current) {
        // Reiniciar los contadores según el estado actual
        const ctx = audioContextRef.current;
        const audioEl = audioElRef.current;

        if (audioEl && !audioEl.paused) {
          // Alinear el compás inicial al reiniciar en reproducción
          const beatDuration = 60 / bpm;
          const offsetSec = syncOffset / 1000;
          const currentBeatIdx = (audioEl.currentTime - offsetSec) / beatDuration;
          lastScheduledBeatIndexRef.current = Math.floor(currentBeatIdx);
        } else {
          // Inicializar para el modo metrónomo solo
          nextTickTimeRef.current = ctx.currentTime;
          currentSoloBeatRef.current = 0;
        }
      }
      schedulerTimerRef.current = setInterval(scheduler, lookahead);
    } else {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
      }
      setCurrentBeat(-1);
    }

    return () => {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
      }
    };
  }, [metronomePlaying, playTickSound, audioBuffer, bpm, timeSignature, syncOffset, accentFirstBeat, audioContextRef, audioElRef, setCurrentBeat]);

  // --- Animación de la barra de progreso ---
  useEffect(() => {
    let animationId: number;

    const updatePlayhead = () => {
      const audioEl = audioElRef.current;
      if (audioEl && !audioEl.paused) {
        setCurrentTime(audioEl.currentTime);
        animationId = requestAnimationFrame(updatePlayhead);
      }
    };

    if (isPlaying) {
      animationId = requestAnimationFrame(updatePlayhead);
    } else {
      const audioEl = audioElRef.current;
      if (audioEl) {
        setCurrentTime(audioEl.currentTime);
      }
    }

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, audioElRef]);

  // --- Controladores del Reproductor de Canción ---
  const playSong = useCallback(async () => {
    await resumeAudioContext();
    const audioEl = audioElRef.current;
    if (!audioEl || !audioEl.src) return;

    try {
      isPlayingRef.current = true;
      // Re-sincronizar el metrónomo para evitar saltos o ráfagas al iniciar
      if (metronomePlaying) {
        metronomePlayingRef.current = true;
        const beatDuration = 60 / bpm;
        const offsetSec = syncOffset / 1000;
        const currentBeatIdx = (audioEl.currentTime - offsetSec) / beatDuration;
        lastScheduledBeatIndexRef.current = Math.floor(currentBeatIdx);
      }

      await audioEl.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error al reproducir el audio:', err);
    }
  }, [resumeAudioContext, metronomePlaying, bpm, syncOffset, audioElRef]);

  const pauseSong = useCallback(() => {
    const audioEl = audioElRef.current;
    if (audioEl) {
      audioEl.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentBeat(-1);
    }
  }, [audioElRef, setCurrentBeat]);

  const playBoth = useCallback(async () => {
    await resumeAudioContext();
    const audioEl = audioElRef.current;
    if (!audioEl || !audioEl.src) return;

    try {
      metronomePlayingRef.current = true;
      isPlayingRef.current = true;

      // Activar primero el metrónomo y alinear su grilla al tiempo actual
      const beatDuration = 60 / bpm;
      const offsetSec = syncOffset / 1000;
      const currentBeatIdx = (audioEl.currentTime - offsetSec) / beatDuration;
      lastScheduledBeatIndexRef.current = Math.floor(currentBeatIdx);

      setMetronomePlaying(true);
      await audioEl.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error al reproducir audio y metrónomo:', err);
    }
  }, [resumeAudioContext, bpm, syncOffset, audioElRef]);

  const pauseBoth = useCallback(() => {
    const audioEl = audioElRef.current;
    if (audioEl) {
      audioEl.pause();
    }
    isPlayingRef.current = false;
    metronomePlayingRef.current = false;

    setIsPlaying(false);
    setMetronomePlaying(false);
    setCurrentBeat(-1);
  }, [audioElRef, setCurrentBeat]);

  const toggleBoth = useCallback(async () => {
    if (isPlaying || metronomePlaying) {
      pauseBoth();
    } else {
      await playBoth();
    }
  }, [isPlaying, metronomePlaying, playBoth, pauseBoth]);

  const seekSong = useCallback((time: number) => {
    const audioEl = audioElRef.current;
    if (audioEl) {
      audioEl.currentTime = time;
      setCurrentTime(time);

      // Re-sincronizar el metrónomo inmediatamente para que el primer tick caiga en su lugar
      if (metronomePlaying) {
        const beatDuration = 60 / bpm;
        const offsetSec = syncOffset / 1000;
        const currentBeatIdx = (time - offsetSec) / beatDuration;
        lastScheduledBeatIndexRef.current = Math.floor(currentBeatIdx);
      }
    }
  }, [metronomePlaying, bpm, syncOffset, audioElRef]);

  const changePlaybackRate = useCallback((rate: number) => {
    const audioEl = audioElRef.current;
    if (audioEl) {
      audioEl.playbackRate = rate;
      setPlaybackRate(rate);

      // Re-sincronizar
      if (metronomePlaying) {
        const beatDuration = 60 / bpm;
        const offsetSec = syncOffset / 1000;
        const currentBeatIdx = (audioEl.currentTime - offsetSec) / beatDuration;
        lastScheduledBeatIndexRef.current = Math.floor(currentBeatIdx);
      }
    }
  }, [metronomePlaying, bpm, syncOffset, audioElRef]);

  // Microajuste o desfase temporal del metrónomo
  const nudgeOffset = useCallback((ms: number) => {
    setSyncOffset(prev => {
      const updated = Math.max(-500, Math.min(500, prev + ms));
      // Re-sincronizar
      const audioEl = audioElRef.current;
      if (audioEl && metronomePlaying) {
        const beatDuration = 60 / bpm;
        const offsetSec = updated / 1000;
        const currentBeatIdx = (audioEl.currentTime - offsetSec) / beatDuration;
        lastScheduledBeatIndexRef.current = Math.floor(currentBeatIdx);
      }
      return updated;
    });
  }, [metronomePlaying, bpm, audioElRef]);

  // Cambiar el volumen de la canción
  const changeVolume = useCallback((val: number) => {
    setVolume(val);
  }, []);

  // Cambiar el volumen del metrónomo
  const changeMetronomeVolume = useCallback((val: number) => {
    setMetronomeVolume(val);
  }, []);

  // Toggle de reproducción del metrónomo
  const toggleMetronome = useCallback(async () => {
    await resumeAudioContext();
    setMetronomePlaying(prev => {
      const next = !prev;
      metronomePlayingRef.current = next;
      return next;
    });
  }, [resumeAudioContext]);

  // --- Subida de Archivo, Decodificación y Análisis de BPM ---
  const handleFileUpload = useCallback(async (file: File) => {
    initAudio();
    await resumeAudioContext();

    setAnalysisStatus('loading');
    setProgressText('Subiendo y leyendo archivo...');

    const meta: AudioMetadata = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      duration: 0,
    };

    try {
      const reader = new FileReader();
      const arrayBufferPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
      });
      reader.readAsArrayBuffer(file);
      const arrayBuffer = await arrayBufferPromise;

      setAnalysisStatus('decoding');
      setProgressText('Decodificando pistas de audio (esto puede tardar unos segundos)...');
      
      const ctx = audioContextRef.current;
      if (!ctx) throw new Error('AudioContext no inicializado');

      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
      
      meta.duration = decodedBuffer.duration;
      setMetadata(meta);
      setDuration(decodedBuffer.duration);

      setAnalysisStatus('analyzing');
      const analysisResult = detectBPM(decodedBuffer, (progress) => {
        setProgressText(progress);
      }, { highPrecision });

      setBpm(analysisResult.bpm);
      setSyncOffset(Math.round(analysisResult.offset));
      
      setDetectedBPM(analysisResult.bpm);
      setDetectedOffset(Math.round(analysisResult.offset));
      setConfidence(analysisResult.confidence);

      setProgressText('Preparando reproductor...');
      const audioUrl = URL.createObjectURL(file);
      const audioEl = audioElRef.current;
      if (audioEl) {
        audioEl.src = audioUrl;
        audioEl.load();
        audioEl.playbackRate = playbackRate;
      }

      setAnalysisStatus('success');
      setCurrentTime(0);
      setIsPlaying(false);

      try {
        await saveAudioToDB(file);
        localStorage.setItem('ritmolab_metadata', JSON.stringify(meta));
        localStorage.setItem('ritmolab_detected_bpm', String(analysisResult.bpm));
        localStorage.setItem('ritmolab_detected_offset', String(Math.round(analysisResult.offset)));
        localStorage.setItem('ritmolab_confidence', analysisResult.confidence !== null ? String(analysisResult.confidence) : '');
        localStorage.setItem('ritmolab_high_precision', String(highPrecision));
        console.log('Canción y metadatos guardados con éxito.');
      } catch (storageErr) {
        console.error('Error al guardar en IndexedDB/localStorage:', storageErr);
      }
    } catch (err: any) {
      console.error('Error durante la decodificación/análisis de audio:', err);
      setAnalysisStatus('error');
      setProgressText('Error al decodificar el archivo de audio. Revisa que sea un formato válido.');
    }
  }, [initAudio, resumeAudioContext, playbackRate, highPrecision, audioContextRef, audioElRef, setAnalysisStatus, setProgressText, setDetectedBPM, setDetectedOffset, setConfidence]);

  // --- Re-analizar Canción ya cargada ---
  const reanalyzeSong = useCallback(async () => {
    if (!audioBuffer) return;
    initAudio();
    await resumeAudioContext();

    setAnalysisStatus('analyzing');
    setProgressText('Iniciando re-análisis...');

    try {
      const analysisResult = detectBPM(audioBuffer, (progress) => {
        setProgressText(progress);
      }, { highPrecision });

      setBpm(analysisResult.bpm);
      setSyncOffset(Math.round(analysisResult.offset));
      
      setDetectedBPM(analysisResult.bpm);
      setDetectedOffset(Math.round(analysisResult.offset));
      setConfidence(analysisResult.confidence);

      try {
        localStorage.setItem('ritmolab_detected_bpm', String(analysisResult.bpm));
        localStorage.setItem('ritmolab_detected_offset', String(Math.round(analysisResult.offset)));
        localStorage.setItem('ritmolab_confidence', analysisResult.confidence !== null ? String(analysisResult.confidence) : '');
        localStorage.setItem('ritmolab_high_precision', String(highPrecision));
      } catch (err) {
        console.error('Error al actualizar localStorage en re-análisis:', err);
      }

      setAnalysisStatus('success');
    } catch (err) {
      console.error('Error durante el re-análisis:', err);
      setAnalysisStatus('error');
      setProgressText('Error al realizar el análisis rítmico profundo.');
    }
  }, [audioBuffer, highPrecision, initAudio, resumeAudioContext, setAnalysisStatus, setProgressText, setDetectedBPM, setDetectedOffset, setConfidence]);

  // --- Quitar / Vaciar Canción ---
  const unloadSong = useCallback(() => {
    pauseBoth();
    
    const audioEl = audioElRef.current;
    if (audioEl) {
      audioEl.pause();
      audioEl.src = '';
      try {
        audioEl.load();
      } catch (e) {
        // Ignorar posibles errores al limpiar la carga
      }
    }
    
    setAudioBuffer(null);
    setMetadata(null);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1.0);
    
    setAnalysisStatus('idle');
    setProgressText('');
    setDetectedBPM(null);
    setDetectedOffset(null);
    setConfidence(null);
    
    setSyncOffset(0);
    setCurrentBeat(-1);

    // Limpiar localStorage y IndexedDB
    localStorage.removeItem('ritmolab_audio_data');
    localStorage.removeItem('ritmolab_metadata');
    localStorage.removeItem('ritmolab_detected_bpm');
    localStorage.removeItem('ritmolab_detected_offset');
    localStorage.removeItem('ritmolab_confidence');
    localStorage.removeItem('ritmolab_high_precision');
    clearAudioFromDB().catch(err => console.error('Error al borrar de IndexedDB:', err));
  }, [pauseBoth, audioElRef, setAnalysisStatus, setProgressText, setDetectedBPM, setDetectedOffset, setConfidence, setCurrentBeat]);

  return {
    // Estado de configuración
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

    // Estado del reproductor y archivo
    audioBuffer,
    metadata,
    currentTime,
    duration,
    isPlaying,
    metronomePlaying,
    currentBeat,
    filters,
    setFilter,
    isLoop,
    setIsLoop,

    // Acciones
    playSong,
    pauseSong,
    playBoth,
    pauseBoth,
    toggleBoth,
    seekSong,
    toggleMetronome,
    tapTempo,
    handleFileUpload,
    reanalyzeSong,
    unloadSong,

    // Análisis automático
    analysisStatus,
    progressText,
    detectedBPM,
    detectedOffset,
    confidence,
    highPrecision,
    setHighPrecision,
  };
}
