import { useCallback, useRef } from 'react';

export function useTapTempo(onBpmDetected: (bpm: number) => void) {
  const tapTimesRef = useRef<number[]>([]);

  const tapTempo = useCallback(() => {
    const now = Date.now();
    const taps = tapTimesRef.current;

    // Limpiar taps si el último fue hace más de 2 segundos (nueva sesión de tapping)
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }

    taps.push(now);

    // Conservar solo los últimos 5 taps para que sea reactivo a los cambios recientes de tempo
    if (taps.length > 5) {
      taps.shift();
    }

    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);

      if (calculatedBpm >= 40 && calculatedBpm <= 245) {
        onBpmDetected(calculatedBpm);
      }
    }
  }, [onBpmDetected]);

  return { tapTempo };
}
