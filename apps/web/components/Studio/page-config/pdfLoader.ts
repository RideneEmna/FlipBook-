import type { StudioConfigPage } from './types';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

// In-memory cache for rendered pages (offscreen canvases)
const offscreenCache = new Map<string, HTMLCanvasElement>();

export function clearCanvasCache() {
  offscreenCache.clear();
}

export async function ensurePdfJs(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if (window.pdfjsLib) {
    if (!window.pdfjsLib.GlobalWorkerOptions?.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return window.pdfjsLib;
  }

  // Inject dynamically if not present
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="pdf.min.js"]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve(window.pdfjsLib);
      });
      setTimeout(() => resolve(window.pdfjsLib || null), 2500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      resolve(window.pdfjsLib);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

export async function loadPdfDocument(source: File | ArrayBuffer): Promise<any> {
  const pdfjs = await ensurePdfJs();
  if (!pdfjs) throw new Error('PDF.js unavailable');
  const buffer = source instanceof File ? await source.arrayBuffer() : source;
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  return await loadingTask.promise;
}

export async function getOffscreenPageCanvas(
  page: StudioConfigPage,
  scaleWidth = 1000
): Promise<HTMLCanvasElement> {
  const key = `${page.id}_${page.kind}_${page.num || 0}_${scaleWidth}`;
  const cached = offscreenCache.get(key);
  if (cached) return cached;

  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  // 1. PDF Page rendering
  if (page.kind === 'pdf' && page.doc && page.num) {
    try {
      const pdfPage = await page.doc.getPage(page.num);
      const v0 = pdfPage.getViewport({ scale: 1 });
      const scale = scaleWidth / v0.width;
      const viewport = pdfPage.getViewport({ scale });
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      offscreenCache.set(key, offscreen);
      return offscreen;
    } catch (err) {
      console.warn('PDF page render error:', err);
    }
  }

  // 2. Pre-converted image URL rendering
  if (page.imageUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        offscreen.width = img.naturalWidth || 900;
        offscreen.height = img.naturalHeight || 1200;
        ctx.drawImage(img, 0, 0);
        offscreenCache.set(key, offscreen);
        resolve();
      };
      img.onerror = () => {
        offscreen.width = 900;
        offscreen.height = 1200;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 900, 1200);
        resolve();
      };
      img.src = page.imageUrl!;
    });
    return offscreen;
  }

  // 3. Blank Page
  offscreen.width = 900;
  offscreen.height = 1200;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 900, 1200);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = "500 28px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('Page blanche', 450, 600);
  offscreenCache.set(key, offscreen);
  return offscreen;
}

/**
 * Renders page to a target canvas smoothly with double-buffering.
 * Avoids setting width/height if dimensions already match, preventing white flashes.
 */
export async function renderPageToCanvas(
  page: StudioConfigPage,
  targetCanvas: HTMLCanvasElement,
  scaleWidth = 1000
): Promise<void> {
  const offscreen = await getOffscreenPageCanvas(page, scaleWidth);
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  if (targetCanvas.width !== offscreen.width || targetCanvas.height !== offscreen.height) {
    targetCanvas.width = offscreen.width;
    targetCanvas.height = offscreen.height;
  }

  ctx.drawImage(offscreen, 0, 0);
}
