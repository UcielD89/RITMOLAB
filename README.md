# RITMOLAB
## Descripción

Aplicación web para analizar audio, detectar BPM (tempo), calcular offset de sincronización y reproducir un metrónomo visual y auditivo junto con la pista.

## Características

- Carga de archivos de audio por arrastre (`drag & drop`) o selección de archivo.
- Detección automática de BPM y confianza mediante análisis de audio.
- Cálculo de offset para sincronizar metrónomo con la canción.
- Reproductor integrado con controles de reproducción, volumen y velocidad.
- Metrónomo sincronizado con la canción y metrónomo independiente.
- Ajuste de compás (`time signature`) y acento en el primer tiempo.
- Tap tempo para calcular BPM manualmente.
- Guardado/restauración de audio y metadatos en IndexedDB.
- Interfaz oscura con componentes modernos de Material UI.

## Árbol de directorios

```
.
├── index.html
├── metadata.json
├── package.json
├── README.md
├── tsconfig.json
├── vite.config.ts
├── assets/
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── types.ts
│   ├── components/
│   │   ├── AudioAnalysisStatusCard.tsx
│   │   ├── AudioSuccessInfoPanel.tsx
│   │   ├── FileUploadZone.tsx
│   │   ├── GuideSection.tsx
│   │   ├── MetronomeSetupPanel.tsx
│   │   ├── Navbar.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── VisualMetronomePanel.tsx
│   │   └── WaveformCanvas.tsx
│   ├── hooks/
│   │   ├── useAudioAnalyzer.ts
│   │   ├── useAudioEngine.ts
│   │   ├── useMetronome.ts
│   │   └── useTapTempo.ts
│   └── lib/
│       ├── bpmDetector.ts
│       └── indexedDb.ts
```

## Tecnologías usadas

- `React` 19
- `Vite` para desarrollo y bundling
- `TypeScript` para tipado estático
- `MUI` (Material UI) para UI y temas
- `Tailwind CSS` y `@tailwindcss/vite` para estilos adicionales
- `Meyda` para extracción de características de audio y análisis de BPM
- `lucide-react` para iconos vectoriales
- `indexedDB` para persistencia local de audio y metadatos
- `Web Audio API` para reproducción y síntesis del metrónomo

## Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo en `http://localhost:3000`
- `npm run build` - Genera la versión de producción
- `npm run preview` - Previsualiza la versión de producción
- `npm run clean` - Elimina `dist` y `server.js`
- `npm run lint` - Ejecuta TypeScript sin emitir archivos

## Uso

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abrir el proyecto en el navegador.
4. Subir un archivo de audio y esperar a que se detecte el BPM.
5. Ajustar parámetros de metrónomo, volumen y offset.

## Componentes clave

- `App.tsx`: interfaz principal y lógica de interacción.
- `useMetronome.ts`: hook central que controla reproducción, estado del metrónomo, sincronización y análisis de audio.
- `bpmDetector.ts`: algoritmo de detección de tempo y offset basado en Meyda.
- `useAudioEngine.ts`: inicialización del contexto de audio y generación del sonido del metrónomo.
- `WaveformCanvas.tsx`: visualización de la forma de onda y estado de reproducción.
- `indexedDb.ts`: guardado y restauración de audio en IndexedDB.

## Notas

El proyecto está pensado para analizar pistas de audio y ayudar a músicos o productores a encontrar el tempo y sincronizar un metrónomo con la canción.
