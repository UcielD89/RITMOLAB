export type AnalysisStatus = 'idle' | 'loading' | 'decoding' | 'analyzing' | 'success' | 'error';

export interface AudioMetadata {
  name: string;
  size: string;
  duration: number;
}

export interface MetronomeConfig {
  bpm: number;
  timeSignature: number; // 2, 3, 4, 6
  volume: number; // 0 to 1
  isPlaying: boolean;
  accentFirstBeat: boolean;
  syncOffset: number; // in milliseconds (-500 to 500)
}

export interface AudioFilters {
  lowpass: number; // 200 to 20000 Hz
  highpass: number; // 0 to 5000 Hz
}
