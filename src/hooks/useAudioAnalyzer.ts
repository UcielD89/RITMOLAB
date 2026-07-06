import { useState } from 'react';
import { AnalysisStatus } from '../types';

export function useAudioAnalyzer() {
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [progressText, setProgressText] = useState<string>('');
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [detectedOffset, setDetectedOffset] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [highPrecision, setHighPrecision] = useState<boolean>(false);

  return {
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
  };
}
