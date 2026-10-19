'use client';

import React from 'react';
import { useFlipbookStore } from '@/store/useFlipbookStore';
import { VideoInteraction } from '@/types/flipbook';

interface VideoButtonProps {
  interaction: VideoInteraction;
}

export const VideoButton: React.FC<VideoButtonProps> = ({ interaction }) => {
  const { openVideoModal } = useFlipbookStore();

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Évite de déclencher le feuilletage de page
    openVideoModal(interaction.youtubeUrl, interaction.title || 'Vidéo YouTube');

    // Déclencher le plein écran de façon sécurisée (sans try/catch synchrone sur Promise)
    const wrap = document.getElementById('video-modal-wrap');
    if (wrap && !document.fullscreenElement) {
      const p = wrap.requestFullscreen?.();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    }
  };

  const hasCustomTitle =
    interaction.title &&
    !/^(?:vid[ée]o\s*youtube)$/i.test(interaction.title.trim());

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
      style={{
        left: interaction.x,
        top: interaction.y,
      }}
      title={hasCustomTitle ? interaction.title : 'Regarder la vidéo sur YouTube'}
    >
      <button
        type="button"
        onClick={handleOpen}
        aria-label={hasCustomTitle ? `Regarder : ${interaction.title}` : 'Regarder la vidéo sur YouTube'}
        className="relative flex items-center justify-center p-0 bg-transparent border-0 rounded-lg cursor-pointer transition-transform duration-200 hover:scale-115 active:scale-95 filter drop-shadow-md hover:drop-shadow-[0_0_12px_rgba(255,0,0,0.7)]"
      >
        <svg
          viewBox="0 0 68 48"
          className="w-11 h-8 sm:w-12 sm:h-8.5 block pointer-events-none"
        >
          <path
            d="M66.52 7.74c-.78-2.93-3.09-5.24-6.02-6.02C55.22 0 34 0 34 0S12.78 0 7.5 1.72c-2.93.78-5.24 3.09-6.02 6.02C0 13.02 0 24 0 24s0 10.98 1.48 16.26c.78 2.93 3.09 5.24 6.02 6.02C12.78 48 34 48 34 48s21.22 0 26.5-1.72c2.93-.78 5.24-3.09 6.02-6.02C68 34.98 68 24 68 24s0-10.98-1.48-16.26z"
            fill="#FF0000"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <path d="M45 24 27 14v20z" fill="#FFFFFF" />
        </svg>
      </button>

      {/* Infobulle discrète uniquement si un titre personnalisé spécifique a été défini */}
      {hasCustomTitle && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/95 text-[11px] font-medium text-red-200 whitespace-nowrap shadow-xl border border-red-500/30 pointer-events-none z-30 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>{interaction.title}</span>
        </div>
      )}
    </div>
  );
};
