'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Save,
  FolderOpenDot,
  ArrowRight,
  Highlighter,
  Lasso,
  Volume2,
  Music,
  Video,
  ZoomIn,
  TextCursorInput,
  Eye,
  CheckSquare,
  CheckCircle2,
  Loader2,
  Move,
  Circle,
  Target,
  Maximize2,
  LayoutGrid,
} from 'lucide-react';
import StudioStepper from './StudioStepper';
import PageConfigPanel from './page-config/PageConfigPanel';
import PageThumbnailsStrip from './page-config/PageThumbnailsStrip';
import LivePreviewModal from './page-config/LivePreviewModal';
import {
  TOOL_DEFS,
  DEFAULT_ITEM_DATA,
  CANVAS_PRESETS,
  type CanvasPresetKey,
  type CanvasPresetSetting,
  MIN_CANVAS_DIM,
  MAX_CANVAS_DIM,
  isValidCanvasDim,
  type InteractiveToolKey,
  type InteractiveItem,
  type StudioConfigPage,
} from './page-config/types';
import {
  renderPageToCanvas,
  loadPdfDocument,
} from './page-config/pdfLoader';

interface Props {
  initialPdfFile?: File | null;
  initialProjectJsonFile?: File | null;
  initialJobId?: string | null;
  initialPages?: { pageNumber: number; imagePath: string; thumbPath: string }[];
  persistedPages?: StudioConfigPage[];
  initialCanvasPreset?: CanvasPresetSetting;
  onProceedToConversion: (projectData: {
    pages: StudioConfigPage[];
    meta: { title?: string; canvasPreset?: CanvasPresetSetting };
  }) => void;
}

let uidCounter = 1;
const genId = () => `item_${Date.now()}_${uidCounter++}`;

const parseStudioNorm = (val: any, fallback = 0.1): number => {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string') {
    const clean = val.trim();
    const hasPct = clean.includes('%');
    const num = parseFloat(clean);
    if (isNaN(num)) return fallback;
    return (hasPct || num > 1) ? num / 100 : num;
  }
  const num = Number(val);
  if (isNaN(num)) return fallback;
  return num > 1 ? num / 100 : num;
};

const TOOL_ICONS: Record<InteractiveToolKey, React.ComponentType<{ className?: string }>> = {
  highlight: Highlighter,
  lasso: Lasso,
  tts: Volume2,
  audio: Music,
  video: Video,
  zoom: ZoomIn,
  blank: TextCursorInput,
  reveal: Eye,
  check: CheckSquare,
  button: CheckCircle2,
  'drag-drop': Move,
  'circle-exercise': Circle,
};

export default function StudioPageConfigView({
  initialPdfFile,
  initialProjectJsonFile,
  initialJobId,
  initialPages,
  persistedPages,
  initialCanvasPreset,
  onProceedToConversion,
}: Props) {
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(() => {
    if (persistedPages && persistedPages.length > 0) return false;
    return !!initialPdfFile;
  });

  // Initialize pages without any fake placeholder demo pages
  const [pages, setPages] = useState<StudioConfigPage[]>(() => {
    if (persistedPages && persistedPages.length > 0) {
      return persistedPages;
    }
    if (initialPages && initialPages.length > 0 && initialJobId) {
      const base = `${process.env.NEXT_PUBLIC_CONVERTER_URL ?? 'http://127.0.0.1:8000'}/files/${initialJobId}/`;
      return initialPages.map((p, i) => ({
        id: `p_${i + 1}`,
        kind: 'image',
        num: p.pageNumber,
        imageUrl: `${base}${p.imagePath}`,
        items: [],
      }));
    }
    // If a PDF is provided, we start empty until loadPdfDocument loads the real pages
    if (initialPdfFile) {
      return [];
    }
    // Fallback if no PDF was provided: exactly 1 blank page
    return [
      {
        id: 'p_blank_1',
        kind: 'blank',
        items: [],
      },
    ];
  });

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<InteractiveToolKey | null>('highlight');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLiveOpen, setIsLiveOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(3 / 4);

  // Canvas size presets state
  const [canvasPresetKey, setCanvasPresetKey] = useState<CanvasPresetKey>(
    initialCanvasPreset?.key || 'fit'
  );
  const [customDimensions, setCustomDimensions] = useState<{ width: number; height: number }>({
    width: initialCanvasPreset?.customWidth || initialCanvasPreset?.width || 1024,
    height: initialCanvasPreset?.customHeight || initialCanvasPreset?.height || 768,
  });
  const [customInputW, setCustomInputW] = useState<string>(
    String(initialCanvasPreset?.customWidth || initialCanvasPreset?.width || 1024)
  );
  const [customInputH, setCustomInputH] = useState<string>(
    String(initialCanvasPreset?.customHeight || initialCanvasPreset?.height || 768)
  );
  const [customDimError, setCustomDimError] = useState<string | null>(null);

  const handleCustomDimensionChange = (wStr: string, hStr: string) => {
    setCustomInputW(wStr);
    setCustomInputH(hStr);

    const wNum = Number(wStr);
    const hNum = Number(hStr);

    if (!Number.isFinite(wNum) || wNum < MIN_CANVAS_DIM || wNum > MAX_CANVAS_DIM) {
      setCustomDimError(`Largeur entre ${MIN_CANVAS_DIM} et ${MAX_CANVAS_DIM} px`);
      return;
    }
    if (!Number.isFinite(hNum) || hNum < MIN_CANVAS_DIM || hNum > MAX_CANVAS_DIM) {
      setCustomDimError(`Hauteur entre ${MIN_CANVAS_DIM} et ${MAX_CANVAS_DIM} px`);
      return;
    }

    setCustomDimError(null);
    setCustomDimensions({ width: Math.round(wNum), height: Math.round(hNum) });
  };

  // Drawing state
  const [draftRect, setDraftRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [draftLasso, setDraftLasso] = useState<[number, number][] | null>(null);

  // Target selection & canvas dragging for drag-and-drop
  const [targetPickingItemId, setTargetPickingItemId] = useState<string | null>(null);
  const [draggingTargetId, setDraggingTargetId] = useState<string | null>(null);
  const targetDragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const currentDocRef = useRef<any>(null);
  const activeDocsRef = useRef<Record<string, any>>({});
  const dragRef = useRef<{
    start: [number, number];
    current: [number, number];
    pts: [number, number][];
  } | null>(null);

  const currentPage = pages[currentPageIndex] || pages[0];

  const selectedPreset =
    CANVAS_PRESETS.find((p) => p.key === canvasPresetKey) || CANVAS_PRESETS[0];

  const effectivePageAspect = pageAspectRatio > 0 ? pageAspectRatio : 3 / 4;

  let workspaceWidth = 1000;
  let workspaceHeight = Math.round(1000 / effectivePageAspect);
  let workspaceAspect = effectivePageAspect;

  if (canvasPresetKey === 'fit') {
    workspaceAspect = effectivePageAspect;
    workspaceWidth = canvasRef.current?.width || 1000;
    workspaceHeight = canvasRef.current?.height || Math.round(1000 / effectivePageAspect);
  } else if (canvasPresetKey === 'custom') {
    const w = customDimensions.width;
    const h = customDimensions.height;
    if (isValidCanvasDim(w) && isValidCanvasDim(h)) {
      workspaceWidth = w;
      workspaceHeight = h;
      workspaceAspect = w / h;
    }
  } else if (selectedPreset.width && selectedPreset.height) {
    workspaceWidth = selectedPreset.width;
    workspaceHeight = selectedPreset.height;
    workspaceAspect = selectedPreset.width / selectedPreset.height;
  }

  // Calculate proportional containment of PDF page inside workspace without stretching or cropping
  let pageBox = { left: 0, top: 0, width: 100, height: 100 };
  if (canvasPresetKey !== 'fit' && effectivePageAspect > 0 && workspaceAspect > 0) {
    if (workspaceAspect > effectivePageAspect) {
      // Workspace is wider than page -> pillarbox (centered horizontally)
      const wPct = (effectivePageAspect / workspaceAspect) * 100;
      const leftPct = (100 - wPct) / 2;
      pageBox = {
        left: Math.max(0, leftPct),
        top: 0,
        width: Math.min(100, wPct),
        height: 100,
      };
    } else {
      // Workspace is taller than page -> letterbox (centered vertically)
      const hPct = (workspaceAspect / effectivePageAspect) * 100;
      const topPct = (100 - hPct) / 2;
      pageBox = {
        left: 0,
        top: Math.max(0, topPct),
        width: 100,
        height: Math.min(100, hPct),
      };
    }
  }

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Load initial PDF file into real pages
  useEffect(() => {
    if (!initialPdfFile) return;

    if (persistedPages && persistedPages.length > 0) {
      loadPdfDocument(initialPdfFile)
        .then((doc) => {
          currentDocRef.current = doc;
          if (initialPdfFile.name) {
            activeDocsRef.current[initialPdfFile.name] = doc;
          }
          setPages((prev) =>
            prev.map((p) => (p.kind === 'pdf' && !p.doc ? { ...p, doc } : p))
          );
        })
        .catch(() => {});
      return;
    }

    let cancelled = false;
    setIsLoadingPdf(true);

    loadPdfDocument(initialPdfFile)
      .then((doc) => {
        if (cancelled) return;
        currentDocRef.current = doc;
        if (initialPdfFile.name) {
          activeDocsRef.current[initialPdfFile.name] = doc;
        }

        const newPages: StudioConfigPage[] = [];
        for (let num = 1; num <= doc.numPages; num++) {
          newPages.push({
            id: `p_pdf_${num}`,
            kind: 'pdf',
            name: initialPdfFile.name,
            num,
            doc,
            items: [],
          });
        }
        setPages(newPages);
        setCurrentPageIndex(0);
        setIsLoadingPdf(false);
        showToast(
          `${doc.numPages} page(s) chargée(s) depuis ${initialPdfFile.name}`
        );
      })
      .catch((err) => {
        console.error('Failed to load initial PDF:', err);
        if (!cancelled) {
          setIsLoadingPdf(false);
          showToast('Erreur lors de la lecture du document PDF.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialPdfFile, showToast, persistedPages]);

  // Load initial project JSON file if opened from Step 1
  useEffect(() => {
    if (!initialProjectJsonFile) return;
    initialProjectJsonFile.text().then((text) => {
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data.pages) || data.pages.length === 0) return;
        const activeDoc = currentDocRef.current || pages.find((p) => p.doc)?.doc;
        const pdfName = data.pdfFileName || data.pages[0]?.sourcePdfName;
        const docToUse = (pdfName && activeDocsRef.current[pdfName]) || activeDoc;

        const imported: StudioConfigPage[] = data.pages.map((q: any, i: number) => {
          const pageName = q.sourcePdfName || q.name || pdfName;
          const matchedDoc = (pageName && activeDocsRef.current[pageName]) || docToUse || null;
          return {
            id: `p_loaded_${i + 1}_${Date.now()}`,
            kind: q.kind || (matchedDoc ? 'pdf' : 'blank'),
            idx: q.idx ?? i,
            name: pageName,
            num: q.sourcePdfPageNum || q.num || i + 1,
            doc: matchedDoc,
            items: (q.items || q.interactions || []).map((it: any) => ({
              ...it,
              x: parseStudioNorm(it.x, 0.1),
              y: parseStudioNorm(it.y, 0.1),
              w: parseStudioNorm(it.w ?? it.width, 0.1),
              h: parseStudioNorm(it.h ?? it.height, 0.08),
              id: it.id || genId(),
            })),
          };
        });

        if (data.canvasPreset) {
          const cp = data.canvasPreset;
          const k = (typeof cp === 'string' ? cp : cp.key) as CanvasPresetKey;
          if (CANVAS_PRESETS.some((p) => p.key === k)) {
            setCanvasPresetKey(k);
          }
          const cw = cp.customWidth || (k === 'custom' ? cp.width : undefined);
          const ch = cp.customHeight || (k === 'custom' ? cp.height : undefined);
          if (isValidCanvasDim(cw) && isValidCanvasDim(ch)) {
            setCustomDimensions({ width: cw, height: ch });
            setCustomInputW(String(cw));
            setCustomInputH(String(ch));
          }
        }

        setPages(imported);
        setCurrentPageIndex(0);
        setSelectedItemId(null);
        showToast(`Projet chargé avec succès : ${imported.length} pages restaurées.`);
      } catch (err) {
        console.error(err);
      }
    });
  }, [initialProjectJsonFile, showToast]);

  // Render current page onto main canvas ONLY when the page itself changes,
  // NOT when items, drawings, or selection changes!
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !currentPage) return;

    renderPageToCanvas(currentPage, canvas, 1000).then(() => {
      if (cancelled) return;
      if (canvas.width > 0 && canvas.height > 0) {
        setPageAspectRatio(canvas.width / canvas.height);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentPage?.id, currentPage?.num, currentPage?.kind, currentPage?.doc, currentPage?.imageUrl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedItemId
      ) {
        setPages((prev) =>
          prev.map((p, i) =>
            i === currentPageIndex
              ? { ...p, items: p.items.filter((it) => it.id !== selectedItemId) }
              : p
          )
        );
        setSelectedItemId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages.length, currentPageIndex, selectedItemId]);

  // Pointer position relative to overlay (0 to 1)
  const getRelativePos = (e: React.PointerEvent<HTMLDivElement>): [number, number] => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    return [x, y];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.setPointerCapture(e.pointerId);

    const pos = getRelativePos(e);
    dragRef.current = { start: pos, current: pos, pts: [pos] };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 1. Direct canvas dragging of target destination zone
    if (draggingTargetId && targetDragOffsetRef.current) {
      const pos = getRelativePos(e);
      const targetItem = currentPage?.items.find((i) => i.id === draggingTargetId);
      if (targetItem) {
        const tw = targetItem.targetW ?? targetItem.w ?? 0.15;
        const th = targetItem.targetH ?? targetItem.h ?? 0.08;
        const newTx = Math.min(1 - tw, Math.max(0, pos[0] - targetDragOffsetRef.current.dx));
        const newTy = Math.min(1 - th, Math.max(0, pos[1] - targetDragOffsetRef.current.dy));
        handleUpdateItem(draggingTargetId, {
          targetX: parseFloat(newTx.toFixed(3)),
          targetY: parseFloat(newTy.toFixed(3)),
        });
      }
      return;
    }

    if (!dragRef.current) return;
    const pos = getRelativePos(e);
    dragRef.current.current = pos;
    dragRef.current.pts.push(pos);

    // 2. Target destination picking mode
    if (targetPickingItemId) {
      const x = Math.min(dragRef.current.start[0], pos[0]);
      const y = Math.min(dragRef.current.start[1], pos[1]);
      const w = Math.abs(pos[0] - dragRef.current.start[0]);
      const h = Math.abs(pos[1] - dragRef.current.start[1]);
      setDraftRect({ x, y, w, h });
      return;
    }

    if (!activeTool) return;
    const def = TOOL_DEFS[activeTool];

    if (def.k === 'rect') {
      const x = Math.min(dragRef.current.start[0], pos[0]);
      const y = Math.min(dragRef.current.start[1], pos[1]);
      const w = Math.abs(pos[0] - dragRef.current.start[0]);
      const h = Math.abs(pos[1] - dragRef.current.start[1]);
      setDraftRect({ x, y, w, h });
    } else if (def.k === 'lasso') {
      setDraftLasso([...dragRef.current.pts]);
    }
  };

  const handlePointerUp = () => {
    if (draggingTargetId) {
      setDraggingTargetId(null);
      targetDragOffsetRef.current = null;
      return;
    }

    if (!dragRef.current) return;
    const drag = dragRef.current;
    dragRef.current = null;
    setDraftRect(null);
    setDraftLasso(null);

    const distance = Math.hypot(
      drag.current[0] - drag.start[0],
      drag.current[1] - drag.start[1]
    );
    const isClick = distance < 0.02;

    // 1. Mouse selection of Target Zone for Drag & Drop
    if (targetPickingItemId) {
      const it = currentPage?.items.find((i) => i.id === targetPickingItemId);
      if (it) {
        let tx = 0, ty = 0;
        let tw = it.targetW ?? it.w ?? 0.15;
        let th = it.targetH ?? it.h ?? 0.08;
        if (isClick) {
          tx = Math.min(1 - tw, Math.max(0, drag.start[0] - tw / 2));
          ty = Math.min(1 - th, Math.max(0, drag.start[1] - th / 2));
        } else {
          tx = Math.min(drag.start[0], drag.current[0]);
          ty = Math.min(drag.start[1], drag.current[1]);
          tw = Math.max(0.02, Math.abs(drag.current[0] - drag.start[0]));
          th = Math.max(0.02, Math.abs(drag.current[1] - drag.start[1]));
        }
        handleUpdateItem(it.id, {
          targetX: parseFloat(tx.toFixed(3)),
          targetY: parseFloat(ty.toFixed(3)),
          targetW: parseFloat(tw.toFixed(3)),
          targetH: parseFloat(th.toFixed(3)),
        });
        showToast('Zone cible positionnée à la souris avec succès ! 🎯');
      }
      setTargetPickingItemId(null);
      return;
    }

    // Click without active tool: select clicked item
    if (!activeTool || (isClick && TOOL_DEFS[activeTool].k !== 'pt')) {
      const clicked = [...currentPage.items]
        .reverse()
        .find(
          (it) =>
            drag.start[0] >= it.x &&
            drag.start[0] <= it.x + it.w &&
            drag.start[1] >= it.y &&
            drag.start[1] <= it.y + it.h
        );
      setSelectedItemId(clicked ? clicked.id : null);
      return;
    }

    const def = TOOL_DEFS[activeTool];
    const newItem: InteractiveItem = {
      id: genId(),
      type: activeTool,
      x: 0,
      y: 0,
      w: 0.1,
      h: 0.1,
      ...structuredClone(DEFAULT_ITEM_DATA[activeTool]),
    };

    if (def.k === 'pt') {
      const w = def.w || 0.08;
      const h = def.h || 0.05;
      newItem.w = w;
      newItem.h = h;
      newItem.x = Math.min(1 - w, Math.max(0, drag.start[0] - w / 2));
      newItem.y = Math.min(1 - h, Math.max(0, drag.start[1] - h / 2));
    } else if (def.k === 'rect') {
      newItem.x = Math.min(drag.start[0], drag.current[0]);
      newItem.y = Math.min(drag.start[1], drag.current[1]);
      newItem.w = Math.abs(drag.current[0] - drag.start[0]);
      newItem.h = Math.abs(drag.current[1] - drag.start[1]);
      if (newItem.w < 0.01 || newItem.h < 0.008) return;
    } else if (def.k === 'lasso') {
      if (drag.pts.length < 5) return;
      const xs = drag.pts.map((p) => p[0]);
      const ys = drag.pts.map((p) => p[1]);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const w = Math.max(0.01, Math.max(...xs) - minX);
      const h = Math.max(0.01, Math.max(...ys) - minY);
      newItem.x = minX;
      newItem.y = minY;
      newItem.w = w;
      newItem.h = h;
      newItem.pts = drag.pts
        .filter((_, idx) => idx % 2 === 0)
        .map((p) => [
          parseFloat((((p[0] - minX) / w) * 100).toFixed(1)),
          parseFloat((((p[1] - minY) / h) * 100).toFixed(1)),
        ]);
    }

    if (activeTool === 'drag-drop') {
      const targetOffsetY = newItem.y > 0.5 ? -0.16 : 0.16;
      newItem.targetX = parseFloat(Math.min(0.85, Math.max(0.05, newItem.x + 0.15)).toFixed(3));
      newItem.targetY = parseFloat(Math.min(0.85, Math.max(0.05, newItem.y + targetOffsetY)).toFixed(3));
      newItem.targetW = newItem.w;
      newItem.targetH = newItem.h;
      newItem.artworkUrl = cropItemArtwork(newItem);
      setTargetPickingItemId(newItem.id);
      showToast('Source créée ! Cliquez ou tracez sur la page pour placer la zone cible 🎯');
    } else if (activeTool === 'circle-exercise') {
      const pageItems = pages[currentPageIndex]?.items || [];
      const existingCircle = pageItems.find(
        (i) => i.type === 'circle-exercise'
      );
      const qId = existingCircle?.questionId || existingCircle?.groupId || 'q1';
      const hasCorrectForQ = pageItems.some(
        (i) =>
          i.type === 'circle-exercise' &&
          (i.questionId || i.groupId || 'q1') === qId &&
          i.isCorrect !== false
      );
      newItem.circleMode = 'single';
      newItem.tolerance = 0.5;
      newItem.questionId = qId;
      newItem.questionTitle = existingCircle?.questionTitle || `Question ${qId.replace(/^q/i, '') || '1'}`;
      newItem.isCorrect = !hasCorrectForQ;
      newItem.requireAll = false;
      newItem.strictSelection = true;
      newItem.groupId = qId;
      newItem.color = !hasCorrectForQ ? '#10b981' : '#f59e0b';
    }

    setPages((prev) =>
      prev.map((p, i) =>
        i === currentPageIndex ? { ...p, items: [...p.items, newItem] } : p
      )
    );
    setSelectedItemId(newItem.id);
  };

  const cropItemArtwork = useCallback((item: { x: number; y: number; w: number; h: number }) => {
    const cv = canvasRef.current;
    if (!cv || cv.width <= 0 || cv.height <= 0) return '';
    try {
      const cropCv = document.createElement('canvas');
      const sx = Math.max(0, Math.round(item.x * cv.width));
      const sy = Math.max(0, Math.round(item.y * cv.height));
      const sw = Math.min(cv.width - sx, Math.max(1, Math.round(item.w * cv.width)));
      const sh = Math.min(cv.height - sy, Math.max(1, Math.round(item.h * cv.height)));
      cropCv.width = sw;
      cropCv.height = sh;
      const cctx = cropCv.getContext('2d');
      if (cctx) {
        cctx.drawImage(cv, sx, sy, sw, sh, 0, 0, sw, sh);
        return cropCv.toDataURL('image/png');
      }
    } catch (e) {
      console.warn('Canvas crop failed:', e);
    }
    return '';
  }, []);

  const handleRecropArtwork = (id: string) => {
    const it = currentPage?.items.find((x) => x.id === id);
    if (!it) return;
    const url = cropItemArtwork(it);
    if (url) {
      handleUpdateItem(id, { artworkUrl: url });
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<InteractiveItem>) => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === currentPageIndex
          ? {
              ...p,
              items: p.items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
            }
          : p
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === currentPageIndex
          ? { ...p, items: p.items.filter((it) => it.id !== id) }
          : p
      )
    );
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // Page manipulations
  const handleDuplicatePage = (idx: number) => {
    const src = pages[idx];
    const duplicated: StudioConfigPage = {
      ...src,
      id: `p_dup_${Date.now()}`,
      items: src.items.map((it) => ({
        ...it,
        id: genId(),
      })),
    };
    const nextPages = [...pages];
    nextPages.splice(idx + 1, 0, duplicated);
    setPages(nextPages);
    setCurrentPageIndex(idx + 1);
    showToast(`Page ${idx + 1} dupliquée.`);
  };

  const handleDeletePage = (idx: number) => {
    if (pages.length <= 1) return;
    const nextPages = pages.filter((_, i) => i !== idx);
    setPages(nextPages);
    setCurrentPageIndex((prev) => Math.min(prev, nextPages.length - 1));
    setSelectedItemId(null);
    showToast(`Page ${idx + 1} supprimée.`);
  };

  const handleAddBlankPage = () => {
    const blank: StudioConfigPage = {
      id: `p_blank_${Date.now()}`,
      kind: 'blank',
      items: [],
    };
    const nextPages = [...pages];
    nextPages.splice(currentPageIndex + 1, 0, blank);
    setPages(nextPages);
    setCurrentPageIndex(currentPageIndex + 1);
    setSelectedItemId(null);
    showToast(`Page blanche ajoutée après la page ${currentPageIndex + 1}.`);
  };

  const handleImportPdfPages = (doc: any, fileName: string) => {
    activeDocsRef.current[fileName] = doc;
    if (!currentDocRef.current) currentDocRef.current = doc;

    const newItems: StudioConfigPage[] = [];
    for (let num = 1; num <= doc.numPages; num++) {
      newItems.push({
        id: `p_imp_${num}_${Date.now()}`,
        kind: 'pdf',
        name: fileName,
        num,
        doc,
        items: [],
      });
    }
    setPages((prev) => [...prev, ...newItems]);
  };

  const handleReorderPages = (fromIdx: number, toIdx: number) => {
    const updated = [...pages];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setPages(updated);
    setCurrentPageIndex(toIdx);
  };

  // Save / Load JSON with complete details of every modification on each page
  const handleSaveJson = () => {
    const exportData = {
      app: 'flipbook-studio-pro',
      version: 1,
      savedAt: new Date().toISOString(),
      pdfFileName: initialPdfFile?.name || pages[0]?.name || 'document.pdf',
      totalPages: pages.length,
      canvasPreset: {
        key: canvasPresetKey,
        label: selectedPreset.label,
        width: Math.round(workspaceWidth),
        height: Math.round(workspaceHeight),
        customWidth: customDimensions.width,
        customHeight: customDimensions.height,
      },
      pages: pages.map((p, idx) => ({
        pageNumber: idx + 1,
        kind: p.kind,
        sourcePdfName: p.name,
        sourcePdfPageNum: p.num,
        itemsCount: p.items.length,
        items: p.items.map(({ fileUrl, ...rest }) => ({
          ...rest,
          w: rest.w,
          h: rest.h,
          width: rest.w,
          height: rest.h,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flipbook-projet.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Projet sauvegardé : flipbook-projet.json');
  };

  const handleLoadJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.pages) || data.pages.length === 0) {
        throw new Error('Structure JSON invalide');
      }

      const activeDoc = currentDocRef.current || pages.find((p) => p.doc)?.doc;
      const pdfName = data.pdfFileName || data.pages[0]?.sourcePdfName;
      let docToUse = (pdfName && activeDocsRef.current[pdfName]) || activeDoc;

      if (!docToUse && initialPdfFile) {
        try {
          docToUse = await loadPdfDocument(initialPdfFile);
          currentDocRef.current = docToUse;
        } catch {}
      }

      const imported: StudioConfigPage[] = data.pages.map(
        (q: any, i: number) => {
          const pageName = q.sourcePdfName || q.name || pdfName;
          const matchedDoc =
            (pageName && activeDocsRef.current[pageName]) || docToUse || null;

          return {
            id: `p_loaded_${i + 1}_${Date.now()}`,
            kind: q.kind || (matchedDoc ? 'pdf' : 'blank'),
            idx: q.idx ?? i,
            name: pageName,
            num: q.sourcePdfPageNum || q.num || i + 1,
            doc: matchedDoc,
            items: (q.items || q.interactions || []).map((it: any) => ({
              ...it,
              x: parseStudioNorm(it.x, 0.1),
              y: parseStudioNorm(it.y, 0.1),
              w: parseStudioNorm(it.w ?? it.width, 0.1),
              h: parseStudioNorm(it.h ?? it.height, 0.08),
              id: it.id || genId(),
            })),
          };
        }
      );

      if (data.canvasPreset) {
        const cp = data.canvasPreset;
        const k = (typeof cp === 'string' ? cp : cp.key) as CanvasPresetKey;
        if (CANVAS_PRESETS.some((p) => p.key === k)) {
          setCanvasPresetKey(k);
        }
        const cw = cp.customWidth || (k === 'custom' ? cp.width : undefined);
        const ch = cp.customHeight || (k === 'custom' ? cp.height : undefined);
        if (isValidCanvasDim(cw) && isValidCanvasDim(ch)) {
          setCustomDimensions({ width: cw, height: ch });
          setCustomInputW(String(cw));
          setCustomInputH(String(ch));
        }
      }

      setPages(imported);
      setCurrentPageIndex(0);
      setSelectedItemId(null);
      showToast(
        `Projet chargé avec succès : ${imported.length} pages restaurées.`
      );
    } catch {
      showToast('Fichier .json invalide.');
    }
    e.target.value = '';
  };

  return (
    <div className="relative w-full">
      {/* Ambient glowing background blur orbs */}
      <div className="absolute -top-10 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 1. Header with exact requested title & tags */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
            <span>Flipbook Studio Pro · Éditeur Interactif</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Convertisseur &amp; Configurateur de Flipbook
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-normal">
            Configurez chaque page (textes à lire, modales HD, pistes audio) avant
            de compiler votre Flipbook HTML5 autonome.
          </p>
        </header>

        {/* 2. Stepper Card with Step 2 Activated */}
        <StudioStepper currentStep={2} />

        {/* 3. Action & Navigation Menu Bar */}
        <div className="relative rounded-2xl shadow-2xl overflow-hidden">
          {/* Gradient border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-indigo-600/30 blur-sm pointer-events-none" />
          <div className="relative flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-900/80 backdrop-blur-xl border border-white/[0.07] rounded-2xl">

            {/* ── Page Navigation ── */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentPageIndex === 0 || pages.length === 0}
                aria-label="Page précédente"
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 hover:bg-indigo-600/30 disabled:opacity-30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-indigo-500/60 transition-all active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 min-w-[88px] justify-center">
                <span className="text-xs text-slate-400 font-medium">Page</span>
                <span className="text-sm font-bold text-white">{pages.length > 0 ? currentPageIndex + 1 : 0}</span>
                <span className="text-slate-600 text-xs">/</span>
                <span className="text-xs text-slate-400">{pages.length}</span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1))}
                disabled={currentPageIndex >= pages.length - 1}
                aria-label="Page suivante"
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 hover:bg-indigo-600/30 disabled:opacity-30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-indigo-500/60 transition-all active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* ── Divider ── */}
            <div className="hidden sm:block w-px h-7 bg-gradient-to-b from-transparent via-slate-600/80 to-transparent mx-1" />

            {/* ── Canvas Size Preset Selector ── */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/40 transition-colors">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Format</span>
              <select
                value={canvasPresetKey}
                onChange={(e) => {
                  const nextKey = e.target.value as CanvasPresetKey;
                  setCanvasPresetKey(nextKey);
                  const chosen = CANVAS_PRESETS.find((p) => p.key === nextKey);
                  if (chosen) {
                    showToast(`Format de toile : ${chosen.label}`);
                  }
                }}
                aria-label="Format du canvas de travail"
                className="bg-transparent text-slate-200 text-xs font-semibold border-none focus:outline-none cursor-pointer appearance-none pr-4"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0px center' }}
              >
                {CANVAS_PRESETS.map((p) => (
                  <option key={p.key} value={p.key} className="bg-slate-900 text-slate-200">
                    {p.label} {p.width && p.height ? `(${p.width}×${p.height})` : p.key === 'fit' ? '(Auto)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Width & Height Inputs */}
            {canvasPresetKey === 'custom' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 text-xs">
                <div className="flex items-center gap-1">
                  <label htmlFor="custom-w-input" className="text-slate-400 text-[11px] font-medium">L:</label>
                  <input
                    id="custom-w-input"
                    type="number"
                    min={MIN_CANVAS_DIM}
                    max={MAX_CANVAS_DIM}
                    value={customInputW}
                    onChange={(e) => handleCustomDimensionChange(e.target.value, customInputH)}
                    placeholder="1024"
                    aria-label="Largeur personnalisée en pixels"
                    className="w-16 px-1.5 py-1 rounded bg-slate-950 border border-slate-600 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <span className="text-slate-500">×</span>
                <div className="flex items-center gap-1">
                  <label htmlFor="custom-h-input" className="text-slate-400 text-[11px] font-medium">H:</label>
                  <input
                    id="custom-h-input"
                    type="number"
                    min={MIN_CANVAS_DIM}
                    max={MAX_CANVAS_DIM}
                    value={customInputH}
                    onChange={(e) => handleCustomDimensionChange(customInputW, e.target.value)}
                    placeholder="768"
                    aria-label="Hauteur personnalisée en pixels"
                    className="w-16 px-1.5 py-1 rounded bg-slate-950 border border-slate-600 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400">px</span>
                {customDimError && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                    {customDimError}
                  </span>
                )}
              </div>
            )}

            {/* ── Divider ── */}
            <div className="hidden sm:block w-px h-7 bg-gradient-to-b from-transparent via-slate-600/80 to-transparent mx-1" />

            {/* ── Utility Action Buttons ── */}
            <div className="flex items-center gap-1.5">
              {/* Test Live */}
              <button
                type="button"
                onClick={() => setIsLiveOpen(true)}
                disabled={pages.length === 0}
                title="Tester cette page en direct"
                className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/60 text-slate-300 hover:text-indigo-300 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
              >
                <PlayCircle className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                <span className="hidden lg:inline">Tester en direct</span>
                {/* Tooltip for small screens */}
                <span className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] bg-slate-800 border border-slate-700 text-slate-200 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  Tester en direct
                </span>
              </button>

              {/* Save JSON */}
              <button
                type="button"
                onClick={handleSaveJson}
                disabled={pages.length === 0}
                title="Sauvegarder projet (.json)"
                className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-emerald-600/20 border border-slate-700/60 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
              >
                <Save className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                <span className="hidden lg:inline">Sauvegarder</span>
                <span className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] bg-slate-800 border border-slate-700 text-slate-200 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  Sauvegarder projet (.json)
                </span>
              </button>

              {/* Load JSON */}
              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                title="Charger projet (.json)"
                className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-amber-600/20 border border-slate-700/60 hover:border-amber-500/60 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-all active:scale-95"
              >
                <FolderOpenDot className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                <span className="hidden lg:inline">Charger</span>
                <span className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] bg-slate-800 border border-slate-700 text-slate-200 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  Charger (.json)
                </span>
              </button>
              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleLoadJson}
              />
            </div>

            {/* ── Spacer ── */}
            <div className="flex-1 min-w-0" />

            {/* ── CTA: Proceed to Conversion ── */}
            <button
              type="button"
              onClick={() =>
                onProceedToConversion({
                  pages,
                  meta: {
                    title: initialPdfFile?.name,
                    canvasPreset: {
                      key: canvasPresetKey,
                      width: Math.round(workspaceWidth),
                      height: Math.round(workspaceHeight),
                      customWidth: customDimensions.width,
                      customHeight: customDimensions.height,
                    },
                  },
                })
              }
              disabled={pages.length === 0}
              className="relative inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-white overflow-hidden disabled:opacity-50 active:scale-[0.97] transition-transform group"
            >
              {/* Gradient background */}
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 transition-all" />
              {/* Shimmer sweep on hover */}
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {/* Outer glow */}
              <span className="absolute inset-0 rounded-xl ring-2 ring-indigo-500/0 group-hover:ring-indigo-500/60 transition-all blur-sm" />
              <span className="relative">Passer à la conversion</span>
              <ArrowRight className="relative w-4 h-4" />
            </button>
          </div>
        </div>


        {/* 4. Main Glass Canvas & Configuration Section */}
        <main className="glass-panel rounded-3xl p-4 md:p-6 shadow-2xl glow-effect">
          {isLoadingPdf ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <h3 className="text-lg font-bold text-white">
                Chargement des pages du PDF...
              </h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Préparation de l'éditeur interactif et rendu haute fidélité des pages.
              </p>
            </div>
          ) : (
            <>
              <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
                {/* Left Canvas Section */}
                <section className="min-w-0 flex flex-col">
                  {/* Tool Bar */}
                  <div
                    className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar"
                    role="toolbar"
                    aria-label="Outils d'interaction"
                  >
                    {(Object.keys(TOOL_DEFS) as InteractiveToolKey[]).map((key) => {
                      const def = TOOL_DEFS[key];
                      const Icon = TOOL_ICONS[key];
                      const isActive = activeTool === key;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setActiveTool((prev) => (prev === key ? null : key))
                          }
                          className={[
                            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                            isActive
                              ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900/80 border-slate-700/70 text-slate-300 hover:border-indigo-500/60 hover:text-white',
                          ].join(' ')}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{def.n}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tool Hint */}
                  <p className="text-xs text-slate-400 mb-3 min-h-[16px]">
                    {activeTool
                      ? TOOL_DEFS[activeTool].hint
                      : 'Aucun outil actif : cliquez sur un élément de la page pour le sélectionner.'}
                  </p>

                  {/* Target Selection Mode Helper Banner */}
                  {targetPickingItemId && (
                    <div className="mb-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-900/30 animate-pulse">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-200" />
                        <span>Mode Cible : Cliquez ou tracez sur la page avec la souris pour positionner la zone de destination 🎯</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTargetPickingItemId(null)}
                        className="text-[11px] px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-emerald-100 transition font-bold"
                      >
                        Terminer
                      </button>
                    </div>
                  )}

                  {/* Canvas Stage Frame */}
                  <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-2 flex flex-col justify-center items-center gap-2">
                    {/* Workspace status bar */}
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold shadow-sm">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Espace Studio : {selectedPreset.label}</span>
                        </span>
                        <span className="text-slate-400">
                          {canvasPresetKey === 'fit'
                            ? `Auto (${Math.round(canvasRef.current?.width || 1000)} × ${Math.round(canvasRef.current?.height || 1414)} px)`
                            : `${Math.round(workspaceWidth)} × ${Math.round(workspaceHeight)} px`}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        Page PDF originale : {Math.round(canvasRef.current?.width || 1000)} × {Math.round(canvasRef.current?.height || 1414)} px
                        {canvasPresetKey !== 'fit' && ' • Ratio 100% préservé'}
                      </div>
                    </div>

                    {/* Outer Workspace Container (Dictated by Preset Aspect Ratio) */}
                    <div
                      className="relative shadow-2xl shadow-black/80 select-none w-full rounded-xl overflow-hidden border border-slate-700/60 flex items-center justify-center bg-slate-950/80 transition-all duration-200"
                      style={{
                        maxHeight: '76vh',
                        aspectRatio: `${workspaceAspect}`,
                      }}
                    >
                      {/* Subtle workspace grid pattern / mat */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                        }}
                      />

                      {/* Proportional PDF Page Container (Preserves Aspect Ratio, Never Stretched or Cropped) */}
                      <div
                        className="absolute bg-white rounded shadow-2xl shadow-black/80 transition-all duration-200 overflow-hidden"
                        style={{
                          left: `${pageBox.left}%`,
                          top: `${pageBox.top}%`,
                          width: `${pageBox.width}%`,
                          height: `${pageBox.height}%`,
                        }}
                      >
                        <canvas
                          id="studio-main-cv"
                          ref={canvasRef}
                          className="block w-full h-full object-contain pointer-events-none rounded"
                        />

                        {/* Interactive Drawing Overlay (aligned 1:1 on top of the PDF Page) */}
                        <div
                          ref={overlayRef}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className={[
                            'absolute inset-0',
                            targetPickingItemId
                              ? 'cursor-crosshair ring-2 ring-emerald-400/60'
                              : activeTool
                              ? 'cursor-crosshair'
                              : 'cursor-default',
                          ].join(' ')}
                          style={{ touchAction: 'none' }}
                        >
                        {/* Rendered Items on Overlay */}
                        {currentPage?.items?.map((it) => {
                          const def = TOOL_DEFS[it.type];
                          const col = it.color || def?.c || '#6366f1';
                          const isSelected = it.id === selectedItemId;

                          if (it.type === 'drag-drop') {
                            const tx = it.targetX ?? it.x + 0.15;
                            const ty = it.targetY ?? it.y;
                            const tw = it.targetW ?? it.w;
                            const th = it.targetH ?? it.h;

                            return (
                              <React.Fragment key={it.id}>
                                {/* Target destination zone (draggable by mouse) */}
                                <div
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemId(it.id);
                                    setDraggingTargetId(it.id);
                                    const pos = getRelativePos(e);
                                    targetDragOffsetRef.current = {
                                      dx: pos[0] - tx,
                                      dy: pos[1] - ty,
                                    };
                                    overlayRef.current?.setPointerCapture(e.pointerId);
                                  }}
                                  className={`absolute rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-500/20 flex flex-col items-center justify-center transition-shadow shadow-md select-none cursor-move z-20 ${
                                    isSelected
                                      ? 'ring-2 ring-emerald-300 ring-offset-1 ring-offset-slate-900 shadow-emerald-500/30'
                                      : ''
                                  }`}
                                  style={{
                                    left: `${tx * 100}%`,
                                    top: `${ty * 100}%`,
                                    width: `${tw * 100}%`,
                                    height: `${th * 100}%`,
                                    touchAction: 'none',
                                  }}
                                  title="Glissez à la souris pour déplacer la zone cible"
                                >
                                  <span className="text-[10px] font-bold text-emerald-200 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1 shadow-sm pointer-events-none">
                                    <Target className="w-3 h-3 text-emerald-400" />
                                    <span>Cible 🎯 (Glisser)</span>
                                  </span>
                                </div>

                                {/* Connector line when selected */}
                                {isSelected && (
                                  <svg
                                    className="absolute inset-0 pointer-events-none w-full h-full z-10"
                                    style={{ overflow: 'visible' }}
                                  >
                                    <line
                                      x1={`${(it.x + it.w / 2) * 100}%`}
                                      y1={`${(it.y + it.h / 2) * 100}%`}
                                      x2={`${(tx + tw / 2) * 100}%`}
                                      y2={`${(ty + th / 2) * 100}%`}
                                      stroke="#ec4899"
                                      strokeWidth="2"
                                      strokeDasharray="4 4"
                                    />
                                  </svg>
                                )}

                                {/* Source draggable element */}
                                <div
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: `${it.x * 100}%`,
                                    top: `${it.y * 100}%`,
                                    width: `${it.w * 100}%`,
                                    height: `${it.h * 100}%`,
                                  }}
                                >
                                  <div
                                    className="absolute inset-0 rounded-lg transition-all border-2 border-pink-500"
                                    style={{
                                      backgroundColor: `${it.maskColor || '#ffffff'}99`,
                                      outline: isSelected ? '2px dashed #ffffff' : undefined,
                                    }}
                                  >
                                    {it.artworkUrl && (
                                      <img
                                        src={it.artworkUrl}
                                        alt="Extrait"
                                        className="w-full h-full object-contain rounded opacity-90"
                                      />
                                    )}
                                  </div>
                                  <span className="absolute left-0 -top-4 font-bold text-[10px] px-1 rounded text-white bg-pink-600 whitespace-nowrap shadow-sm pointer-events-none">
                                    {def?.n} (Source)
                                  </span>
                                </div>
                              </React.Fragment>
                            );
                          }

                          if (it.type === 'circle-exercise') {
                            const isCorrectTarget = it.isCorrect !== false;
                            const qId = (it.questionId || it.groupId || 'q1').toUpperCase();
                            return (
                              <div
                                key={it.id}
                                className="absolute pointer-events-none"
                                style={{
                                  left: `${it.x * 100}%`,
                                  top: `${it.y * 100}%`,
                                  width: `${it.w * 100}%`,
                                  height: `${it.h * 100}%`,
                                }}
                              >
                                <div
                                  className={`absolute inset-0 rounded-full transition-all border-2 border-dashed ${
                                    isCorrectTarget
                                      ? 'border-emerald-400 bg-emerald-500/15'
                                      : 'border-amber-400 bg-amber-500/15'
                                  }`}
                                  style={{
                                    outline: isSelected ? '2px dashed #ffffff' : undefined,
                                  }}
                                />
                                <span
                                  className={`absolute left-0 -top-4 font-bold text-[10px] px-1.5 py-0.5 rounded text-white whitespace-nowrap shadow-sm pointer-events-none flex items-center gap-1 ${
                                    isCorrectTarget ? 'bg-emerald-600' : 'bg-amber-600'
                                  }`}
                                >
                                  <span>
                                    [{qId}] {isCorrectTarget ? 'Bonne réponse' : 'Fausse réponse'}
                                  </span>
                                </span>
                              </div>
                            );
                          }

                          if (it.type === 'video') {
                            return (
                              <div
                                key={it.id}
                                className="absolute pointer-events-none"
                                style={{
                                  left: `${it.x * 100}%`,
                                  top: `${it.y * 100}%`,
                                  width: `${it.w * 100}%`,
                                  height: `${it.h * 100}%`,
                                }}
                              >
                                <div
                                  className="absolute inset-0 rounded-lg flex items-center justify-center transition-all bg-red-600/20 border-2 border-red-500 shadow-sm"
                                  style={{
                                    outline: isSelected ? '2px dashed #ffffff' : undefined,
                                  }}
                                >
                                  <svg viewBox="0 0 68 48" className="w-7 h-5 drop-shadow">
                                    <path d="M66.52 7.74c-.78-2.93-3.09-5.24-6.02-6.02C55.22 0 34 0 34 0S12.78 0 7.5 1.72c-2.93.78-5.24 3.09-6.02 6.02C0 13.02 0 24 0 24s0 10.98 1.48 16.26c.78 2.93 3.09 5.24 6.02 6.02C12.78 48 34 48 34 48s21.22 0 26.5-1.72c2.93-.78 5.24-3.09 6.02-6.02C68 34.98 68 24 68 24s0-10.98-1.48-16.26z" fill="#FF0000" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6"/>
                                    <path d="M45 24 27 14v20z" fill="#FFFFFF"/>
                                  </svg>
                                </div>
                                <span
                                  className="absolute left-0 -top-4 font-bold text-[10px] px-1.5 py-0.5 rounded text-white whitespace-nowrap shadow-sm pointer-events-none bg-red-600 flex items-center gap-1"
                                >
                                  Vidéo YouTube
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={it.id}
                              className="absolute pointer-events-none"
                              style={{
                                left: `${it.x * 100}%`,
                                top: `${it.y * 100}%`,
                                width: `${it.w * 100}%`,
                                height: `${it.h * 100}%`,
                              }}
                            >
                              <div
                                className="absolute inset-0 transition-all"
                                style={{
                                  backgroundColor: `${col}${isSelected ? '88' : '44'}`,
                                  border:
                                    it.type !== 'lasso'
                                      ? `2px solid ${col}`
                                      : undefined,
                                  outline:
                                    isSelected && it.type !== 'lasso'
                                      ? '2px dashed #ffffff'
                                      : undefined,
                                  clipPath:
                                    it.type === 'lasso' && it.pts
                                      ? `polygon(${it.pts
                                          .map((q) => `${q[0]}% ${q[1]}%`)
                                          .join(',')})`
                                      : undefined,
                                }}
                              />
                              <span
                                className="absolute left-0 -top-4 font-bold text-[10px] px-1 rounded text-slate-900 whitespace-nowrap shadow-sm pointer-events-none"
                                style={{ backgroundColor: col }}
                              >
                                {def?.n}
                              </span>
                            </div>
                          );
                        })}

                        {/* Rectangle Drag Draft */}
                        {draftRect && activeTool && (
                          <div
                            className="absolute pointer-events-none border-2 border-dashed"
                            style={{
                              left: `${draftRect.x * 100}%`,
                              top: `${draftRect.y * 100}%`,
                              width: `${draftRect.w * 100}%`,
                              height: `${draftRect.h * 100}%`,
                              borderColor: TOOL_DEFS[activeTool].c,
                              backgroundColor: `${TOOL_DEFS[activeTool].c}33`,
                            }}
                          />
                        )}

                        {/* Lasso Drag Draft */}
                        {draftLasso && activeTool && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundColor: `${TOOL_DEFS[activeTool].c}44`,
                              clipPath: `polygon(${draftLasso
                                .map((q) => `${q[0] * 100}% ${q[1] * 100}%`)
                                .join(',')})`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right Configuration Panel */}
              {currentPage && (
                <PageConfigPanel
                  page={currentPage}
                  pageNumber={currentPageIndex + 1}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onRecropArtwork={handleRecropArtwork}
                  onStartSelectTarget={(id) => setTargetPickingItemId(id)}
                  isSettingTarget={targetPickingItemId === selectedItemId}
                />
              )}
            </div>

            {/* 5. Bottom Table des Pages (Thumbnails Strip) */}
            <PageThumbnailsStrip
              pages={pages}
              currentPageIndex={currentPageIndex}
              onSelectPage={setCurrentPageIndex}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              onAddBlankPage={handleAddBlankPage}
              onImportPdfPages={handleImportPdfPages}
              onReorderPages={handleReorderPages}
              onToast={showToast}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center pt-2 text-slate-500 text-xs">
        <p>
          Flipbook Studio Pro Engine v4.2 · Compilateur HTML5 Autonome • Tous
          droits réservés &copy; 2026
        </p>
      </footer>
    </div>

    {/* Live Preview Modal */}
    {isLiveOpen && currentPage && (
      <LivePreviewModal
        page={currentPage}
        pageNumber={currentPageIndex + 1}
        onClose={() => setIsLiveOpen(false)}
        onToast={showToast}
        workspacePreset={{
          key: canvasPresetKey,
          label: selectedPreset.label,
          aspectRatio: workspaceAspect,
          pageBox,
        }}
      />
    )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-5 py-3 rounded-xl bg-slate-800 border border-indigo-500/40 text-sm text-white shadow-2xl max-w-[90vw] text-center animate-in fade-in zoom-in duration-200"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
