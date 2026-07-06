import Meyda from 'meyda';

/**
 * Algoritmo avanzado de detección de BPM y alineación de compás utilizando
 * la biblioteca Meyda para la extracción de características de audio.
 * Extrae de forma estática el "Spectral Flux" (Flujo Espectral) y "RMS" (Volumen)
 * para calcular una curva de fuerza de inicio (Onset Strength), detectar transitorios
 * rítmicos exactos y resolver el tempo dominante (BPM) y fase de inicio (Offset).
 */
export function detectBPM(
  audioBuffer: AudioBuffer,
  onProgress?: (progress: string) => void,
  options?: { highPrecision?: boolean }
): { bpm: number; confidence: number; offset: number } {
  const highPrecision = !!options?.highPrecision;
  onProgress?.(highPrecision ? 'Iniciando motor de alta precisión (Modo Profundo)...' : 'Iniciando extractor Meyda...');
  
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // En modo alta precisión, analizamos un rango mucho más amplio de la canción (hasta 180 segundos)
  // para evitar perder firmas rítmicas en introducciones lentas o puentes instrumentales.
  const startSec = highPrecision ? Math.min(5, duration * 0.05) : Math.min(15, duration * 0.15);
  const maxAnalysisTime = highPrecision ? 180 : 40;
  const analysisDuration = Math.min(maxAnalysisTime, duration - startSec);
  const startOffset = Math.floor(startSec * sampleRate);
  const length = Math.floor(analysisDuration * sampleRate);

  if (length <= 0) {
    return { bpm: 120, confidence: 0.1, offset: 0 };
  }

  // Parámetros de análisis espectral
  const frameSize = 2048; // Tamaño de ventana de análisis
  const hopSize = 512;    // Salto entre ventanas (75% de solapamiento para alta definición temporal)
  const totalFrames = Math.floor((length - frameSize) / hopSize);

  onProgress?.(highPrecision ? 'Extrayendo espectro completo y energía (Modo Profundo)...' : 'Extrayendo flujo espectral y energía (Meyda)...');
  
  const onsetStrength: number[] = [];
  let previousAmp = new Float32Array(frameSize / 2);

  // Configurar el tamaño del buffer en Meyda para coincidir con nuestra ventana de análisis
  Meyda.bufferSize = frameSize;

  // Extraer características frame por frame usando Meyda
  for (let i = 0; i < totalFrames; i++) {
    // Reportar progreso periódico
    if (i % (highPrecision ? 1000 : 500) === 0 && onProgress) {
      const percentage = Math.round((i / totalFrames) * 100);
      onProgress?.(`Procesando firmas espectrales: ${percentage}%`);
    }

    const frameStart = startOffset + i * hopSize;
    const currentFrame = channelData.slice(frameStart, frameStart + frameSize);

    // Asegurar que el array tenga exactamente el tamaño requerido (rellenando con ceros si es necesario)
    let paddedFrame = currentFrame;
    if (currentFrame.length < frameSize) {
      paddedFrame = new Float32Array(frameSize);
      paddedFrame.set(currentFrame);
    }

    // Extraer espectro de amplitud y volumen (RMS) usando Meyda
    const features = Meyda.extract(['amplitudeSpectrum', 'rms'], paddedFrame);
    
    const currentAmp = (features as any)?.amplitudeSpectrum || new Float32Array(frameSize / 2);
    const rms = (features as any)?.rms || 0;

    // Calcular el flujo espectral manualmente (diferencias positivas acumuladas)
    let flux = 0;
    const len = Math.min(currentAmp.length, previousAmp.length);
    for (let j = 0; j < len; j++) {
      const diff = currentAmp[j] - previousAmp[j];
      if (diff > 0) {
        flux += diff;
      }
    }

    // Ponderar el flujo con el volumen (RMS) para mitigar el ruido espectral en pasajes silenciosos
    const weightedOnset = flux * rms;
    onsetStrength.push(weightedOnset);

    previousAmp = currentAmp;
  }

  onProgress?.('Filtrando transitorios con umbral adaptativo...');
  
  // 1. Filtrado y suavizado dinámico de la señal de fuerza de inicio
  // Calcular la media y desviación estándar de la fuerza de inicio
  const meanOnset = onsetStrength.reduce((a, b) => a + b, 0) / onsetStrength.length;
  const variance = onsetStrength.reduce((sum, val) => sum + Math.pow(val - meanOnset, 2), 0) / onsetStrength.length;
  const stdDev = Math.sqrt(variance);

  // Umbral adaptativo local para alta precisión, o umbral estático global para velocidad normal
  const peakIndices: number[] = [];
  const minFrameDistance = Math.floor((0.26 * sampleRate) / hopSize); // ~260ms de separación mínima (máx tempo ~230 BPM)

  if (highPrecision) {
    // Umbral dinámico móvil local: se adapta a variaciones de volumen (crescendos/decrescendos)
    const localWindow = 25; // Ventana local para promedio móvil
    for (let i = 2; i < onsetStrength.length - 2; i++) {
      const val = onsetStrength[i];
      
      // Calcular promedio local
      let localSum = 0;
      let localCount = 0;
      const startW = Math.max(0, i - localWindow);
      const endW = Math.min(onsetStrength.length - 1, i + localWindow);
      for (let j = startW; j <= endW; j++) {
        localSum += onsetStrength[j];
        localCount++;
      }
      const localMean = localSum / localCount;
      const localThreshold = localMean + 0.6 * stdDev;

      if (
        val > localThreshold &&
        val > onsetStrength[i - 1] &&
        val > onsetStrength[i - 2] &&
        val > onsetStrength[i + 1] &&
        val > onsetStrength[i + 2]
      ) {
        if (peakIndices.length === 0 || (i - peakIndices[peakIndices.length - 1]) >= minFrameDistance) {
          peakIndices.push(i);
        }
      }
    }
  } else {
    // Umbral plano global clásico
    const peakThreshold = meanOnset + 0.8 * stdDev;
    for (let i = 2; i < onsetStrength.length - 2; i++) {
      const val = onsetStrength[i];
      if (
        val > peakThreshold &&
        val > onsetStrength[i - 1] &&
        val > onsetStrength[i - 2] &&
        val > onsetStrength[i + 1] &&
        val > onsetStrength[i + 2]
      ) {
        if (peakIndices.length === 0 || (i - peakIndices[peakIndices.length - 1]) >= minFrameDistance) {
          peakIndices.push(i);
        }
      }
    }
  }

  // Convertir los índices de los picos detectados a tiempos en segundos dentro de la canción
  const peakTimes = peakIndices.map(idx => startSec + (idx * hopSize) / sampleRate);

  onProgress?.('Analizando intervalos de tempo (BPM)...');
  
  // 2. Resolver los intervalos entre onsets (Inter-Onset Intervals - IOIs)
  const bpmHistogram: { [bpm: number]: number } = {};

  for (let i = 0; i < peakTimes.length; i++) {
    for (let j = i + 1; j < Math.min(i + 6, peakTimes.length); j++) {
      const interval = peakTimes[j] - peakTimes[i];
      const tempBpm = 60 / interval;

      // Evaluar múltiplos comunes para resolver subdivisiones rítmicas
      const candidateBpms = [tempBpm, tempBpm * 2, tempBpm / 2];

      candidateBpms.forEach(bpm => {
        if (bpm >= 60 && bpm <= 200) {
          const roundedBpm = Math.round(bpm);
          const weight = 1 / (j - i); 
          bpmHistogram[roundedBpm] = (bpmHistogram[roundedBpm] || 0) + weight;
        }
      });
    }
  }

  // 3. Si está activo el modo de ALTA PRECISIÓN, aplicamos AUTOCORRELACIÓN PROFUNDA
  // de la señal de fuerza de inicio. Esto analiza la similitud periódica de toda la curva de sonido.
  let bestBpm = 120;
  let maxWeight = 0;
  let confidence = 0.5;

  if (highPrecision) {
    onProgress?.('Computando autocorrelación rítmica... (Motor Preciso)');
    
    // De-trend (Remover componente DC y filtrar frecuencias lentas)
    const detrendedOnset = new Float32Array(onsetStrength.length);
    const maWindow = 30; // ~350ms
    for (let i = 0; i < onsetStrength.length; i++) {
      let sum = 0;
      let count = 0;
      const start = Math.max(0, i - maWindow);
      const end = Math.min(onsetStrength.length - 1, i + maWindow);
      for (let j = start; j <= end; j++) {
        sum += onsetStrength[j];
        count++;
      }
      detrendedOnset[i] = Math.max(0, onsetStrength[i] - (sum / count));
    }

    const fRate = sampleRate / hopSize;
    const bpmAutocorr: { [bpm: number]: number } = {};
    const bpmStep = 0.5; // Buscar con resolución de 0.5 BPM para máxima finura
    const candidates: number[] = [];
    for (let b = 60; b <= 200; b += bpmStep) {
      candidates.push(b);
    }

    // Calcular autocorrelación para cada candidato de BPM con sub-frame de retraso
    candidates.forEach((bpm, candIdx) => {
      if (candIdx % 40 === 0 && onProgress) {
        const pct = Math.round((candIdx / candidates.length) * 100);
        onProgress?.(`Escaneando espectro de correlación: ${pct}%`);
      }

      const lag = (60 / bpm) * fRate;
      const lagFloor = Math.floor(lag);
      const lagCeil = Math.ceil(lag);
      const alpha = lag - lagFloor;

      let r = 0;
      let energy = 0;
      const maxI = detrendedOnset.length - lagCeil - 1;

      // Sumar correlación cruzada con retraso fraccionario interpolado
      for (let i = 0; i < maxI; i += 2) { // Saltar de 2 en 2 para óptimo rendimiento sin pérdida de precisión
        const v = detrendedOnset[i];
        const vLag = (1 - alpha) * detrendedOnset[i + lagFloor] + alpha * detrendedOnset[i + lagCeil];
        r += v * vLag;
        energy += v * v;
      }

      bpmAutocorr[bpm] = energy > 0 ? r / energy : 0;
    });

    onProgress?.('Sincronizando modelos de velocidad híbridos...');

    // Suavizar la curva de autocorrelación
    const smoothedAutocorr: { [bpm: number]: number } = {};
    candidates.forEach(bpm => {
      let score = 0;
      let weightSum = 0;
      for (let offset = -1.5; offset <= 1.5; offset += 0.5) {
        const neighborBpm = bpm + offset;
        const val = bpmAutocorr[neighborBpm] || 0;
        const w = 2 - Math.abs(offset);
        score += val * w;
        weightSum += w;
      }
      smoothedAutocorr[bpm] = score / weightSum;
    });

    // Combinar Autocorrelación + Histograma de intervalos
    let bestCombinedBpm = 120;
    let maxCombinedScore = 0;

    candidates.forEach(bpm => {
      const autoScore = smoothedAutocorr[bpm] || 0;
      // Obtener el score del histograma para el entero más cercano
      const histScore = bpmHistogram[Math.round(bpm)] || 0;
      
      // El score de autocorrelación es el primario, el histograma ayuda a validar
      let combinedScore = autoScore * (1.0 + 0.6 * Math.min(2.0, histScore));

      // Sesgo menor para rangos de tempo estándar en práctica musical (90-130 BPM)
      if (bpm >= 90 && bpm <= 130) {
        combinedScore *= 1.12;
      }

      if (combinedScore > maxCombinedScore) {
        maxCombinedScore = combinedScore;
        bestCombinedBpm = bpm;
      }
    });

    bestBpm = Math.round(bestCombinedBpm); // Redondear a entero para el metrónomo

    // Calcular confianza robusta basada en la prominencia del pico
    const autocorrValues = Object.values(smoothedAutocorr);
    const avgAutocorr = autocorrValues.reduce((a, b) => a + b, 0) / autocorrValues.length;
    const maxAutocorr = smoothedAutocorr[bestBpm] || 0;
    const peakProminence = maxAutocorr > 0 ? (maxAutocorr - avgAutocorr) / maxAutocorr : 0.4;
    confidence = Math.min(0.99, Math.max(0.4, peakProminence * 1.6));

  } else {
    // MODO ESTÁNDAR (Clásico y rápido)
    onProgress?.('Suavizando histograma de velocidad...');
    
    const bpmKeys = Object.keys(bpmHistogram).map(Number);
    bpmKeys.forEach(bpm => {
      let score = 0;
      for (let offset = -1; offset <= 1; offset++) {
        score += (bpmHistogram[bpm + offset] || 0) * (2 - Math.abs(offset));
      }

      if (bpm >= 90 && bpm <= 130) {
        score *= 1.15;
      }

      if (score > maxWeight) {
        maxWeight = score;
        bestBpm = bpm;
      }
    });

    const totalWeight = Object.values(bpmHistogram).reduce((a, b) => a + b, 0);
    confidence = totalWeight > 0 ? Math.min(0.98, maxWeight / (totalWeight * 0.4)) : 0.6;
  }

  onProgress?.('Sincronizando grilla de compás y fases...');

  // 4. Calcular el desvío de fase (Offset) del primer golpe relativo al BPM elegido
  let bestOffsetMs = 0;
  if (peakTimes.length > 0) {
    const beatDuration = 60 / bestBpm;
    // En modo de alta precisión, usamos 64 celdas en lugar de 24 para aumentar la precisión temporal a nivel sub-milisegundo.
    const numBins = highPrecision ? 64 : 24;
    const phaseBins = new Array(numBins).fill(0);

    peakTimes.forEach(time => {
      const phase = (time % beatDuration) / beatDuration; // normalizado de 0.0 a 1.0
      const binIdx = Math.floor(phase * numBins) % numBins;
      phaseBins[binIdx]++;
    });

    // Suavizar las celdas circulares para evitar artefactos de borde
    const smoothedBins = new Array(numBins).fill(0);
    for (let i = 0; i < numBins; i++) {
      smoothedBins[i] = 
        phaseBins[(i - 1 + numBins) % numBins] * 0.5 + 
        phaseBins[i] * 1.0 + 
        phaseBins[(i + 1) % numBins] * 0.5;
    }

    let maxBinIdx = 0;
    let maxBinVal = 0;
    smoothedBins.forEach((val, idx) => {
      if (val > maxBinVal) {
        maxBinVal = val;
        maxBinIdx = idx;
      }
    });

    const averagePhase = (maxBinIdx + 0.5) / numBins;
    bestOffsetMs = Math.round(averagePhase * beatDuration * 1000);
  }

  onProgress?.('¡Detección profunda completada con éxito!');
  
  return {
    bpm: bestBpm,
    confidence: Math.round(confidence * 100) / 100,
    offset: bestOffsetMs
  };
}
