'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Volume2, Eye, ZoomIn, CheckCircle2, ExternalLink } from 'lucide-react';
import type { StudioConfigPage, InteractiveItem } from './types';
import { getYouTubeEmbedUrl } from '@/lib/youtube';

interface Props {
  page: StudioConfigPage;
  pageNumber: number;
  onClose: () => void;
  onToast: (msg: string) => void;
  workspacePreset?: {
    key: string;
    label: string;
    aspectRatio: number;
    pageBox: { left: number; top: number; width: number; height: number };
  };
}

export default function LivePreviewModal({
  page,
  pageNumber,
  onClose,
  onToast,
  workspacePreset,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioInstancesRef = useRef<Record<string, HTMLAudioElement>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});
  const [zoomModalSrc, setZoomModalSrc] = useState<string | null>(null);
  const [videoModalData, setVideoModalData] = useState<{ src: string; title?: string } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(3 / 4);
  const [circleSelections, setCircleSelections] = useState<Record<string, { itemId: string; isCorrect: boolean }>>({});

  const playFeedbackSound = (correct: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (correct) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  // Render canvas from page cache or offscreen
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Look for existing rendered canvas on page
    const offscreen = document.getElementById('studio-main-cv') as HTMLCanvasElement | null;
    if (offscreen && offscreen.width > 0) {
      canvas.width = offscreen.width;
      canvas.height = offscreen.height;
      setAspectRatio(offscreen.width / offscreen.height);
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(offscreen, 0, 0);
    }

    // Autoplay audios
    page.items
      .filter((it) => it.type === 'audio' && it.autoplay && it.fileUrl)
      .forEach((it) => {
        try {
          const a = new Audio(it.fileUrl);
          audioInstancesRef.current[it.id] = a;
          a.play().catch(() => {});
        } catch {}
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomModalSrc) setZoomModalSrc(null);
        else if (videoModalData) setVideoModalData(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      Object.values(audioInstancesRef.current).forEach((a) => {
        try {
          a.pause();
        } catch {}
      });
    };
  }, [page, onClose, zoomModalSrc, videoModalData]);

  const speakText = (text?: string, lang?: string, rate?: number) => {
    if (!text) {
      onToast('Aucun texte à lire configuré.');
      return;
    }
    if (!('speechSynthesis' in window)) {
      onToast('Synthèse vocale indisponible dans votre navigateur.');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'fr-FR';
    u.rate = rate || 1;
    window.speechSynthesis.speak(u);
  };

  const toggleAudio = (it: InteractiveItem) => {
    if (!it.fileUrl) {
      onToast('Aucun fichier audio configuré.');
      return;
    }
    let a = audioInstancesRef.current[it.id];
    if (!a) {
      a = new Audio(it.fileUrl);
      audioInstancesRef.current[it.id] = a;
      a.onended = () => setPlayingAudioId(null);
    }

    if (playingAudioId === it.id) {
      a.pause();
      setPlayingAudioId(null);
    } else {
      // Pause others
      Object.values(audioInstancesRef.current).forEach((aud) => aud.pause());
      a.play().catch(() => {});
      setPlayingAudioId(it.id);
    }
  };

  const handleZoom = (it: InteractiveItem) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width * it.w;
    const ch = canvas.height * it.h;
    const zoomLevel = it.level || 2.5;

    const zCanvas = document.createElement('canvas');
    zCanvas.width = cw * zoomLevel;
    zCanvas.height = ch * zoomLevel;
    const zCtx = zCanvas.getContext('2d');
    if (zCtx) {
      zCtx.drawImage(
        canvas,
        canvas.width * it.x,
        canvas.height * it.y,
        cw,
        ch,
        0,
        0,
        zCanvas.width,
        zCanvas.height
      );
      setZoomModalSrc(zCanvas.toDataURL());
    }
  };

  const handleCorrect = () => {
    let ok = 0;
    let total = 0;

    const blankInputs = document.querySelectorAll<HTMLInputElement>('input[data-blank-answer]');
    blankInputs.forEach((inp) => {
      total++;
      const ans = inp.dataset.blankAnswer || '';
      const cs = inp.dataset.blankCs === 'true';
      const userVal = inp.value.trim();
      const good = cs ? userVal === ans : userVal.toLowerCase() === ans.toLowerCase();
      if (good && ans !== '') ok++;
      inp.style.borderColor = good ? '#22c55e' : '#ef4444';
      inp.style.borderStyle = 'solid';
    });

    const checkInputs = document.querySelectorAll<HTMLInputElement>('input[data-check-correct]');
    checkInputs.forEach((chk) => {
      total++;
      const shouldBeChecked = chk.dataset.checkCorrect === 'true';
      const good = chk.checked === shouldBeChecked;
      if (good) ok++;
      chk.style.outline = `2px solid ${good ? '#22c55e' : '#ef4444'}`;
    });

    onToast(
      total > 0
        ? `Résultat : ${ok} / ${total} bonne(s) réponse(s)`
        : 'Aucun exercice configuré sur cette page.'
    );
  };

  const clipPolygon = (pts?: [number, number][]) => {
    if (!pts || pts.length < 3) return undefined;
    return `polygon(${pts.map((q) => `${q[0]}% ${q[1]}%`).join(',')})`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4"
    >
      {/* Top Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-20">
        <span className="font-semibold text-white text-base flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Aperçu en direct · Page {pageNumber}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-sm font-semibold transition active:scale-95"
        >
          <X className="w-4 h-4" />
          Fermer
        </button>
      </div>

      {/* Main Page Stage */}
      <div
        className={
          workspacePreset && workspacePreset.key !== 'fit'
            ? 'relative shadow-2xl rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-700/60 mt-10 max-h-[82vh] flex items-center justify-center transition-all'
            : 'relative shadow-2xl rounded-lg overflow-hidden bg-white mt-10 max-h-[82vh]'
        }
        style={{
          width:
            workspacePreset && workspacePreset.key !== 'fit'
              ? `min(94vw, calc(82vh * ${workspacePreset.aspectRatio}))`
              : `min(94vw, calc(82vh * ${aspectRatio}))`,
          aspectRatio:
            workspacePreset && workspacePreset.key !== 'fit'
              ? `${workspacePreset.aspectRatio}`
              : undefined,
        }}
      >
        {/* Subtle workspace grid pattern for presets */}
        {workspacePreset && workspacePreset.key !== 'fit' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        )}

        {/* Proportional PDF Page Container (preserves aspect ratio, overlays 1:1) */}
        <div
          className={
            workspacePreset && workspacePreset.key !== 'fit'
              ? 'absolute bg-white rounded-lg shadow-2xl shadow-black/80 overflow-hidden'
              : 'relative w-full h-full'
          }
          style={
            workspacePreset && workspacePreset.key !== 'fit'
              ? {
                  left: `${workspacePreset.pageBox.left}%`,
                  top: `${workspacePreset.pageBox.top}%`,
                  width: `${workspacePreset.pageBox.width}%`,
                  height: `${workspacePreset.pageBox.height}%`,
                }
              : undefined
          }
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full object-contain bg-white select-none pointer-events-none"
          />

          {/* Live Interactivity Overlay */}
          <div className="absolute inset-0">
            {page.items.map((it) => {
              const col = it.color || '#6366f1';
              const left = `${it.x * 100}%`;
              const top = `${it.y * 100}%`;
              const width = `${it.w * 100}%`;
              const height = `${it.h * 100}%`;

            if (it.type === 'highlight') {
              return (
                <div
                  key={it.id}
                  title={it.note || ''}
                  className="absolute cursor-help transition-opacity hover:opacity-90"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: `${col}77`,
                    mixBlendMode: 'multiply',
                  }}
                />
              );
            }

            if (it.type === 'lasso') {
              return (
                <div
                  key={it.id}
                  onClick={() => it.read && speakText(it.text, it.lang, 1)}
                  className={[
                    'absolute transition-opacity',
                    it.read ? 'cursor-pointer hover:opacity-80' : '',
                  ].join(' ')}
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: `${col}66`,
                    clipPath: clipPolygon(it.pts),
                  }}
                  title={it.read ? 'Cliquer pour écouter' : ''}
                />
              );
            }

            if (it.type === 'tts') {
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => speakText(it.text, it.lang, it.rate)}
                  title="Écouter le texte"
                  className="absolute flex items-center justify-center rounded-lg border text-sm transition-all hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: `${col}33`,
                    borderColor: col,
                    color: '#ffffff',
                  }}
                >
                  <Volume2 className="w-4 h-4 text-sky-400 drop-shadow" />
                </button>
              );
            }

            if (it.type === 'audio') {
              const isPlaying = playingAudioId === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggleAudio(it)}
                  title={it.label || 'Lecture audio'}
                  className="absolute flex items-center justify-center rounded-lg border text-sm transition-all hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: `${col}33`,
                    borderColor: col,
                    color: '#ffffff',
                  }}
                >
                  <Play
                    className={[
                      'w-4 h-4 text-pink-400 transition-transform',
                      isPlaying ? 'animate-pulse' : '',
                    ].join(' ')}
                  />
                </button>
              );
            }

            if (it.type === 'video') {
              const videoSrc = it.youtubeUrl || it.url || it.fileUrl;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    if (!videoSrc) {
                      onToast('Aucune vidéo configurée. Renseignez un lien YouTube dans le panneau de droite.');
                    } else {
                      setVideoModalData({ src: videoSrc, title: it.title });
                    }
                  }}
                  title={it.title || 'Regarder la vidéo sur YouTube'}
                  aria-label={it.title || 'Regarder la vidéo sur YouTube'}
                  className="absolute flex items-center justify-center p-0 bg-transparent border-0 rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer z-20 group"
                  style={{
                    left,
                    top,
                    width,
                    height,
                  }}
                >
                  <svg viewBox="0 0 68 48" className="w-full h-full max-w-[54px] max-h-[38px] drop-shadow-md">
                    <path d="M66.52 7.74c-.78-2.93-3.09-5.24-6.02-6.02C55.22 0 34 0 34 0S12.78 0 7.5 1.72c-2.93.78-5.24 3.09-6.02 6.02C0 13.02 0 24 0 24s0 10.98 1.48 16.26c.78 2.93 3.09 5.24 6.02 6.02C12.78 48 34 48 34 48s21.22 0 26.5-1.72c2.93-.78 5.24-3.09 6.02-6.02C68 34.98 68 24 68 24s0-10.98-1.48-16.26z" fill="#FF0000" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6"/>
                    <path d="M45 24 27 14v20z" fill="#FFFFFF"/>
                  </svg>
                </button>
              );
            }

            if (it.type === 'zoom') {
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleZoom(it)}
                  title={it.title || 'Zoom HD'}
                  className="absolute flex items-center justify-center rounded-lg border text-sm transition-all hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: `${col}33`,
                    borderColor: col,
                    color: '#ffffff',
                  }}
                >
                  <ZoomIn className="w-4 h-4 text-emerald-400 drop-shadow" />
                </button>
              );
            }

            if (it.type === 'blank') {
              return (
                <div
                  key={it.id}
                  className="absolute flex items-center"
                  style={{ left, top, width, height }}
                >
                  <input
                    type="text"
                    data-blank-answer={it.answer || ''}
                    data-blank-cs={it.cs ? 'true' : 'false'}
                    placeholder={it.hint || '…'}
                    className="w-full h-full text-xs font-semibold px-1 rounded border-2 border-dashed bg-amber-50 text-slate-900 border-amber-400 focus:outline-none transition-colors"
                  />
                </div>
              );
            }

            if (it.type === 'reveal') {
              const isOpen = !!revealedItems[it.id];
              return (
                <div
                  key={it.id}
                  onClick={() =>
                    setRevealedItems((prev) => ({ ...prev, [it.id]: !prev[it.id] }))
                  }
                  className="absolute cursor-pointer rounded flex items-center justify-center text-xs font-bold transition-all select-none p-1 shadow-sm"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: isOpen ? '#ffffff' : col,
                    color: isOpen ? '#0f172a' : '#ffffff',
                    border: isOpen ? `2px solid ${col}` : 'none',
                  }}
                >
                  {isOpen ? it.content || '(vide)' : '?'}
                </div>
              );
            }

            if (it.type === 'check') {
              return (
                <div
                  key={it.id}
                  className="absolute flex items-center"
                  style={{ left, top, width, height }}
                >
                  <input
                    type="checkbox"
                    data-check-correct={it.correct ? 'true' : 'false'}
                    className="w-full h-full accent-teal-500 cursor-pointer rounded"
                  />
                  {it.label && (
                    <span className="absolute left-[115%] whitespace-nowrap text-xs font-medium text-slate-800 drop-shadow-sm pointer-events-none">
                      {it.label}
                    </span>
                  )}
                </div>
              );
            }

            if (it.type === 'button') {
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={handleCorrect}
                  className="absolute rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center transition active:scale-95"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: col,
                  }}
                >
                  {it.label || 'Corriger'}
                </button>
              );
            }

            if (it.type === 'drag-drop') {
              const tx = `${(it.targetX ?? it.x + 0.15) * 100}%`;
              const ty = `${(it.targetY ?? it.y) * 100}%`;
              const tw = `${(it.targetW ?? it.w) * 100}%`;
              const th = `${(it.targetH ?? it.h) * 100}%`;

              return (
                <React.Fragment key={it.id}>
                  {/* Mask at source position covering original artwork */}
                  <div
                    className="absolute rounded"
                    style={{
                      left,
                      top,
                      width,
                      height,
                      backgroundColor: it.maskColor || '#ffffff',
                      zIndex: 5,
                    }}
                  />
                  {/* Target Drop Zone */}
                  <div
                    className="absolute rounded-lg border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-600 shadow-sm"
                    style={{
                      left: tx,
                      top: ty,
                      width: tw,
                      height: th,
                      zIndex: 6,
                    }}
                  >
                    <span>Cible</span>
                  </div>
                  {/* Draggable preview item */}
                  <div
                    className="absolute rounded-lg border-2 border-pink-500 bg-white shadow-md flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                    style={{
                      left,
                      top,
                      width,
                      height,
                      zIndex: 10,
                    }}
                    title="Élément déplaçable (Glisser-déposer interactif)"
                  >
                    {it.artworkUrl ? (
                      <img
                        src={it.artworkUrl}
                        alt="Draggable"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-pink-600 px-1 truncate">
                        {it.label || 'Mobile'}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              );
            }

            if (it.type === 'circle-exercise') {
              const qId = it.questionId || it.groupId || 'q1';
              const selection = circleSelections[qId];
              const isSelected = selection?.itemId === it.id;
              const isCorrect = it.isCorrect !== false;

              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      // Deselect if clicked again
                      setCircleSelections((prev) => {
                        const copy = { ...prev };
                        delete copy[qId];
                        return copy;
                      });
                      return;
                    }
                    setCircleSelections((prev) => ({
                      ...prev,
                      [qId]: { itemId: it.id, isCorrect },
                    }));
                    playFeedbackSound(isCorrect);
                    if (isCorrect) {
                      onToast('Bonne réponse ! 🎯');
                    } else {
                      onToast('Ce n\'est pas la bonne réponse, réessaie ! ❌');
                    }
                  }}
                  className={`absolute rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? isCorrect
                        ? 'border-[3.5px] border-emerald-500 bg-emerald-500/15 shadow-[0_0_12px_rgba(34,197,94,0.45)]'
                        : 'border-[3.5px] border-rose-500 bg-rose-500/15 shadow-[0_0_12px_rgba(239,68,68,0.45)]'
                      : 'border-0 bg-transparent hover:bg-sky-400/10 hover:ring-2 hover:ring-sky-400/40'
                  }`}
                  style={{
                    left,
                    top,
                    width,
                    height,
                    zIndex: isSelected ? 12 : 7,
                  }}
                  aria-label="Option à entourer"
                />
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>

      {/* Submodal for Zoom Image */}
      {zoomModalSrc && (
        <div
          onClick={() => setZoomModalSrc(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomModalSrc}
            alt="Zoom HD"
            className="max-w-[90vw] max-height-[85vh] rounded-2xl shadow-2xl border border-white/20"
          />
        </div>
      )}

      {/* Submodal for Video Playback (Supports YouTube & Direct Video) */}
      {videoModalData && (
        <div
          onClick={() => setVideoModalData(null)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            className="relative max-w-4xl w-full rounded-2xl bg-slate-900 border border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-900/95 border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <svg viewBox="0 0 68 48" className="w-5 h-3.5 flex-shrink-0">
                  <path d="M66.52 7.74c-.78-2.93-3.09-5.24-6.02-6.02C55.22 0 34 0 34 0S12.78 0 7.5 1.72c-2.93.78-5.24 3.09-6.02 6.02C0 13.02 0 24 0 24s0 10.98 1.48 16.26c.78 2.93 3.09 5.24 6.02 6.02C12.78 48 34 48 34 48s21.22 0 26.5-1.72c2.93-.78 5.24-3.09 6.02-6.02C68 34.98 68 24 68 24s0-10.98-1.48-16.26z" fill="#FF0000"/>
                  <path d="M45 24 27 14v20z" fill="#FFFFFF"/>
                </svg>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                  {videoModalData.title || 'Vidéo YouTube'}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {videoModalData.src.startsWith('http') && (
                  <a
                    href={videoModalData.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-sky-400 bg-sky-950/40 border border-sky-800/40 hover:bg-sky-900/50 transition-colors"
                    title="Ouvrir le lien externe"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setVideoModalData(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fermer (Échap)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Body */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {getYouTubeEmbedUrl(videoModalData.src) ? (
                <iframe
                  src={getYouTubeEmbedUrl(videoModalData.src)!}
                  title={videoModalData.title || 'Lecteur Vidéo YouTube'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoModalData.src}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
