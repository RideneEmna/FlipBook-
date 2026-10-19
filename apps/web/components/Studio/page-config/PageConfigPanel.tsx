'use client';

import React from 'react';
import { Sliders, Trash2, Camera, Move, Target, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { TOOL_DEFS, type StudioConfigPage, type InteractiveItem } from './types';

interface Props {
  page: StudioConfigPage;
  pageNumber: number;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<InteractiveItem>) => void;
  onDeleteItem: (id: string) => void;
  onRecropArtwork?: (id: string) => void;
  onStartSelectTarget?: (id: string) => void;
  isSettingTarget?: boolean;
}

export default function PageConfigPanel({
  page,
  pageNumber,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onRecropArtwork,
  onStartSelectTarget,
  isSettingTarget,
}: Props) {
  const selectedItem = page.items.find((i) => i.id === selectedItemId);

  const getSummary = (it: InteractiveItem) => {
    return (
      it.label ||
      it.title ||
      it.text ||
      it.answer ||
      it.content ||
      it.note ||
      it.url ||
      ''
    );
  };

  const handleFileUpload = (
    it: InteractiveItem,
    field: 'fileUrl' | 'fileName',
    files: FileList | null
  ) => {
    const file = files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateItem(it.id, {
        fileName: file.name,
        fileUrl: url,
      });
    }
  };

  return (
    <aside className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 lg:max-h-[calc(60vh+90px)] overflow-y-auto custom-scrollbar flex flex-col gap-4">
      {/* Panel Header */}
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Configuration de la page</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Page {pageNumber} · {page.items.length} élément{page.items.length > 1 ? 's' : ''}{' '}
          configuré{page.items.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Item List */}
      <div className="space-y-1.5">
        {page.items.length === 0 ? (
          <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded-xl p-4 text-center">
            Choisissez un outil dans la barre, puis dessinez directement sur la page.
          </div>
        ) : (
          page.items.map((it) => {
            const def = TOOL_DEFS[it.type];
            const isSelected = it.id === selectedItemId;
            const summary = getSummary(it);

            return (
              <div
                key={it.id}
                onClick={() => onSelectItem(it.id)}
                className={[
                  'flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer transition-all',
                  isSelected
                    ? 'bg-indigo-600/25 border-indigo-500 shadow-sm'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-600',
                ].join(' ')}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-none"
                  style={{ backgroundColor: it.color || def?.c }}
                />
                <span className="text-xs font-semibold text-slate-200">
                  {def?.n || it.type}
                </span>
                <span className="text-xs text-slate-400 truncate flex-1">
                  {summary ? summary.slice(0, 24) : ''}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(it.id);
                  }}
                  className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                  title="Supprimer cet élément"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Item Configuration Form */}
      <div className="border-t border-slate-800 pt-4 space-y-4">
        {!selectedItem ? (
          <p className="text-xs text-slate-500 italic">
            Sélectionnez un élément pour modifier ses réglages.
          </p>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-4">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    selectedItem.color || TOOL_DEFS[selectedItem.type]?.c,
                }}
              />
              <span>{TOOL_DEFS[selectedItem.type]?.n}</span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Highlight Fields */}
              {selectedItem.type === 'highlight' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Couleur du surlignage
                    </label>
                    <input
                      type="color"
                      value={selectedItem.color || '#facc15'}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { color: e.target.value })
                      }
                      className="w-full h-9 rounded-lg bg-slate-900/80 border border-slate-700/60 p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Note affichée au survol
                    </label>
                    <input
                      type="text"
                      value={selectedItem.note || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { note: e.target.value })
                      }
                      placeholder="Note ou explication..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* Lasso Fields */}
              {selectedItem.type === 'lasso' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Texte du paragraphe
                    </label>
                    <textarea
                      rows={4}
                      value={selectedItem.text || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { text: e.target.value })
                      }
                      placeholder="Texte à lire..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Couleur
                    </label>
                    <input
                      type="color"
                      value={selectedItem.color || '#a78bfa'}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { color: e.target.value })
                      }
                      className="w-full h-9 rounded-lg bg-slate-900/80 border border-slate-700/60 p-1 cursor-pointer"
                    />
                  </div>
                  <label className="flex items-center gap-2 font-semibold text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={selectedItem.read !== false}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { read: e.target.checked })
                      }
                      className="accent-indigo-500 w-4 h-4 rounded"
                    />
                    <span>Lire à voix haute au clic</span>
                  </label>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Langue de lecture
                    </label>
                    <select
                      value={selectedItem.lang || 'fr-FR'}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { lang: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="fr-FR">Français</option>
                      <option value="en-US">English</option>
                      <option value="ar-SA">العربية</option>
                    </select>
                  </div>
                </>
              )}

              {/* TTS Fields */}
              {selectedItem.type === 'tts' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Texte à lire
                    </label>
                    <textarea
                      rows={4}
                      value={selectedItem.text || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { text: e.target.value })
                      }
                      placeholder="Texte lu par la synthèse vocale..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Langue
                    </label>
                    <select
                      value={selectedItem.lang || 'fr-FR'}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { lang: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="fr-FR">Français</option>
                      <option value="en-US">English</option>
                      <option value="ar-SA">العربية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Vitesse de lecture
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.6"
                        max="1.6"
                        step="0.1"
                        value={selectedItem.rate ?? 1}
                        onChange={(e) =>
                          onUpdateItem(selectedItem.id, {
                            rate: parseFloat(e.target.value),
                          })
                        }
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="text-slate-400 w-8">
                        {selectedItem.rate ?? 1}x
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Audio Fields */}
              {selectedItem.type === 'audio' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Libellé
                    </label>
                    <input
                      type="text"
                      value={selectedItem.label || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { label: e.target.value })
                      }
                      placeholder="Piste audio 1..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Piste audio
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) =>
                        handleFileUpload(selectedItem, 'fileUrl', e.target.files)
                      }
                      className="block w-full text-xs text-slate-400 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:font-semibold"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {selectedItem.fileName || 'Aucun fichier sélectionné'}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 font-semibold text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={!!selectedItem.autoplay}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, {
                          autoplay: e.target.checked,
                        })
                      }
                      className="accent-indigo-500 w-4 h-4 rounded"
                    />
                    <span>Lecture automatique à l'ouverture de la page</span>
                  </label>
                </>
              )}

              {/* Video Fields */}
              {selectedItem.type === 'video' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Titre de la vidéo (optionnel)
                    </label>
                    <input
                      type="text"
                      value={selectedItem.title || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { title: e.target.value })
                      }
                      placeholder="Ex: Vidéo explicative..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Lien vidéo (YouTube ou .mp4)</span>
                      <span className="text-[10px] text-red-400 font-normal">YouTube supporté</span>
                    </label>
                    <input
                      type="text"
                      value={selectedItem.url || selectedItem.youtubeUrl || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, {
                          url: e.target.value,
                          youtubeUrl: e.target.value,
                        })
                      }
                      placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      ou fichier vidéo
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        handleFileUpload(selectedItem, 'fileUrl', e.target.files)
                      }
                      className="block w-full text-xs text-slate-400 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:font-semibold"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {selectedItem.fileName || 'Aucun fichier sélectionné'}
                    </p>
                  </div>
                </>
              )}

              {/* Zoom Fields */}
              {selectedItem.type === 'zoom' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Titre de la modale
                    </label>
                    <input
                      type="text"
                      value={selectedItem.title || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { title: e.target.value })
                      }
                      placeholder="Détail haute résolution..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Niveau de zoom
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1.5"
                        max="4"
                        step="0.5"
                        value={selectedItem.level ?? 2.5}
                        onChange={(e) =>
                          onUpdateItem(selectedItem.id, {
                            level: parseFloat(e.target.value),
                          })
                        }
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="text-slate-400 w-8">
                        {selectedItem.level ?? 2.5}x
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Blank Fields */}
              {selectedItem.type === 'blank' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Réponse attendue
                    </label>
                    <input
                      type="text"
                      value={selectedItem.answer || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { answer: e.target.value })
                      }
                      placeholder="Mot attendu..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Indice
                    </label>
                    <input
                      type="text"
                      value={selectedItem.hint || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { hint: e.target.value })
                      }
                      placeholder="Indice ou début du mot..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 font-semibold text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={!!selectedItem.cs}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { cs: e.target.checked })
                      }
                      className="accent-indigo-500 w-4 h-4 rounded"
                    />
                    <span>Sensible à la casse (majuscules/minuscules)</span>
                  </label>
                </>
              )}

              {/* Reveal Fields */}
              {selectedItem.type === 'reveal' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Contenu révélé au clic
                    </label>
                    <textarea
                      rows={3}
                      value={selectedItem.content || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { content: e.target.value })
                      }
                      placeholder="Texte caché sous le masque..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Couleur du masque
                    </label>
                    <input
                      type="color"
                      value={selectedItem.color || '#6366f1'}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { color: e.target.value })
                      }
                      className="w-full h-9 rounded-lg bg-slate-900/80 border border-slate-700/60 p-1 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Check Fields */}
              {selectedItem.type === 'check' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Libellé
                    </label>
                    <input
                      type="text"
                      value={selectedItem.label || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { label: e.target.value })
                      }
                      placeholder="Texte de l'option..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 font-semibold text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={selectedItem.correct !== false}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { correct: e.target.checked })
                      }
                      className="accent-indigo-500 w-4 h-4 rounded"
                    />
                    <span>Cette case doit être cochée (bonne réponse)</span>
                  </label>
                </>
              )}

              {/* Button Fields */}
              {selectedItem.type === 'button' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Libellé du bouton
                  </label>
                  <input
                    type="text"
                    value={selectedItem.label || 'Corriger'}
                    onChange={(e) =>
                      onUpdateItem(selectedItem.id, { label: e.target.value })
                    }
                    placeholder="Corriger..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Drag and Drop Fields */}
              {selectedItem.type === 'drag-drop' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Libellé de l'élément mobile
                    </label>
                    <input
                      type="text"
                      value={selectedItem.label || ''}
                      onChange={(e) =>
                        onUpdateItem(selectedItem.id, { label: e.target.value })
                      }
                      placeholder="Ex: Mot 1, Animal A..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Artwork Preview & Re-crop */}
                  <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3">
                    <label className="block font-semibold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Image découpée de l'élément</span>
                      <span className="text-[10px] text-pink-400 font-bold uppercase">Movable</span>
                    </label>
                    {selectedItem.artworkUrl ? (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg border border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                          <img
                            src={selectedItem.artworkUrl}
                            alt="Aperçu élément découpé"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <p className="text-[11px] text-slate-400">
                            Capture automatique depuis la page PDF.
                          </p>
                          {onRecropArtwork && (
                            <button
                              type="button"
                              onClick={() => onRecropArtwork(selectedItem.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition active:scale-95"
                            >
                              <Camera className="w-3.5 h-3.5 text-pink-400" />
                              <span>Recapturer l'image</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {onRecropArtwork && (
                          <button
                            type="button"
                            onClick={() => onRecropArtwork(selectedItem.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/50 text-xs text-pink-200 font-medium transition active:scale-95"
                          >
                            <Camera className="w-4 h-4 text-pink-400" />
                            <span>Capturer l'artwork depuis la page</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Original Artwork Masking */}
                  <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Masquage de l'élément d'origine</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      L'illustration d'origine sous l'élément sera couverte pour qu'elle n'apparaisse plus sous la pièce mobile.
                    </p>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Couleur du masque (couleur de fond du papier)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedItem.maskColor || '#ffffff'}
                          onChange={(e) =>
                            onUpdateItem(selectedItem.id, { maskColor: e.target.value })
                          }
                          className="w-10 h-8 rounded-lg bg-slate-900 border border-slate-700 p-0.5 cursor-pointer"
                        />
                        <div className="flex gap-1.5">
                          {[
                            ['#ffffff', 'Blanc'],
                            ['#fefae0', 'Crème'],
                            ['#f3f4f6', 'Gris clair'],
                          ].map(([c, label]) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => onUpdateItem(selectedItem.id, { maskColor: c })}
                              title={label}
                              className="px-2 py-0.5 rounded text-[11px] border border-slate-700 hover:border-slate-500 transition"
                              style={{
                                backgroundColor: c,
                                color: c === '#ffffff' || c === '#fefae0' || c === '#f3f4f6' ? '#0f172a' : '#fff',
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Destination Zone Configuration */}
                  <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                        <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Zone de destination (Cible)</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        Souris
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Définissez où l'élève doit déposer cet élément. Cliquez sur le bouton ci-dessous puis pointez ou tracez sur la page avec la souris.
                    </p>

                    <button
                      type="button"
                      onClick={() => onStartSelectTarget?.(selectedItem.id)}
                      className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium text-xs transition shadow-sm ${
                        isSettingTarget
                          ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400 shadow-emerald-500/30 animate-pulse'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-200 active:scale-95'
                      }`}
                    >
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isSettingTarget
                          ? '🎯 Cliquez sur la page pour placer la cible...'
                          : '🎯 Définir la cible à la souris sur la page'}
                      </span>
                    </button>

                    <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="text-slate-400">Position cible actuelle :</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        X: {Math.round((selectedItem.targetX ?? selectedItem.x + 0.15) * 100)}% | Y: {Math.round((selectedItem.targetY ?? selectedItem.y) * 100)}%
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      💡 Vous pouvez aussi déplacer la boîte verte &quot;Cible 🎯&quot; directement à la souris sur le canevas.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateItem(selectedItem.id, {
                          targetW: selectedItem.w,
                          targetH: selectedItem.h,
                        })
                      }
                      className="w-full py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                    >
                      Copier dimensions de la source
                    </button>
                  </div>
                </div>
              )}

              {/* Circle Exercise Fields */}
              {selectedItem.type === 'circle-exercise' && (() => {
                const currentQId = selectedItem.questionId || selectedItem.groupId || 'q1';
                const existingQIds = Array.from(
                  new Set(
                    page.items
                      .filter((it) => it.type === 'circle-exercise')
                      .map((it) => it.questionId || it.groupId || 'q1')
                  )
                );
                if (!existingQIds.includes(currentQId)) {
                  existingQIds.push(currentQId);
                }

                const handleQuestionChange = (newQId: string) => {
                  const sibling = page.items.find(
                    (it) => it.type === 'circle-exercise' && (it.questionId || it.groupId || 'q1') === newQId
                  );
                  onUpdateItem(selectedItem.id, {
                    questionId: newQId,
                    groupId: newQId,
                    questionTitle: sibling?.questionTitle || `Question ${newQId.replace(/^q/i, '') || '1'}`,
                    circleMode: sibling?.circleMode || selectedItem.circleMode || 'single',
                    tolerance: sibling?.tolerance ?? selectedItem.tolerance ?? 0.5,
                    requireAll: sibling?.requireAll !== undefined ? sibling.requireAll : true,
                    strictSelection: sibling?.strictSelection !== undefined ? sibling.strictSelection : true,
                  });
                };

                const syncQuestionField = (updates: Partial<InteractiveItem>) => {
                  page.items.forEach((it) => {
                    if (
                      it.type === 'circle-exercise' &&
                      (it.questionId || it.groupId || 'q1') === currentQId
                    ) {
                      onUpdateItem(it.id, updates);
                    }
                  });
                };

                return (
                  <div className="space-y-4">
                    {/* Question Grouping */}
                    <div className="rounded-xl border border-indigo-500/30 bg-slate-950/60 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Question associée sur la page</span>
                        </label>
                        <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/70 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                          {currentQId.toUpperCase()}
                        </span>
                      </div>

                      {/* Question Quick Switchers */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {existingQIds.map((qid) => (
                          <button
                            key={qid}
                            type="button"
                            onClick={() => handleQuestionChange(qid)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              qid === currentQId
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-700/60 hover:border-slate-500'
                            }`}
                          >
                            {qid.toUpperCase()}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            let nextNum = 1;
                            while (existingQIds.includes(`q${nextNum}`)) {
                              nextNum++;
                            }
                            handleQuestionChange(`q${nextNum}`);
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1"
                          title="Créer une nouvelle question indépendante sur cette page"
                        >
                          <span>+ Nouvelle question</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Identifiant question
                          </label>
                          <input
                            type="text"
                            value={selectedItem.questionId || selectedItem.groupId || 'q1'}
                            onChange={(e) => {
                              const val = e.target.value.trim().toLowerCase() || 'q1';
                              handleQuestionChange(val);
                            }}
                            placeholder="Ex: q1"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Titre affiché
                          </label>
                          <input
                            type="text"
                            value={selectedItem.questionTitle || `Question ${currentQId.replace(/^q/i, '') || '1'}`}
                            onChange={(e) => {
                              const val = e.target.value;
                              syncQuestionField({ questionTitle: val });
                            }}
                            placeholder="Ex: Question 1"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Target Role (Answer Key) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-semibold text-slate-300 text-xs">
                          Rôle de cette zone (Corrigé enseignant)
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Enforce only ONE correct option per question
                            page.items.forEach((it) => {
                              if (
                                it.type === 'circle-exercise' &&
                                (it.questionId || it.groupId || 'q1') === currentQId
                              ) {
                                onUpdateItem(it.id, {
                                  isCorrect: it.id === selectedItem.id,
                                  circleMode: 'single',
                                });
                              }
                            });
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-start gap-2 ${
                            selectedItem.isCorrect !== false
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-bold text-slate-100">Bonne réponse</span>
                            <span className="text-[10.5px] text-slate-400">Seule zone correcte</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItem(selectedItem.id, {
                              isCorrect: false,
                              circleMode: 'single',
                            })
                          }
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-start gap-2 ${
                            selectedItem.isCorrect === false
                              ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm shadow-amber-500/20'
                              : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-bold text-slate-100">Fausse réponse</span>
                            <span className="text-[10.5px] text-slate-400">Option incorrecte</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Option Sizing & Normalization */}
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Dimensions de la zone ({Math.round((selectedItem.w || 0.1) * 100)}% × {Math.round((selectedItem.h || 0.08) * 100)}%)</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">
                            Largeur : {Math.round((selectedItem.w || 0.1) * 100)}%
                          </span>
                          <input
                            type="range"
                            min="3"
                            max="60"
                            step="0.5"
                            value={Math.round((selectedItem.w || 0.1) * 100)}
                            onChange={(e) => {
                              const newW = parseFloat(e.target.value) / 100;
                              const currentW = selectedItem.w || 0.1;
                              const cx = selectedItem.x + currentW / 2;
                              const newX = Math.max(0, Math.min(1 - newW, cx - newW / 2));
                              onUpdateItem(selectedItem.id, { w: newW, x: newX });
                            }}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">
                            Hauteur : {Math.round((selectedItem.h || 0.08) * 100)}%
                          </span>
                          <input
                            type="range"
                            min="2"
                            max="40"
                            step="0.5"
                            value={Math.round((selectedItem.h || 0.08) * 100)}
                            onChange={(e) => {
                              const newH = parseFloat(e.target.value) / 100;
                              const currentH = selectedItem.h || 0.08;
                              const cy = selectedItem.y + currentH / 2;
                              const newY = Math.max(0, Math.min(1 - newH, cy - newH / 2));
                              onUpdateItem(selectedItem.id, { h: newH, y: newY });
                            }}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Equalize dimensions across all options in this question */}
                      {page.items.filter(
                        (it) => it.type === 'circle-exercise' && (it.questionId || it.groupId || 'q1') === currentQId
                      ).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetW = selectedItem.w || 0.1;
                            const targetH = selectedItem.h || 0.08;
                            page.items.forEach((opt) => {
                              if (
                                opt.type === 'circle-exercise' &&
                                (opt.questionId || opt.groupId || 'q1') === currentQId
                              ) {
                                const currentW = opt.w || 0.1;
                                const currentH = opt.h || 0.08;
                                const cx = opt.x + currentW / 2;
                                const cy = opt.y + currentH / 2;
                                const newX = Math.max(0, Math.min(1 - targetW, cx - targetW / 2));
                                const newY = Math.max(0, Math.min(1 - targetH, cy - targetH / 2));
                                onUpdateItem(opt.id, { w: targetW, h: targetH, x: newX, y: newY });
                              }
                            });
                          }}
                          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 transition flex items-center justify-center gap-1.5"
                          title="Uniformiser les dimensions de toutes les options de cette question"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>
                            Harmoniser la taille des {
                              page.items.filter(
                                (it) => it.type === 'circle-exercise' && (it.questionId || it.groupId || 'q1') === currentQId
                              ).length
                            } options
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Information Banner */}
                    <div className="rounded-xl bg-slate-900/70 border border-slate-700/60 p-3 flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white block">Choix unique · Évaluation immédiate</span>
                        <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                          Dans le flipbook, l&apos;élève clique directement sur l&apos;option de son choix. Le cercle se trace automatiquement et l&apos;évaluation s&apos;affiche à l&apos;instant.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Libellé de cette zone
                      </label>
                      <input
                        type="text"
                        value={selectedItem.label || ''}
                        onChange={(e) =>
                          onUpdateItem(selectedItem.id, { label: e.target.value })
                        }
                        placeholder="Ex: Réponse A, Mot correct..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                      />
                    </div>

                    {/* Multiple-answer selection rules */}
                    {selectedItem.circleMode === 'multiple' && (
                      <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 space-y-3">
                        <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Règles de sélection (Mode multiple)</span>
                        </div>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedItem.requireAll !== false}
                            onChange={(e) =>
                              syncQuestionField({ requireAll: e.target.checked })
                            }
                            className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                          />
                          <div>
                            <span className="font-semibold text-slate-200">Exiger toutes les cibles correctes</span>
                            <p className="text-[11px] text-slate-400">
                              Toutes les zones correctes de la question doivent être entourées.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedItem.strictSelection !== false}
                            onChange={(e) =>
                              syncQuestionField({ strictSelection: e.target.checked })
                            }
                            className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                          />
                          <div>
                            <span className="font-semibold text-slate-200">Sélection stricte sans erreur</span>
                            <p className="text-[11px] text-slate-400">
                              Entourer une fausse réponse invalide toute la réponse.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Overlap Tolerance Configuration */}
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 space-y-2">
                      <div className="flex items-center justify-between text-slate-300 font-semibold text-xs sm:text-sm">
                        <span>Tolérance de reconnaissance</span>
                        <span className="text-emerald-400 font-bold">
                          {Math.round((selectedItem.tolerance ?? 0.5) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="90"
                        step="5"
                        value={Math.round((selectedItem.tolerance ?? 0.5) * 100)}
                        onChange={(e) =>
                          syncQuestionField({
                            tolerance: parseInt(e.target.value, 10) / 100,
                          })
                        }
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Seuil géométrique appliqué uniformément à tous les cercles de cette question.
                      </p>
                    </div>

                    {/* Behavior Explanation Callout */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5 text-[11px]">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {(selectedItem.circleMode || 'single') === 'single'
                            ? 'Choix unique : Évaluation immédiate'
                            : 'Choix multiple : Validation globale'}
                        </span>
                      </div>
                      <ul className="text-slate-300 space-y-1 list-disc list-inside">
                        <li>Les zones cibles et le corrigé restent <b>strictement invisibles</b> pour les élèves.</li>
                        {(selectedItem.circleMode || 'single') === 'single' ? (
                          <>
                            <li>Chaque cercle est évalué <b>immédiatement dès la fin du tracé</b>.</li>
                            <li>Le cercle passe au <b>vert</b> si correct, ou au <b>rouge</b> si incorrect.</li>
                            <li>L'élève peut gommer ou tracer un nouveau cercle : le cercle précédent est automatiquement remplacé.</li>
                            <li><b>Aucun bouton de validation</b> n'est requis.</li>
                          </>
                        ) : (
                          <>
                            <li>L'élève trace librement ses cercles en style neutre avant de soumettre.</li>
                            <li>Le clic sur <b>Corriger</b> évalue la réponse complète.</li>
                            <li><b>Réponse correcte :</b> tous les cercles passent au vert.</li>
                            <li><b>Réponse incorrecte :</b> tous les cercles passent au rouge sans révéler les réponses individuelles, et <b>Réessayer</b> efface la sélection précédente.</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
