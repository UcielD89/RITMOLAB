import React from 'react';
import { Upload } from 'lucide-react';
import { AnalysisStatus } from '../types';

interface FileUploadZoneProps {
  analysisStatus: AnalysisStatus;
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function FileUploadZone({
  analysisStatus,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect,
  fileInputRef
}: FileUploadZoneProps) {
  if (analysisStatus !== 'idle') return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all min-h-[180px] lg:shadow-md shadow-none ${
        isDragging
          ? 'border-amber-400 bg-amber-500/10 text-amber-300 scale-[1.01]'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/40 text-slate-300'
      }`}
      id="file-upload-zone"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="p-4 rounded-full bg-slate-950/60 text-amber-400 mb-4 border border-slate-800/80 lg:shadow-md shadow-none">
        <Upload className="w-7 h-7" />
      </div>

      <h2 className="text-sm font-semibold mb-1 text-slate-200">
        Arrastra tu canción aquí
      </h2>
      <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed">
        Soporta archivos MP3, WAV, FLAC, AAC o M4A. O haz clic para examinar.
      </p>

      {/* Animación decorativa de ondas si está arrastrando */}
      {isDragging && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 opacity-60">
          <span className="w-1.5 h-6 bg-amber-500 rounded animate-pulse"></span>
          <span className="w-1.5 h-10 bg-amber-400 rounded animate-pulse delay-75"></span>
          <span className="w-1.5 h-8 bg-amber-500 rounded animate-pulse delay-150"></span>
          <span className="w-1.5 h-12 bg-amber-400 rounded animate-pulse delay-100"></span>
        </div>
      )}
    </div>
  );
}
