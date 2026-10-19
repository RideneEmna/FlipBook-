// Viewer extrait de build_flipbook_html() (scripts/pdf2flipbook.py), en JavaScript simple.
// startViewer(project, { assetBase, root }) monte le livre dans la page.
import { PageFlip } from 'page-flip';
import lottie from 'lottie-web';
import iconUrl from './assets/icone.png';
import LOTTIE_SUCCESS_DATA from './assets/lottie-success.json';
import './viewer.css';

function esc(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

function shellHtml(title, subtitle, total) {
    return `
<div class="app" id="app">
  <!-- ═══════════════════════════════════════════════════ TOP BAR -->
  <header class="top" id="topHeader">
    <div class="brand">
      <span class="mark">
        <svg class="i" viewBox="0 0 24 24"><path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z"/><path d="M12 6v13"/></svg>
      </span>
      <div class="titles">
        <h1 id="bTitle">${esc(title)}</h1>
        <p id="bSub">${esc(subtitle)}</p>
      </div>
    </div>

    <div class="top-right">
      <!-- Segmented Mode Switcher (Flipbook / Diapositives) -->
      <div class="mode-switch" role="group" aria-label="Mode d'affichage">
        <button type="button" class="mode-btn active" id="btnModeFlipbook" onclick="setViewerMode('flipbook')" title="Mode Flipbook 3D (Livre interactif)">
          <svg class="i" viewBox="0 0 24 24"><path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z"/><path d="M12 6v13"/></svg>
          <span>Flipbook</span>
        </button>
        <button type="button" class="mode-btn" id="btnModeSlides" onclick="setViewerMode('slides')" title="Mode Diapositives (1 page par écran)">
          <svg class="i" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
          <span>Diapositives</span>
        </button>
      </div>

      <span class="pill" id="topCount" aria-label="Page courante">Page 1 / ${total}</span>

      <button type="button" class="icon-btn fs-toggle" title="Plein écran (F)" aria-label="Plein écran" onclick="toggleFullscreen()">
        <svg class="i i-max" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
        <svg class="i i-min" viewBox="0 0 24 24"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
      </button>
    </div>
  </header>

  <!-- ═══════════════════════════════════════════════════ STAGE -->
  <main class="stage" id="stage">
    <button type="button" class="nav prev" id="prev" title="Page précédente (←)" aria-label="Page précédente" onclick="goPrev()">
      <svg class="i" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <div id="viewer-wrap">
      <div id="flipbook-container"></div>
    </div>
    <button type="button" class="nav next" id="next" title="Page suivante (→)" aria-label="Page suivante" onclick="goNext()">
      <svg class="i" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  </main>

  <!-- ═══════════════════════════════════════════════════ TABLE OF CONTENTS -->
  <section class="toc" id="toc" aria-label="Table des matières">
    <div class="toc-head">
      <b>Table des matières</b>
      <span id="tocInfo">${total} pages</span>
    </div>
    <div class="strip" id="strip"></div>
  </section>

  <!-- ═══════════════════════════════════════════════════ DOCK -->
  <div class="dock" id="dock">
    <!-- Floating Pen & Eraser Palette -->
    <div class="pen-panel" id="penPanel" hidden data-tool="pen">
      <div class="colors" id="colors" role="group" aria-label="Couleur du crayon"></div>
      <div class="sizes" id="sizes" role="group" aria-label="Épaisseur du trait">
        <button type="button" class="sz" data-size="2" aria-label="Trait fin" onclick="setDrawingSize(2, this)"><i style="width:5px;height:5px"></i></button>
        <button type="button" class="sz" data-size="5" aria-label="Trait moyen" onclick="setDrawingSize(5, this)"><i style="width:10px;height:10px"></i></button>
        <button type="button" class="sz" data-size="12" aria-label="Trait épais" onclick="setDrawingSize(12, this)"><i style="width:17px;height:17px"></i></button>
      </div>
      <span class="sep" id="penPanelSep"></span>
      <div class="circle-bar-controls" id="circleBarControls">
        <span class="circle-bar-count" id="circleBarCount">0 sélectionnée(s)</span>
        <button type="button" class="circle-bar-btn check" id="circleBarCheckBtn" disabled onclick="submitActivePageCircleExercise()">
          <svg class="i" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          <span>Corriger</span>
        </button>
        <button type="button" class="circle-bar-btn retry" id="circleBarRetryBtn" style="display:none" onclick="retryActivePageCircleExercise()">
          <svg class="i" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>Réessayer</span>
        </button>
      </div>
      <button type="button" class="mini" id="undo" title="Annuler le dernier trait" aria-label="Annuler le dernier trait" onclick="undoLastStroke()">
        <svg class="i" viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-15-6.7L3 13"/></svg>
      </button>
      <button type="button" class="mini" id="clearPages" title="Effacer les annotations de la page" aria-label="Effacer les annotations" onclick="clearActivePageDrawing()">
        <svg class="i" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
      </button>
    </div>

    <!-- Main Navigation & Tools Dock -->
    <nav class="tools" aria-label="Outils du flipbook">
      <button type="button" class="tb" id="tPrev" title="Page précédente (←)" aria-label="Page précédente" onclick="goPrev()">
        <svg class="i" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <span class="count" id="toolCount" aria-live="polite" onclick="promptPage()" title="Cliquer pour aller à une page">1 / ${total}</span>
      <button type="button" class="tb" id="tNext" title="Page suivante (→)" aria-label="Page suivante" onclick="goNext()">
        <svg class="i" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <span class="sep"></span>
      <button type="button" class="tb" id="penBtn" aria-pressed="false" title="Crayon (P)" aria-label="Crayon pour dessiner ou annoter" onclick="toggleViewerTool('pen')">
        <svg class="i" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
      </button>
      <button type="button" class="tb" id="calligraphyBtn" aria-pressed="false" title="Plume Calligraphie (C)" aria-label="Plume de calligraphie fluide" onclick="toggleViewerTool('calligraphy')">
        <svg class="i" viewBox="0 0 24 24"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
      </button>
      <button type="button" class="tb" id="circleBtn" aria-pressed="false" title="Entourer la zone (O)" aria-label="Entourer la réponse correcte" onclick="toggleViewerTool('circle')">
        <svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/></svg>
      </button>
      <button type="button" class="tb" id="eraserBtn" aria-pressed="false" title="Gomme (E)" aria-label="Gomme pour effacer" onclick="toggleViewerTool('eraser')">
        <svg class="i" viewBox="0 0 24 24"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
      </button>
      <button type="button" class="tb" id="loupeBtn" aria-pressed="false" title="Loupe (Z)" aria-label="Loupe grossissante" onclick="toggleViewerTool('loupe')">
        <svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </button>
      <span class="sep"></span>
      <button type="button" class="tb" id="tocBtn" aria-expanded="false" aria-controls="toc" title="Table des matières (T)" aria-label="Table des matières" onclick="toggleToc()">
        <svg class="i" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
      </button>
      <button type="button" class="tb" id="soundBtn" title="Couper le son de page (M)" aria-label="Activer/désactiver le son" onclick="toggleSound()">
        <svg class="i i-sound-on" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        <svg class="i i-sound-off" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
      </button>
      <span class="sep sep-fs"></span>
      <button type="button" class="tb tb-fs fs-toggle" title="Plein écran (F)" aria-label="Plein écran" onclick="toggleFullscreen()">
        <svg class="i i-max" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
        <svg class="i i-min" viewBox="0 0 24 24"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
      </button>
    </nav>
  </div>

  <!-- ═══════════════════════════════════════════════════ TOAST NOTIFICATION -->
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <!-- ═══════════════════════════════════════════════════ CIRCULAR LOUPE LENS -->
  <div id="circular-loupe-lens" class="circular-loupe-lens" style="display:none;"></div>

  <!-- ═══════════════════════════════════════════════════ ZOOM HD MODAL -->
  <div id="image-modal" role="dialog" aria-modal="true" aria-label="Agrandissement HD" onclick="closeModal()">
    <div class="modal-dialog" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 id="zoom-modal-title"><span style="color:var(--brand);margin-right:6px">🔍</span>Zoom Haute Définition</h3>
        <button type="button" class="modal-close-btn" onclick="closeModal()" title="Fermer (Échap)">✕</button>
      </div>
      <div class="modal-body" id="modal-img-wrap">
        <img id="modal-img" src="" alt="Zoom HD" draggable="false" />
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ VIDEO MODAL -->
  <div id="video-modal" role="dialog" aria-modal="true" aria-label="Vidéo YouTube" onclick="closeVideoModal()">
    <div class="modal-dialog" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 id="video-modal-title"><span style="color:#ef4444;margin-right:6px">▶</span>Vidéo YouTube</h3>
        <div style="display:flex; align-items:center; gap:8px;">
          <a id="video-modal-yt-btn" href="#" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:var(--brand); text-decoration:none; display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:8px; background:color-mix(in srgb,var(--brand) 15%,transparent); border:1px solid var(--line);" title="Ouvrir sur YouTube">↗ YouTube</a>
          <button type="button" class="modal-close-btn" onclick="closeVideoModal()" title="Fermer (Échap)">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="video-frame-container">
          <iframe id="video-modal-iframe" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  </div>
</div>
`;
}


export function startViewer(project, options = {}) {
    const base = options.assetBase || '';
    const assetBase = base && !base.endsWith('/') ? base + '/' : base;
    const asset = (p) => (!p || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(p)) ? p : assetBase + String(p).replace(/^\.?\//, '');

    const title = project.title || 'Flipbook';
    const subtitle = project.subtitle || '';
    const total = (project.pages || []).length;
    document.title = title + ' — Flipbook Interactif';
    (options.root || document.body).insertAdjacentHTML('afterbegin', shellHtml(title, subtitle, total));
    const BOOK = project;
    const TOTAL = total;

    let currentPage = 1;
    let soundEnabled = true;
    let pageFlip = null;
    let thumbDrawerOpen = false;
    let currentMode = (project.startMode === 'slides') ? 'slides' : 'flipbook';

    // Audio & Speech State
    let currentAudio = null;
    let playingAudioId = null;
    let currentUtterance = null;

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function normalizePct(val, defaultVal = 0) {
        if (val === undefined || val === null) return defaultVal;
        if (typeof val === 'string') {
            const clean = val.trim();
            const hasPct = clean.includes('%');
            const num = parseFloat(clean);
            if (isNaN(num)) return defaultVal;
            if (hasPct) return num;
            return (num > 0 && num <= 1) ? num * 100 : num;
        }
        const num = Number(val);
        if (isNaN(num)) return defaultVal;
        return (num > 0 && num <= 1) ? num * 100 : num;
    }

    function getTargetBounds(target) {
        if (!target) return { tx: 0, ty: 0, tw: 12, th: 8, cx: 6, cy: 4, rx: 6, ry: 4 };
        const tx = normalizePct(target.x, 0);
        const ty = normalizePct(target.y, 0);
        const tw = normalizePct(target.width !== undefined ? target.width : target.w, 12);
        const th = normalizePct(target.height !== undefined ? target.height : target.h, 8);
        const cx = tx + tw / 2;
        const cy = ty + th / 2;
        // Generous natural padding so circle nicely encloses the selected zone
        const rx = (tw / 2) * 1.08;
        const ry = (th / 2) * 1.08;
        return { tx, ty, tw, th, cx, cy, rx, ry };
    }

    const AUDIO_ICON_SVG = `<img src="${iconUrl}" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" alt="Audio"/>`;

    const ZOOM_LOUPE_SVG = `<svg class="zoom-loupe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
    const YOUTUBE_ICON_SVG = `<svg class="yt-icon-svg" viewBox="0 0 68 48" width="100%" height="100%" style="display:block;pointer-events:none;overflow:visible;" xmlns="http://www.w3.org/2000/svg"><path d="M66.52 7.74c-.78-2.93-3.09-5.24-6.02-6.02C55.22 0 34 0 34 0S12.78 0 7.5 1.72c-2.93.78-5.24 3.09-6.02 6.02C0 13.02 0 24 0 24s0 10.98 1.48 16.26c.78 2.93 3.09 5.24 6.02 6.02C12.78 48 34 48 34 48s21.22 0 26.5-1.72c2.93-.78 5.24-3.09 6.02-6.02C68 34.98 68 24 68 24s0-10.98-1.48-16.26z" fill="#FF0000" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.6"/><path d="M45 24 27 14v20z" fill="#FFFFFF"/></svg>`;

    let ttsKaraokeTimer = null;

    // ═══════════════════════════════════════════════════════════════
    // FBEngine — Moteur interactif TBI (fill-blank + checkbox + score)
    // ═══════════════════════════════════════════════════════════════
    const FBEngine = (function () {
        let scorePanel = null;

        function normalize(str, caseSensitive) {
            const s = str.trim().replace(/\s+/g, ' ');
            return caseSensitive ? s : s.toLowerCase();
        }

        function checkOne(inp) {
            if (!inp) return false;
            const answer = inp.dataset.answer || '';
            const alts = (inp.dataset.alternatives || '').split(';').map(s => s.trim()).filter(Boolean);
            const cs = inp.dataset.caseSensitive === '1';
            const userVal = normalize(inp.value, cs);
            const expected = [normalize(answer, cs), ...alts.map(a => normalize(a, cs))];
            const ok = expected.includes(userVal);
            inp.classList.remove('correct', 'incorrect');
            void inp.offsetWidth;
            inp.classList.add(ok ? 'correct' : 'incorrect');
            if (ok) inp.readOnly = true;
            return ok;
        }

        function validateGroup(groupId) {
            const inputs = Array.from(document.querySelectorAll('.fb-input'))
                .filter(inp => !groupId || inp.dataset.groupId === groupId);
            let correct = 0;
            inputs.forEach(inp => { if (checkOne(inp)) correct++; });
            const checkboxes = Array.from(document.querySelectorAll('.widget-checkbox'))
                .filter(cb => !groupId || cb.dataset.groupId === groupId);
            checkboxes.forEach(cb => {
                const isChecked = cb.dataset.checked === '1';
                const isCorrect = cb.dataset.correct === '1';
                const ok = isChecked === isCorrect;
                cb.classList.remove('validated-correct', 'validated-wrong');
                cb.classList.add(ok ? 'validated-correct' : 'validated-wrong');
                if (ok) correct++;
            });
            showScore(correct, inputs.length + checkboxes.length);
        }

        function revealAnswers(groupId) {
            document.querySelectorAll('.fb-input').forEach(inp => {
                if (!groupId || inp.dataset.groupId === groupId) {
                    inp.value = inp.dataset.answer;
                    inp.classList.remove('incorrect'); inp.classList.add('correct');
                    inp.readOnly = true;
                }
            });
            document.querySelectorAll('.widget-checkbox').forEach(cb => {
                if (!groupId || cb.dataset.groupId === groupId) {
                    const isCorrect = cb.dataset.correct === '1';
                    cb.dataset.checked = isCorrect ? '1' : '0';
                    const box = cb.querySelector('.chk-box');
                    if (box) { box.textContent = isCorrect ? '✓' : ''; box.classList.toggle('checked', isCorrect); }
                    cb.classList.add('validated-correct');
                }
            });
        }

        function resetGroup(groupId) {
            document.querySelectorAll('.fb-input').forEach(inp => {
                if (!groupId || inp.dataset.groupId === groupId) {
                    inp.value = ''; inp.classList.remove('correct', 'incorrect'); inp.readOnly = false;
                }
            });
            document.querySelectorAll('.widget-checkbox').forEach(cb => {
                if (!groupId || cb.dataset.groupId === groupId) {
                    cb.dataset.checked = '0';
                    const box = cb.querySelector('.chk-box');
                    if (box) { box.textContent = ''; box.classList.remove('checked'); }
                    cb.classList.remove('validated-correct', 'validated-wrong');
                }
            });
            if (typeof resetCircleExerciseGroup === 'function') {
                resetCircleExerciseGroup(groupId);
            }
            if (scorePanel) { scorePanel.remove(); scorePanel = null; }
        }


        function playCelebrationChime() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
                    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
                    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.11 + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.38);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.11);
                    osc.stop(ctx.currentTime + idx * 0.11 + 0.4);
                });
            } catch (e) { }
        }

        function playLottieSuccess() {
            const containerId = 'lottie-success-container';
            let c = document.getElementById(containerId);
            if (!c) {
                c = document.createElement('div');
                c.id = containerId;
                c.style.position = 'fixed';
                c.style.inset = '0';
                c.style.pointerEvents = 'none';
                c.style.zIndex = '10010';
                c.style.display = 'flex';
                c.style.alignItems = 'center';
                c.style.justifyContent = 'center';
                document.body.appendChild(c);
            }
            c.innerHTML = '<div id="lottie-success-anim" style="width: 420px; height: 420px; filter: drop-shadow(0 12px 28px rgba(0,0,0,0.6));"></div>';

            playCelebrationChime();

            if (lottie && typeof LOTTIE_SUCCESS_DATA !== 'undefined') {
                try {
                    lottie.loadAnimation({
                        container: document.getElementById('lottie-success-anim'),
                        renderer: 'svg',
                        loop: false,
                        autoplay: true,
                        animationData: LOTTIE_SUCCESS_DATA
                    });
                    setTimeout(() => { if (c) c.innerHTML = ''; }, 3500);
                    return;
                } catch (err) {
                    console.error('Lottie inline error', err);
                }
            }

        }

        function showScore(correct, total) {
            const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
            if (!scorePanel) {
                scorePanel = document.createElement('div');
                scorePanel.className = 'score-panel';
                document.body.appendChild(scorePanel);
            }
            const star = pct === 100 ? ' ⭐' : '';
            if (pct === 100 && total > 0) {
                playLottieSuccess();
            }
            scorePanel.innerHTML =
                '<h4>📊 Score de la page</h4>' +
                '<span class="score-num">' + correct + ' / ' + total + star + '</span>' +
                '<span class="score-sub">' + pct + '% de bonnes reponses</span>' +
                '<div class="score-bar-wrap"><div class="score-bar" style="width:' + pct + '%"></div></div>' +
                '<div class="score-btns">' +
                '<button class="score-btn validate-btn" onclick="FBEngine.validateGroup(\'\')">Corriger</button>' +
                '<button class="score-btn" onclick="FBEngine.revealAnswers(\'\')">Reponses</button>' +
                '<button class="score-btn" onclick="FBEngine.resetGroup(\'\')">Refaire</button>' +
                '</div>';
        }

        return { checkOne, validateGroup, revealAnswers, resetGroup, showScore };
    })();
    window.FBEngine = FBEngine;

    function playSuccessChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.1);
                osc.stop(ctx.currentTime + idx * 0.1 + 0.36);
            });
        } catch (e) { }
    }

    function playErrorTone() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.26);
        } catch (e) { }
    }

    function initDraggableInteraction(dragEl, targetEl, overlayEl, inter) {
        let isDragging = false;
        let isPlaced = false;
        let isAnimating = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        const origXPct = parseFloat(inter.x || 0);
        const origYPct = parseFloat(inter.y || 0);
        const targetXPct = parseFloat(inter.targetX || (origXPct + 15));
        const targetYPct = parseFloat(inter.targetY || origYPct);
        const targetWPct = parseFloat(inter.targetWidth || inter.width || 20);
        const targetHPct = parseFloat(inter.targetHeight || inter.height || 10);
        const itemWPct = parseFloat(inter.width || 20);
        const itemHPct = parseFloat(inter.height || 10);

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            e.stopPropagation();

            const oRect = overlayEl.getBoundingClientRect();
            if (oRect.width <= 0 || oRect.height <= 0) return;

            const deltaX = ((e.clientX - startX) / oRect.width) * 100;
            const deltaY = ((e.clientY - startY) / oRect.height) * 100;

            const currentLeft = Math.max(-10, Math.min(110 - itemWPct, initialLeft + deltaX));
            const currentTop = Math.max(-10, Math.min(110 - itemHPct, initialTop + deltaY));

            dragEl.style.left = currentLeft + '%';
            dragEl.style.top = currentTop + '%';

            // Check proximity to target
            const centerCurX = currentLeft + itemWPct / 2;
            const centerCurY = currentTop + itemHPct / 2;
            const targetCenterX = targetXPct + targetWPct / 2;
            const targetCenterY = targetYPct + targetHPct / 2;

            const isOverTarget = Math.abs(centerCurX - targetCenterX) < Math.max(targetWPct, itemWPct) * 0.85 &&
                                 Math.abs(centerCurY - targetCenterY) < Math.max(targetHPct, itemHPct) * 0.85;

        };

        const handleDrop = (e) => {
            if (!isDragging) return;
            isDragging = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', handleDrop);
            window.removeEventListener('pointercancel', handleDrop);
            try { dragEl.releasePointerCapture(e.pointerId); } catch (err) { }
            dragEl.classList.remove('is-dragging');

            const currentLeft = parseFloat(dragEl.style.left) || origXPct;
            const currentTop = parseFloat(dragEl.style.top) || origYPct;
            const centerCurX = currentLeft + itemWPct / 2;
            const centerCurY = currentTop + itemHPct / 2;
            const targetCenterX = targetXPct + targetWPct / 2;
            const targetCenterY = targetYPct + targetHPct / 2;

            // Tolerance window for correct drop
            const distX = Math.abs(centerCurX - targetCenterX);
            const distY = Math.abs(centerCurY - targetCenterY);
            const isCorrect = distX < Math.max(targetWPct, itemWPct) * 0.9 &&
                              distY < Math.max(targetHPct, itemHPct) * 0.9;

            if (isCorrect) {
                isPlaced = true;
                dragEl.style.transition = 'left 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)';
                dragEl.style.left = targetXPct + '%';
                dragEl.style.top = targetYPct + '%';
                dragEl.classList.add('is-placed');

                playSuccessChime();
                toast('Bravo ! Élément bien placé 🎯');
            } else {
                // Incorrect drop: shake dragged item only, never reveal the target zone
                isAnimating = true;
                dragEl.classList.add('is-wrong');
                playErrorTone();

                // Gentle pause before return animation (300-450ms)
                setTimeout(() => {
                    dragEl.style.transition = 'left 0.38s cubic-bezier(0.25, 0.9, 0.3, 1), top 0.38s cubic-bezier(0.25, 0.9, 0.3, 1)';
                    dragEl.style.left = origXPct + '%';
                    dragEl.style.top = origYPct + '%';

                    setTimeout(() => {
                        dragEl.style.transition = '';
                        dragEl.classList.remove('is-wrong');
                        isAnimating = false;
                    }, 400);
                }, 140);
            }
        };

        dragEl.addEventListener('pointerdown', (e) => {
            if (isPlaced || isAnimating) return;
            if (activeViewerTool !== null && activeViewerTool !== 'none') return;
            e.preventDefault();
            e.stopPropagation();

            try { dragEl.setPointerCapture(e.pointerId); } catch (err) { }

            isDragging = true;
            dragEl.classList.add('is-dragging');
            dragEl.style.transition = 'none';

            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseFloat(dragEl.style.left) || origXPct;
            initialTop = parseFloat(dragEl.style.top) || origYPct;

            window.addEventListener('pointermove', onPointerMove, { passive: false });
            window.addEventListener('pointerup', handleDrop, { passive: false });
            window.addEventListener('pointercancel', handleDrop, { passive: false });
        });
    }

    function stopAllAudio() {
        if (currentAudio) {
            try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) { }
            currentAudio = null;
        }
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            try { window.speechSynthesis.cancel(); } catch (e) { }
        }
        if (ttsKaraokeTimer) {
            clearInterval(ttsKaraokeTimer);
            ttsKaraokeTimer = null;
        }
        document.querySelectorAll('.tts-karaoke-bubble').forEach(b => b.remove());
        document.querySelectorAll('.audio-btn').forEach(b => b.classList.remove('playing'));
        playingAudioId = null;
    }

    function playAudio(id, src) {
        if (playingAudioId === id) {
            stopAllAudio();
            return;
        }
        stopAllAudio();
        try {
            const audio = new Audio(src);
            currentAudio = audio;
            playingAudioId = id;
            const btn = document.getElementById('abtn-' + id);
            if (btn) btn.classList.add('playing');
            audio.onended = () => stopAllAudio();
            audio.onerror = () => stopAllAudio();
            audio.play().catch(() => stopAllAudio());
        } catch (e) {
            stopAllAudio();
        }
    }

    function playTTS(id, text, lang, enableKaraoke = true) {
        if (playingAudioId === id) {
            stopAllAudio();
            return;
        }
        stopAllAudio();
        if (!('speechSynthesis' in window)) {
            alert("Votre navigateur ne supporte pas la synthèse vocale (Web Speech API).");
            return;
        }
        try {
            const btn = document.getElementById('tts-' + id);
            if (btn) btn.classList.add('playing');
            playingAudioId = id;

            // Karaoke bubble creation
            let bubble = null;
            const tokens = [];
            if (enableKaraoke && btn) {
                bubble = document.createElement('div');
                bubble.className = 'tts-karaoke-bubble';
                const re = /\S+/g;
                let match;
                while ((match = re.exec(text)) !== null) {
                    tokens.push({ st: match.index, en: match.index + match[0].length });
                    const span = document.createElement('span');
                    span.className = 'k-word';
                    span.textContent = match[0];
                    bubble.appendChild(span);
                    bubble.appendChild(document.createTextNode(' '));
                }
                btn.appendChild(bubble);
            }

            function highlightWord(targetIdx) {
                if (!bubble) return;
                const spans = bubble.querySelectorAll('.k-word');
                spans.forEach((sp, i) => {
                    if (i < targetIdx) sp.className = 'k-word k-read';
                    else if (i === targetIdx) {
                        sp.className = 'k-word k-active';
                        try { sp.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { }
                    } else sp.className = 'k-word';
                });
            }

            let boundaryFired = false;
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = lang || 'en-US';
            utt.rate = 0.80;
            utt.pitch = 1.0;
            currentUtterance = utt;

            utt.onboundary = (e) => {
                if (e.name === 'word' || e.name === 'sentence') {
                    boundaryFired = true;
                    for (let i = 0; i < tokens.length; i++) {
                        if (e.charIndex >= tokens[i].st && e.charIndex < tokens[i].en) {
                            highlightWord(i);
                            break;
                        }
                    }
                }
            };

            // Timer fallback
            let stepWord = 0;
            setTimeout(() => {
                if (playingAudioId === id && !boundaryFired && tokens.length > 0) {
                    ttsKaraokeTimer = setInterval(() => {
                        if (playingAudioId !== id || boundaryFired) {
                            clearInterval(ttsKaraokeTimer);
                            return;
                        }
                        if (stepWord < tokens.length) {
                            highlightWord(stepWord);
                            stepWord++;
                        } else {
                            clearInterval(ttsKaraokeTimer);
                        }
                    }, 380);
                }
            }, 350);

            utt.onend = () => stopAllAudio();
            utt.onerror = () => stopAllAudio();
            window.speechSynthesis.speak(utt);
        } catch (e) {
            stopAllAudio();
        }
    }

    // Modal zoom state
    let modalZoom = 1;
    let modalTranslate = { x: 0, y: 0 };
    let isDragging = false;
    let dragStart = null;
    let translateAtDrag = { x: 0, y: 0 };
    let pinchStartDist = null;
    let pinchStartZoom = 1;
    const MIN_ZOOM = 0.5, MAX_ZOOM = 5, ZOOM_STEP = 0.25;

    // DOM refs
    const viewerWrap = document.getElementById('viewer-wrap');
    let container = document.getElementById('flipbook-container');
    const modalEl = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');

    function calcDimensions() {
        const stage = document.getElementById('stage') || viewerWrap;
        const sRect = stage ? stage.getBoundingClientRect() : null;
        const winW = (sRect && sRect.width > 200) ? sRect.width : window.innerWidth;
        const winH = (sRect && sRect.height > 200) ? sRect.height : (window.innerHeight - 76);
        const narrow = winW < 768;
        // Keep clear of floating prev/next buttons (42px)
        const sideGap = narrow ? 16 : 84;
        const availW = Math.max(300, winW - sideGap);
        const availH = Math.max(380, winH - 12);
        let RATIO = 0.707;
        if (BOOK && BOOK.canvasPreset && BOOK.canvasPreset.width && BOOK.canvasPreset.height) {
            RATIO = BOOK.canvasPreset.width / BOOK.canvasPreset.height;
        } else if (BOOK && BOOK.pageWidth && BOOK.pageHeight) {
            RATIO = BOOK.pageWidth / BOOK.pageHeight;
        } else if (BOOK && BOOK.pages && BOOK.pages[0] && BOOK.pages[0].width && BOOK.pages[0].height) {
            RATIO = BOOK.pages[0].width / BOOK.pages[0].height;
        }
        const maxByW = (availW - 12) / 2;
        const maxByH = availH * RATIO;
        const w = Math.max(260, Math.floor(Math.min(maxByW, maxByH)));
        const h = Math.max(368, Math.floor(w / RATIO));
        return { w, h };
    }

    function initFlipbook() {
        const { w, h } = calcDimensions();

        if (pageFlip) {
            try { pageFlip.destroy(); } catch (e) { }
            pageFlip = null;
        }

        viewerWrap.innerHTML = '<div id="flipbook-container"></div>';
        container = document.getElementById('flipbook-container');

        container.style.cssText = [
            'width:' + (w * 2) + 'px',
            'height:' + h + 'px',
            'position:relative',
            'margin:0 auto',
            'box-sizing:border-box',
        ].join(';');

        const pageElements = [];
        BOOK.pages.forEach((page, idx) => {
            const div = createPageElement(page, idx);
            container.appendChild(div);
            pageElements.push(div);
        });

        pageFlip = new PageFlip(container, {
            width: w, height: h,
            size: 'fixed',
            minWidth: 280, maxWidth: 1000,
            minHeight: 396, maxHeight: 1400,
            drawShadow: true,
            maxShadowOpacity: 0.45,
            showCover: true,
            usePortrait: false,
            startPage: Math.max(0, currentPage - 1),
            flippingTime: 650,
            disableFlipByClick: true,
            showPageCorners: false,
            mobileScrollSupport: false,
        });

        pageFlip.loadFromHTML(pageElements);

        pageFlip.on('flip', (e) => {
            const newPage = e.data + 1;
            if (newPage !== currentPage) {
                stopAllAudio();
                currentPage = newPage;
                playFlipSound();
                const pData = BOOK.pages[currentPage - 1];
                if (pData && pData.ambientAudio) {
                    playAudio('ambient-' + currentPage, asset(pData.ambientAudio));
                }
                updateUI();
            }
        });

        setupAllAnnotCanvases();
        updateUI();
    }

    function createPageElement(page, idx) {
        const isLeft = (page.pageNumber % 2 === 0);
        const div = document.createElement('div');
        div.className = 'page-item';
        div.dataset.density = (idx === 0 || idx === TOTAL - 1) ? 'hard' : 'soft';

        const pNum = page.pageNumber || (idx + 1);
        const pad3 = String(pNum).padStart(3, '0');

        const img = document.createElement('img');
        img.className = 'page-img';
        img.alt = page.title || `Page ${pNum}`;
        img.loading = 'lazy';

        const candidatePaths = [
            page.imagePath ? asset(page.imagePath) : null,
            asset(`public/pages/page-${pad3}.webp`),
            asset(`public/pages/page_${pNum}.webp`),
            asset(`public/pages/page-${pNum}.webp`),
            asset(`pages/page-${pad3}.webp`),
            asset(`pages/page_${pNum}.webp`),
            asset(`page-${pad3}.webp`),
            asset(`page_${pNum}.webp`),
        ].filter(Boolean);

        let cIdx = 0;
        img.src = candidatePaths[0];

        img.onerror = () => {
            cIdx++;
            if (cIdx < candidatePaths.length) {
                img.src = candidatePaths[cIdx];
            } else {
                if (!div.querySelector('.page-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'page-fallback';
                    fallback.innerHTML = `
                        <span class="page-fallback-badge">Page ${pNum}</span>
                        <h2 style="font-family:'Bricolage Grotesque',sans-serif;font-size:26px;margin:8px 0;">${esc(page.title || `Page ${pNum}`)}</h2>
                        <p style="color:var(--muted);font-size:14px;">${esc(BOOK.title || 'Flipbook')}</p>
                    `;
                    div.appendChild(fallback);
                }
            }
        };
        div.appendChild(img);

        const spine = document.createElement('div');
        spine.className = isLeft ? 'page-spine-left' : 'page-spine-right';
        div.appendChild(spine);

        const overlay = document.createElement('div');
        overlay.className = 'page-overlay';

        (page.interactions || []).forEach((inter, idxInter) => {
            const iId = inter.id || `${page.pageNumber}-${idxInter}`;
            const leftVal = (inter.x !== undefined && inter.x !== null) ? (String(inter.x).includes('%') ? inter.x : (inter.x + '%')) : '50%';
            const topVal = (inter.y !== undefined && inter.y !== null) ? (String(inter.y).includes('%') ? inter.y : (inter.y + '%')) : '50%';

            if (inter.type === 'audio') {
                const btn = document.createElement('button');
                btn.className = 'audio-btn';
                btn.id = 'abtn-' + iId;
                btn.style.left = leftVal;
                btn.style.top = topVal;
                if (inter.size) {
                    btn.style.width = inter.size + 'px';
                    btn.style.height = inter.size + 'px';
                    btn.style.fontSize = Math.max(12, inter.size * 0.45) + 'px';
                }
                btn.setAttribute('aria-label', inter.title || "Écouter l'audio");
                btn.title = inter.title || '';
                btn.innerHTML = `${AUDIO_ICON_SVG}`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playAudio(iId, asset(inter.src));
                });
                overlay.appendChild(btn);
            } else if (inter.type === 'tts') {
                const btn = document.createElement('button');
                btn.className = 'audio-btn tts-btn';
                btn.id = 'tts-' + iId;
                btn.style.left = leftVal;
                btn.style.top = topVal;
                if (inter.size) {
                    btn.style.width = inter.size + 'px';
                    btn.style.height = inter.size + 'px';
                    btn.style.fontSize = Math.max(12, inter.size * 0.45) + 'px';
                }
                btn.setAttribute('aria-label', inter.title || "Écouter le texte");
                btn.title = inter.title || '';
                btn.innerHTML = `${AUDIO_ICON_SVG}`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playTTS(iId, inter.text, inter.lang, inter.karaoke !== false);
                });
                overlay.appendChild(btn);
            } else if (inter.type === 'video') {
                const btn = document.createElement('button');
                btn.className = 'video-btn';
                btn.id = 'vbtn-' + iId;
                btn.style.left = leftVal;
                btn.style.top = topVal;
                if (inter.size) {
                    btn.style.width = inter.size + 'px';
                    btn.style.height = Math.round(inter.size * (34 / 48)) + 'px';
                }
                const hasCustomTitle = inter.title && !/^(?:vid[ée]o\s*youtube)$/i.test(inter.title.trim());
                btn.setAttribute('aria-label', hasCustomTitle ? inter.title : "Regarder la vidéo sur YouTube");
                btn.title = hasCustomTitle ? inter.title : 'Regarder la vidéo sur YouTube';
                btn.innerHTML = `${YOUTUBE_ICON_SVG}`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openVideoModal(inter.youtubeUrl, inter.title);
                });
                overlay.appendChild(btn);
            } else if (inter.type === 'zoom' || inter.type === 'modal') {
                const widthVal = String(inter.width || '40%').includes('%') ? inter.width : (inter.width + '%');
                const heightVal = String(inter.height || '30%').includes('%') ? inter.height : (inter.height + '%');
                const zone = document.createElement('div');
                zone.className = 'zoom-zone';
                zone.style.left = leftVal;
                zone.style.top = topVal;
                zone.style.width = widthVal;
                zone.style.height = heightVal;
                zone.setAttribute('role', 'button');
                zone.setAttribute('aria-label', inter.title || "Agrandir l'image");
                zone.tabIndex = 0;
                zone.title = `🔍 ${escapeHtml(inter.title || 'Zoom HD')} (cliquer pour agrandir)`;
                zone.innerHTML = `<span class="zoom-badge">${ZOOM_LOUPE_SVG}</span>`;
                const openZ = (e) => {
                    e.stopPropagation();
                    openModal(asset(inter.hiresSrc || inter.imageSrc || page.imagePath), inter.title || 'Zoom HD');
                };
                zone.addEventListener('click', openZ);
                zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openZ(e); });
                overlay.appendChild(zone);
            } else if (inter.type === 'fill-blank') {
                const wVal = String(inter.width || '15%').includes('%') ? inter.width : (inter.width + '%');
                const hVal = String(inter.height || '5%').includes('%') ? inter.height : (inter.height + '%');
                const wrap = document.createElement('div');
                wrap.className = 'widget-fill-blank';
                wrap.style.left = leftVal; wrap.style.top = topVal;
                wrap.style.width = wVal; wrap.style.height = hVal;

                const inp = document.createElement('input');
                inp.type = 'text';
                inp.className = 'fb-input';
                inp.placeholder = '...';
                inp.id = 'fb-' + iId;
                inp.dataset.answer = (inter.answer || '').trim();
                inp.dataset.alternatives = inter.acceptAlternatives || '';
                inp.dataset.caseSensitive = inter.caseSensitive ? '1' : '0';
                inp.dataset.groupId = inter.groupId || '';
                inp.setAttribute('autocomplete', 'off');
                inp.addEventListener('click', e => e.stopPropagation());
                inp.addEventListener('keydown', e => {
                    e.stopPropagation();
                    if (e.key === 'Enter') FBEngine.checkOne(inp);
                });
                wrap.appendChild(inp);

                if (inter.hint) {
                    const hBtn = document.createElement('button');
                    hBtn.className = 'fb-hint-btn';
                    hBtn.textContent = '?';
                    hBtn.title = 'Indice';
                    hBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let tip = wrap.querySelector('.fb-hint-tooltip');
                        if (tip) { tip.remove(); return; }
                        tip = document.createElement('div');
                        tip.className = 'fb-hint-tooltip';
                        tip.textContent = inter.hint;
                        wrap.appendChild(tip);
                        setTimeout(() => tip && tip.remove(), 3500);
                    });
                    wrap.appendChild(hBtn);
                }
                overlay.appendChild(wrap);
            } else if (inter.type === 'reveal') {
                const wVal = String(inter.width || '25%').includes('%') ? inter.width : (inter.width + '%');
                const hVal = String(inter.height || '5%').includes('%') ? inter.height : (inter.height + '%');

                if (inter.revealText) {
                    const textDiv = document.createElement('div');
                    textDiv.className = 'widget-reveal-text';
                    textDiv.id = 'rev-text-' + iId;
                    textDiv.style.left = leftVal; textDiv.style.top = topVal;
                    textDiv.style.width = wVal; textDiv.style.height = hVal;
                    textDiv.textContent = inter.revealText;
                    overlay.appendChild(textDiv);
                }

                const mask = document.createElement('div');
                mask.className = 'widget-reveal';
                mask.id = 'rev-' + iId;
                mask.style.left = leftVal; mask.style.top = topVal;
                mask.style.width = wVal; mask.style.height = hVal;
                mask.style.background = inter.coverColor || '#f59e0b';
                mask.textContent = inter.coverLabel || '💡 Cliquer pour révéler';
                mask.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mask.classList.add('revealed');
                    const rt = document.getElementById('rev-text-' + iId);
                    if (rt) rt.classList.add('visible');
                    if (inter.revealAudio) {
                        try { new Audio(asset(inter.revealAudio)).play().catch(() => { }); } catch (e) { }
                    }
                });
                overlay.appendChild(mask);
            } else if (inter.type === 'checkbox-task') {
                const cb = document.createElement('div');
                cb.className = 'widget-checkbox';
                cb.id = 'chk-' + iId;
                cb.style.left = leftVal; cb.style.top = topVal;
                if (inter.size) {
                    cb.style.width = inter.size + 'px';
                    cb.style.height = inter.size + 'px';
                    cb.style.fontSize = Math.max(14, inter.size * 0.5) + 'px';
                }
                cb.dataset.correct = inter.isCorrect ? '1' : '0';
                cb.dataset.groupId = inter.groupId || '';
                cb.dataset.checked = '0';
                if (inter.hideLabel) {
                    cb.style.padding = '2px';
                    cb.style.gap = '0';
                    cb.innerHTML = `<div class="chk-box" id="chkbox-${iId}"></div>`;
                } else {
                    cb.innerHTML = `<div class="chk-box" id="chkbox-${iId}"></div><span class="chk-label">${escapeHtml(inter.label || '')}</span>`;
                }
                cb.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isChecked = cb.dataset.checked === '1';
                    cb.dataset.checked = isChecked ? '0' : '1';
                    const box = cb.querySelector('.chk-box');
                    if (box) {
                        box.textContent = isChecked ? '' : '✓';
                        box.classList.toggle('checked', !isChecked);
                    }
                });
                overlay.appendChild(cb);
            } else if (inter.type === 'highlight') {
                const wVal = String(inter.width || '20%').includes('%') ? inter.width : (inter.width + '%');
                const hVal = String(inter.height || '4%').includes('%') ? inter.height : (inter.height + '%');
                const hDiv = document.createElement('div');
                hDiv.className = 'widget-highlight-zone';
                hDiv.id = 'hl-' + iId;
                hDiv.style.left = leftVal; hDiv.style.top = topVal;
                hDiv.style.width = wVal; hDiv.style.height = hVal;
                hDiv.style.position = 'absolute';
                hDiv.style.backgroundColor = inter.color || 'rgba(250, 204, 21, 0.4)';
                hDiv.style.borderRadius = '4px';
                hDiv.style.pointerEvents = 'auto';
                if (inter.note) {
                    hDiv.title = inter.note;
                }
                overlay.appendChild(hDiv);
            } else if (inter.type === 'lasso') {
                const lDiv = document.createElement('div');
                lDiv.className = 'widget-lasso-zone';
                lDiv.id = 'lasso-' + iId;
                lDiv.style.left = leftVal; lDiv.style.top = topVal;
                const wVal = inter.width ? (String(inter.width).includes('%') ? inter.width : (inter.width + '%')) : '20%';
                const hVal = inter.height ? (String(inter.height).includes('%') ? inter.height : (inter.height + '%')) : '10%';
                lDiv.style.width = wVal; lDiv.style.height = hVal;
                lDiv.style.position = 'absolute';
                lDiv.style.border = `2px dashed ${inter.color || '#a78bfa'}`;
                lDiv.style.backgroundColor = 'rgba(167, 139, 250, 0.15)';
                lDiv.style.borderRadius = '8px';
                lDiv.style.pointerEvents = 'auto';
                if (inter.text) {
                    lDiv.title = inter.text;
                    lDiv.style.cursor = 'pointer';
                    lDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playTTS(iId, inter.text, inter.lang || 'fr-FR', true);
                    });
                }
                overlay.appendChild(lDiv);
            } else if (inter.type === 'score-button' || inter.type === 'button') {
                const btn = document.createElement('button');
                btn.className = 'widget-score-btn';
                btn.id = 'btn-score-' + iId;
                btn.style.left = leftVal; btn.style.top = topVal;
                const wVal = inter.width ? (String(inter.width).includes('%') ? inter.width : (inter.width + '%')) : 'auto';
                const hVal = inter.height ? (String(inter.height).includes('%') ? inter.height : (inter.height + '%')) : 'auto';
                btn.style.width = wVal; btn.style.height = hVal;
                btn.style.position = 'absolute';
                btn.style.padding = '6px 14px';
                btn.style.borderRadius = '8px';
                btn.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
                btn.style.color = '#fff';
                btn.style.fontWeight = 'bold';
                btn.style.fontSize = '12px';
                btn.style.border = 'none';
                btn.style.cursor = 'pointer';
                btn.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                btn.textContent = inter.label || 'Corriger';
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    FBEngine.validateGroup(inter.groupId || '');
                });
                overlay.appendChild(btn);
            } else if (inter.type === 'drag-drop') {
                const wVal = String(inter.width || '18%').includes('%') ? inter.width : (inter.width + '%');
                const hVal = String(inter.height || '10%').includes('%') ? inter.height : (inter.height + '%');
                const tLeft = String(inter.targetX || '50%').includes('%') ? inter.targetX : (inter.targetX + '%');
                const tTop = String(inter.targetY || '50%').includes('%') ? inter.targetY : (inter.targetY + '%');
                const tWidth = String(inter.targetWidth || inter.width || '18%').includes('%') ? (inter.targetWidth || inter.width) : ((inter.targetWidth || inter.width) + '%');
                const tHeight = String(inter.targetHeight || inter.height || '10%').includes('%') ? (inter.targetHeight || inter.height) : ((inter.targetHeight || inter.height) + '%');

                // 1. Mask original artwork underneath
                const maskDiv = document.createElement('div');
                maskDiv.className = 'dnd-mask-layer';
                maskDiv.id = 'mask-' + iId;
                maskDiv.style.left = leftVal;
                maskDiv.style.top = topVal;
                maskDiv.style.width = wVal;
                maskDiv.style.height = hVal;
                maskDiv.style.backgroundColor = inter.maskColor || '#ffffff';
                if (inter.maskPadding) {
                    maskDiv.style.margin = `-${inter.maskPadding}px`;
                    maskDiv.style.padding = `${inter.maskPadding}px`;
                }
                overlay.appendChild(maskDiv);

                // 2. Target Drop Zone
                const targetDiv = document.createElement('div');
                targetDiv.className = 'dnd-target-zone';
                targetDiv.id = 'target-' + iId;
                targetDiv.style.left = tLeft;
                targetDiv.style.top = tTop;
                targetDiv.style.width = tWidth;
                targetDiv.style.height = tHeight;
                targetDiv.setAttribute('data-target-id', iId);
                targetDiv.innerHTML = '';
                overlay.appendChild(targetDiv);

                // 3. Draggable movable element
                const dragDiv = document.createElement('div');
                dragDiv.className = 'dnd-draggable';
                dragDiv.id = 'drag-' + iId;
                dragDiv.style.left = leftVal;
                dragDiv.style.top = topVal;
                dragDiv.style.width = wVal;
                dragDiv.style.height = hVal;
                dragDiv.setAttribute('tabindex', '0');
                dragDiv.setAttribute('role', 'button');
                dragDiv.setAttribute('aria-label', inter.label || 'Élément mobile à déplacer');

                if (inter.artworkUrl) {
                    const img = document.createElement('img');
                    img.src = asset(inter.artworkUrl);
                    img.alt = inter.label || 'Élément déplaçable';
                    img.draggable = false;
                    img.className = 'dnd-artwork-img';
                    dragDiv.appendChild(img);
                } else {
                    const chip = document.createElement('span');
                    chip.className = 'dnd-chip-label';
                    chip.textContent = inter.label || inter.title || 'Élément';
                    dragDiv.appendChild(chip);
                }

                initDraggableInteraction(dragDiv, targetDiv, overlay, inter);
                overlay.appendChild(dragDiv);
            } else if (inter.type === 'circle-exercise') {
                const circleOption = document.createElement('div');
                circleOption.className = 'widget-circle-option';
                circleOption.id = 'circle-opt-' + iId;
                const bounds = getTargetBounds(inter);
                circleOption.style.left = bounds.tx + '%';
                circleOption.style.top = bounds.ty + '%';
                circleOption.style.width = bounds.tw + '%';
                circleOption.style.height = bounds.th + '%';
                circleOption.setAttribute('data-target-id', iId);
                circleOption.setAttribute('data-qid', inter.questionId || inter.groupId || 'q1');
                circleOption.setAttribute('role', 'button');
                circleOption.setAttribute('tabindex', '0');
                circleOption.setAttribute('aria-label', inter.label || inter.title || 'Option à entourer');

                const onSelect = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    selectCircleOption(page.pageNumber, inter);
                };
                circleOption.addEventListener('click', onSelect);
                circleOption.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                });
                circleOption.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(e);
                    }
                });

                overlay.appendChild(circleOption);
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                openModal(asset(page.imagePath), page.title || `Page ${page.pageNumber}`);
            }
        });

        const num = document.createElement('div');
        num.className = 'page-num ' + (isLeft ? 'left' : 'right');
        num.textContent = page.pageNumber;
        div.appendChild(num);

        const annotCanvas = document.createElement('canvas');
        annotCanvas.className = 'page-annot-canvas';
        annotCanvas.setAttribute('data-page', page.pageNumber);
        div.appendChild(annotCanvas);

        // Dedicated SVG vector layer for Circle the Correct Zone feature
        const circleSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        circleSvg.setAttribute('class', 'page-circle-layer');
        circleSvg.setAttribute('data-page', page.pageNumber);
        circleSvg.setAttribute('viewBox', '0 0 1000 1000');
        circleSvg.setAttribute('preserveAspectRatio', 'none');
        div.appendChild(circleSvg);

        // Initialize circle exercise state and render circles if any
        const circleTargets = getCircleTargetsForPage(page.pageNumber);
        if (circleTargets.length > 0) {
            const pNum = String(page.pageNumber);
            getOrCreateCirclePageState(pNum);
            setTimeout(() => {
                renderPageCircles(pNum);
                updateCircleBarUI();
            }, 0);
        }

        div.appendChild(overlay);
        return div;
    }

    function initSlidesView() {
        const stage = document.getElementById('stage') || viewerWrap;
        const r = stage ? stage.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight - 76 };
        const narrow = r.width < 700;
        const side = narrow ? 16 : 56;
        const availW = Math.max(280, r.width - side * 2);
        const availH = Math.max(360, r.height - (narrow ? 12 : 20));
        let RATIO = 0.707;
        if (BOOK && BOOK.canvasPreset && BOOK.canvasPreset.width && BOOK.canvasPreset.height) {
            RATIO = BOOK.canvasPreset.width / BOOK.canvasPreset.height;
        } else if (BOOK && BOOK.pageWidth && BOOK.pageHeight) {
            RATIO = BOOK.pageWidth / BOOK.pageHeight;
        } else if (BOOK && BOOK.pages && BOOK.pages[0] && BOOK.pages[0].width && BOOK.pages[0].height) {
            RATIO = BOOK.pages[0].width / BOOK.pages[0].height;
        }
        const slideW = Math.max(280, Math.min(availW, Math.floor(availH * RATIO)));
        const slideH = Math.floor(slideW / RATIO);

        if (pageFlip) {
            try { pageFlip.destroy(); } catch (e) { }
            pageFlip = null;
        }

        viewerWrap.innerHTML = '<div id="flipbook-container" class="slides-container"></div>';
        container = document.getElementById('flipbook-container');
        container.style.width = slideW + 'px';
        container.style.height = slideH + 'px';
        container.style.position = 'relative';
        container.style.margin = '0 auto';

        const targetPage = BOOK.pages[currentPage - 1] || BOOK.pages[0];
        if (targetPage) {
            const div = createPageElement(targetPage, currentPage - 1);
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.position = 'relative';
            div.style.display = 'block';
            div.style.visibility = 'visible';
            container.appendChild(div);
            setupAllAnnotCanvases();
        }

        updateUI();
    }

    function syncModeButtons() {
        const btnF = document.getElementById('btnModeFlipbook');
        const btnS = document.getElementById('btnModeSlides');
        if (btnF) btnF.classList.toggle('active', currentMode === 'flipbook');
        if (btnS) btnS.classList.toggle('active', currentMode === 'slides');
    }

    window.setViewerMode = function (mode) {
        if (mode === currentMode) return;
        currentMode = mode;
        stopAllAudio();
        syncModeButtons();
        if (currentMode === 'slides') {
            initSlidesView();
            toast('Mode Diapositives activé (1 page par écran)');
        } else {
            initFlipbook();
            toast('Mode Flipbook activé (Livre 3D interactif)');
        }
        updateUI();
    };

    window.toggleViewMode = () => {
        window.setViewerMode(currentMode === 'flipbook' ? 'slides' : 'flipbook');
    };

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const savedPage = currentPage;
            if (currentMode === 'slides') {
                initSlidesView();
            } else {
                initFlipbook();
                if (pageFlip && savedPage > 1) {
                    if (savedPage >= TOTAL) {
                        pageFlip.flip(TOTAL - 1);
                    } else {
                        const targetIdx = (savedPage % 2 === 0) ? (savedPage - 1) : (savedPage - 2);
                        pageFlip.flip(Math.max(0, targetIdx));
                    }
                }
            }
        }, 250);
    });

    // Navigation API
    window.goPrev = () => {
        if (currentMode === 'slides') {
            if (currentPage > 1) window.goToPage(currentPage - 1);
        } else {
            pageFlip && pageFlip.flipPrev();
        }
    };
    window.goNext = () => {
        if (currentMode === 'slides') {
            if (currentPage < TOTAL) window.goToPage(currentPage + 1);
        } else {
            pageFlip && pageFlip.flipNext();
        }
    };
    window.goFirst = () => {
        if (currentMode === 'slides') {
            window.goToPage(1);
        } else {
            pageFlip && pageFlip.flip(0);
        }
    };
    window.goLast = () => {
        if (currentMode === 'slides') {
            window.goToPage(TOTAL);
        } else {
            pageFlip && pageFlip.flip(TOTAL - 1);
        }
    };
    window.goToPage = (pageNum) => {
        pageNum = Math.max(1, Math.min(TOTAL, parseInt(pageNum, 10) || 1));
        if (currentMode === 'slides') {
            if (pageNum !== currentPage) {
                stopAllAudio();
                currentPage = pageNum;
                playFlipSound();
                initSlidesView();
                const pData = BOOK.pages[currentPage - 1];
                if (pData && pData.ambientAudio) {
                    playAudio('ambient-' + currentPage, asset(pData.ambientAudio));
                }
            }
            return;
        }
        if (!pageFlip) return;
        if (pageNum === 1) {
            pageFlip.flip(0);
        } else if (pageNum === TOTAL) {
            pageFlip.flip(TOTAL - 1);
        } else {
            const targetIdx = (pageNum % 2 === 0) ? (pageNum - 1) : (pageNum - 2);
            pageFlip.flip(Math.max(0, Math.min(TOTAL - 1, targetIdx)));
        }
    };
    window.promptPage = () => {
        const val = prompt(`Go to page (1 - ${TOTAL}) / Aller à la page (1 - ${TOTAL}) :`, currentPage);
        if (val === null) return;
        const n = parseInt(val, 10);
        if (!isNaN(n) && n >= 1 && n <= TOTAL) window.goToPage(n);
    };

    // ── ANNOTATION & DYNAMIC LOUPE ENGINE (WHITEBOARD / LOUPE) ──
    let activeViewerTool = null; // 'pen', 'calligraphy', 'circle', 'eraser', 'loupe', null
    let currentAnnotColor = '#0ea5e9';
    let currentAnnotSize = 2.5;
    const pageDrawingsCache = {}; // pageNum -> dataURL
    const pageHistory = {}; // pageNum -> Array of dataURL
    let isAnnotDrawing = false;
    let activeDrawingCanvas = null;
    let activeDrawingCtx = null;
    let annotStartX = 0;
    let annotStartY = 0;
    let annotLastTime = 0;
    let annotLastX = 0;
    let annotLastY = 0;
    let circlePoints = [];
    let circlePrevData = null;
    let circleSnapshot = null;

    // ══════════════════════════════════════════════════════════════════════════════
    // FEATURE 2: CIRCLE THE CORRECT ZONE STATE & EVALUATION ENGINE
    // ══════════════════════════════════════════════════════════════════════════════
    const circleExerciseState = {}; // pageNum -> { questions: { qId: { id, title, mode, tolerance, requireAll, strictSelection, targets, state, attempt, circles } } }

    function getCircleTargetsForPage(pNum) {
        const pIdx = parseInt(pNum, 10) - 1;
        const pageData = BOOK && BOOK.pages ? BOOK.pages[pIdx] : null;
        if (!pageData) return [];
        let list = (pageData.interactions || []).filter(i => i.type === 'circle-exercise');
        if (list.length === 0 && pageData.items) {
            list = pageData.items.filter(i => i.type === 'circle-exercise');
        }
        return list;
    }

    function getOrCreateCirclePageState(pNum) {
        if (!circleExerciseState[pNum]) {
            const targets = getCircleTargetsForPage(pNum);
            const questions = {};

            targets.forEach(t => {
                const qId = t.questionId || t.groupId || 'q1';
                if (!questions[qId]) {
                    questions[qId] = {
                        id: qId,
                        title: t.questionTitle || ('Question ' + (qId.replace(/^q/i, '') || '1')),
                        mode: 'single',
                        tolerance: t.tolerance !== undefined ? parseFloat(t.tolerance) : 0.5,
                        requireAll: false,
                        strictSelection: true,
                        targets: [],
                        state: 'ready', // 'ready' | 'drawing' | 'selecting' | 'correcting' | 'correct' | 'incorrect' | 'retry'
                        attempt: 1,
                        circles: [] // Array of { id, questionId, cx, cy, rx, ry, status, attempt }
                    };
                }
                questions[qId].mode = 'single';
                if (t.tolerance !== undefined) questions[qId].tolerance = parseFloat(t.tolerance);
                questions[qId].targets.push(t);
            });

            circleExerciseState[pNum] = {
                questions: questions,
                get targets() {
                    const allT = [];
                    Object.values(questions).forEach(q => allT.push(...q.targets));
                    return allT;
                },
                get circles() {
                    const allC = [];
                    Object.values(questions).forEach(q => allC.push(...q.circles));
                    return allC;
                }
            };
        }
        return circleExerciseState[pNum];
    }

    function selectCircleOption(pNum, target) {
        if (!target) return;
        const pStr = String(pNum);
        const pState = getOrCreateCirclePageState(pStr);
        const qId = target.questionId || target.groupId || 'q1';
        const q = pState.questions[qId];
        if (!q) return;

        // If clicking the option that is currently selected in this question, toggle it off to allow reset
        const currentActiveCircle = q.circles.length > 0 ? q.circles[0] : null;
        if (currentActiveCircle && currentActiveCircle.targetId === target.id) {
            q.circles = [];
            q.state = 'ready';
            renderPageCircles(pStr);
            updateCircleBarUI();
            return;
        }

        const bounds = getTargetBounds(target);
        const cxPct = bounds.cx;
        const cyPct = bounds.cy;
        const rxPct = bounds.rx;
        const ryPct = bounds.ry;

        // Cancel multiple choice: only one circle per question, replaces prior selection
        q.mode = 'single';
        q.circles = [];

        const isCorrect = (target.isCorrect !== false);
        const newCircle = {
            id: 'circle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            questionId: q.id,
            targetId: target.id,
            cx: cxPct,
            cy: cyPct,
            rx: rxPct,
            ry: ryPct,
            status: isCorrect ? 'correct' : 'incorrect',
            attempt: q.attempt || 1,
        };
        q.circles.push(newCircle);
        q.state = isCorrect ? 'correct' : 'incorrect';

        renderPageCircles(pStr);
        updateCircleBarUI();

        if (isCorrect) {
            playCelebrationChime();
            toast('Bonne réponse ! 🎯');
        } else {
            q.attempt = (q.attempt || 1) + 1;
            playErrorTone();
            toast('Ce n\'est pas la bonne réponse, réessaie ! ❌');
        }
    }
    window.selectCircleOption = selectCircleOption;

    function checkCircleMatchesTarget(cxPct, cyPct, rxPct, ryPct, t) {
        const bounds = getTargetBounds(t);
        const tx = bounds.tx;
        const ty = bounds.ty;
        const tw = bounds.tw;
        const th = bounds.th;
        const tcx = bounds.cx;
        const tcy = bounds.cy;

        const sx1 = cxPct - rxPct;
        const sx2 = cxPct + rxPct;
        const sy1 = cyPct - ryPct;
        const sy2 = cyPct + ryPct;

        const ix1 = Math.max(sx1, tx);
        const ix2 = Math.min(sx2, tx + tw);
        const iy1 = Math.max(sy1, ty);
        const iy2 = Math.min(sy2, ty + th);

        const interW = Math.max(0, ix2 - ix1);
        const interH = Math.max(0, iy2 - iy1);
        const interArea = interW * interH;
        const targetArea = tw * th;
        const overlap = targetArea > 0 ? (interArea / targetArea) : 0;

        const dist = Math.hypot(cxPct - tcx, cyPct - tcy);
        const maxAllowedDist = Math.max(tw, th) * 0.95;
        const tolerance = t.tolerance !== undefined ? parseFloat(t.tolerance) : 0.5;

        // Check if student circle contains target center
        const containsCenter = (cxPct - rxPct * 1.05 <= tcx && cxPct + rxPct * 1.05 >= tcx &&
                                cyPct - ryPct * 1.05 <= tcy && cyPct + ryPct * 1.05 >= tcy);

        if (containsCenter && overlap >= tolerance * 0.45) return true;
        if (overlap >= tolerance * 0.6 && dist <= maxAllowedDist) return true;
        if (dist <= Math.min(tw, th) * 0.5 && overlap >= 0.25) return true;

        return false;
    }

    function findQuestionForCircle(pNum, cxPct, cyPct, rxPct, ryPct) {
        const pState = getOrCreateCirclePageState(pNum);
        const questions = Object.values(pState.questions);
        if (questions.length === 0) return null;
        if (questions.length === 1) return questions[0];

        let matchedQ = null;
        let minCenterDist = Infinity;
        let closestQ = questions[0];

        for (const q of questions) {
            for (const t of q.targets) {
                const bounds = getTargetBounds(t);
                const tcx = bounds.cx;
                const tcy = bounds.cy;
                const dist = Math.hypot(cxPct - tcx, cyPct - tcy);

                if (dist < minCenterDist) {
                    minCenterDist = dist;
                    closestQ = q;
                }

                if (checkCircleMatchesTarget(cxPct, cyPct, rxPct, ryPct, t)) {
                    matchedQ = q;
                    break;
                }
            }
            if (matchedQ) break;
        }

        return matchedQ || closestQ;
    }

    function renderPageCircles(pNum) {
        const pState = circleExerciseState[pNum];
        const svgLayers = document.querySelectorAll(`.page-circle-layer[data-page="${pNum}"]`);
        svgLayers.forEach(svg => {
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            if (!pState || !pState.questions) return;

            Object.values(pState.questions).forEach(q => {
                if (!q.circles) return;
                q.circles.forEach(c => {
                    const cxPct = normalizePct(c.cx, 50);
                    const cyPct = normalizePct(c.cy, 50);
                    const rxPct = normalizePct(c.rx, 5);
                    const ryPct = normalizePct(c.ry, 4);

                    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                    ellipse.setAttribute('class', `student-circle ${c.status || 'neutral'}`);
                    ellipse.setAttribute('data-id', c.id);
                    ellipse.setAttribute('data-qid', q.id);
                    ellipse.setAttribute('cx', (cxPct * 10).toFixed(1));
                    ellipse.setAttribute('cy', (cyPct * 10).toFixed(1));
                    ellipse.setAttribute('rx', (rxPct * 10).toFixed(1));
                    ellipse.setAttribute('ry', (ryPct * 10).toFixed(1));
                    svg.appendChild(ellipse);
                });
            });
        });
    }

    function getActiveVisiblePages() {
        if (currentMode === 'slides' || currentPage === 1 || currentPage === TOTAL) {
            return [String(currentPage)];
        }
        const left = (currentPage % 2 === 0) ? currentPage : (currentPage - 1);
        const right = Math.min(TOTAL, left + 1);
        return [String(left), String(right)];
    }

    function getActiveMultipleChoiceQuestion() {
        const pages = getActiveVisiblePages();
        for (const pNum of pages) {
            const pState = getOrCreateCirclePageState(pNum);
            if (pState && pState.questions) {
                const list = Object.values(pState.questions).filter(q => q.mode === 'multiple');
                if (list.length > 0) {
                    const uncompleted = list.find(q => q.state !== 'correct');
                    return { pNum, question: uncompleted || list[0] };
                }
            }
        }
        return null;
    }

    function updateCircleBarUI() {
        const panel = document.getElementById('penPanel');
        const undoBtn = document.getElementById('undo');
        const clearBtn = document.getElementById('clearPages');
        const circleControls = document.getElementById('circleBarControls');
        const checkBtn = document.getElementById('circleBarCheckBtn');
        const retryBtn = document.getElementById('circleBarRetryBtn');
        const countPill = document.getElementById('circleBarCount');

        if (!panel) return;

        if (activeViewerTool !== 'circle') {
            if (circleControls) circleControls.style.display = 'none';
            if (undoBtn) {
                undoBtn.disabled = false;
                undoBtn.title = "Annuler le dernier trait";
            }
            if (clearBtn) {
                clearBtn.disabled = false;
                clearBtn.title = "Effacer les annotations de la page";
            }
            return;
        }

        // Circle tool active
        if (circleControls) circleControls.style.display = 'flex';

        const pages = getActiveVisiblePages();
        let currentQ = null;
        let currentPNum = null;
        for (const pNum of pages) {
            const pState = getOrCreateCirclePageState(pNum);
            if (pState && pState.questions) {
                const sq = Object.values(pState.questions)[0];
                if (sq) { currentQ = sq; currentPNum = pNum; break; }
            }
        }

        if (checkBtn) checkBtn.style.display = 'none';

        if (currentQ) {
            if (countPill) {
                countPill.style.display = 'inline-block';
                if (currentQ.state === 'correct') {
                    countPill.textContent = 'Réussi ! 🎯';
                } else if (currentQ.state === 'incorrect') {
                    countPill.textContent = 'Incorrect';
                } else {
                    countPill.textContent = 'Cliquez sur l\'option';
                }
            }

            if (retryBtn) {
                retryBtn.style.display = (currentQ.state === 'incorrect') ? 'inline-flex' : 'none';
            }
        } else {
            if (countPill) countPill.style.display = 'none';
            if (retryBtn) retryBtn.style.display = 'none';
        }

        if (undoBtn) {
            undoBtn.disabled = true;
            undoBtn.title = "Annuler non disponible";
        }
        if (clearBtn) {
            clearBtn.disabled = !currentQ || !currentQ.circles || currentQ.circles.length === 0;
            clearBtn.title = "Effacer la sélection";
        }
    }

    function updateCircleExerciseUI(pNum) {
        updateCircleBarUI();
    }

    function resetCircleExerciseGroup(groupId) {
        Object.keys(circleExerciseState).forEach(pNum => {
            const pState = circleExerciseState[pNum];
            if (pState && pState.questions) {
                let changed = false;
                Object.values(pState.questions).forEach(q => {
                    if (!groupId || q.id === groupId || q.targets.some(t => t.groupId === groupId)) {
                        q.circles = [];
                        q.state = 'ready';
                        q.attempt = 1;
                        changed = true;
                    }
                });
                if (changed) {
                    renderPageCircles(pNum);
                    updateCircleExerciseUI(pNum);
                }
            }
        });
    }

    window.submitCircleQuestion = function (pNum, qId) {
        const pState = circleExerciseState[pNum];
        if (!pState || !pState.questions || !pState.questions[qId]) return;
        const q = pState.questions[qId];
        if (!q || q.circles.length === 0) return;

        const correctTargets = q.targets.filter(t => t.isCorrect !== false);
        const distractorTargets = q.targets.filter(t => t.isCorrect === false);

        const matchedCorrectTargetIndices = new Set();
        const matchedCircleIds = new Set();
        const selectedDistractorIndices = new Set();

        correctTargets.forEach((t, tIdx) => {
            let bestCircle = null;
            q.circles.forEach(c => {
                if (!matchedCircleIds.has(c.id)) {
                    if (checkCircleMatchesTarget(c.cx, c.cy, c.rx, c.ry, t)) {
                        bestCircle = c;
                    }
                }
            });
            if (bestCircle) {
                matchedCorrectTargetIndices.add(tIdx);
                matchedCircleIds.add(bestCircle.id);
            }
        });

        distractorTargets.forEach((dt, dtIdx) => {
            q.circles.forEach(c => {
                if (checkCircleMatchesTarget(c.cx, c.cy, c.rx, c.ry, dt)) {
                    selectedDistractorIndices.add(dtIdx);
                    matchedCircleIds.add(c.id);
                }
            });
        });

        const unmatchedCirclesCount = q.circles.length - matchedCircleIds.size;
        const allCorrectMatched = matchedCorrectTargetIndices.size === correctTargets.length;
        const noDistractors = selectedDistractorIndices.size === 0;
        const noExtraneous = unmatchedCirclesCount === 0;

        let isFullyCorrect = false;
        if (q.requireAll && q.strictSelection) {
            isFullyCorrect = allCorrectMatched && noDistractors && noExtraneous;
        } else if (q.requireAll && !q.strictSelection) {
            isFullyCorrect = allCorrectMatched && noDistractors;
        } else if (!q.requireAll && q.strictSelection) {
            isFullyCorrect = matchedCorrectTargetIndices.size > 0 && noDistractors && noExtraneous;
        } else {
            isFullyCorrect = matchedCorrectTargetIndices.size > 0 && noDistractors;
        }

        if (isFullyCorrect) {
            q.circles.forEach(c => { c.status = 'correct'; });
            q.state = 'correct';
            renderPageCircles(pNum);
            updateCircleExerciseUI(pNum);
            playCelebrationChime();
            toast('Bravo ! ' + (q.title ? q.title + ' : ' : '') + 'Toutes les réponses sont correctes ! 🎯');
        } else {
            q.circles.forEach(c => { c.status = 'incorrect'; });
            q.state = 'incorrect';
            renderPageCircles(pNum);
            updateCircleExerciseUI(pNum);
            playErrorTone();
            toast((q.title ? q.title + ' : ' : '') + 'Certaines réponses sont incorrectes ou incomplètes. Réessayez !');
        }
    };

    window.submitActivePageCircleExercise = function () {
        const pages = getActiveVisiblePages();
        let submitted = false;
        pages.forEach(pNum => {
            const pState = getOrCreateCirclePageState(pNum);
            if (pState && pState.questions) {
                Object.values(pState.questions).forEach(q => {
                    if (q.mode === 'multiple' && q.state !== 'correct' && q.circles && q.circles.length > 0) {
                        window.submitCircleQuestion(pNum, q.id);
                        submitted = true;
                    }
                });
            }
        });
        if (!submitted) {
            const active = getActiveMultipleChoiceQuestion();
            if (active) {
                window.submitCircleQuestion(active.pNum, active.question.id);
            }
        }
        updateCircleBarUI();
    };

    window.retryActivePageCircleExercise = function () {
        const pages = getActiveVisiblePages();
        pages.forEach(pNum => {
            const pState = getOrCreateCirclePageState(pNum);
            if (pState && pState.questions) {
                Object.values(pState.questions).forEach(q => {
                    if (q.mode === 'multiple' && q.state === 'incorrect') {
                        window.retryCircleQuestion(pNum, q.id);
                    }
                });
            }
        });
        updateCircleBarUI();
    };

    window.retryCircleQuestion = function (pNum, qId) {
        const pState = circleExerciseState[pNum];
        if (!pState || !pState.questions || !pState.questions[qId]) return;
        const q = pState.questions[qId];
        q.circles = [];
        q.attempt++;
        q.state = 'retry';
        renderPageCircles(pNum);
        updateCircleBarUI();
        toast((q.title ? q.title + ' : ' : '') + 'Nouvel essai : entourez à nouveau vos réponses.');
    };

    window.restartCircleQuestion = function (pNum, qId) {
        const pState = circleExerciseState[pNum];
        if (!pState || !pState.questions || !pState.questions[qId]) return;
        const q = pState.questions[qId];
        q.circles = [];
        q.attempt++;
        q.state = 'ready';
        renderPageCircles(pNum);
        updateCircleBarUI();
        toast((q.title ? q.title + ' : ' : '') + 'Exercice réinitialisé.');
    };

    window.submitCircleExercise = function (pNum) {
        const pState = circleExerciseState[pNum];
        if (!pState || !pState.questions) return;
        Object.keys(pState.questions).forEach(qId => {
            if (pState.questions[qId].mode === 'multiple') {
                window.submitCircleQuestion(pNum, qId);
            }
        });
    };

    window.retryCircleExercise = function (pNum) {
        const pState = circleExerciseState[pNum];
        if (!pState || !pState.questions) return;
        Object.keys(pState.questions).forEach(qId => {
            window.retryCircleQuestion(pNum, qId);
        });
    };

    window.restartCircleExercise = function (pNum) {
        const pState = circleExerciseState[pNum];
        if (!pState || !pState.questions) return;
        Object.keys(pState.questions).forEach(qId => {
            window.restartCircleQuestion(pNum, qId);
        });
    };

    window.retrySingleCircle = function (pNum) {
        const pState = circleExerciseState[pNum];
        if (!pState || !pState.questions) return;
        Object.values(pState.questions).forEach(q => {
            if (q.mode === 'single') {
                q.circles = [];
                q.state = 'ready';
            }
        });
        renderPageCircles(pNum);
        updateCircleBarUI();
        toast('Cercle effacé. Tracez un nouveau cercle.');
    };

    window.toggleViewerTool = function (tool) {
        if (activeViewerTool === tool) {
            activeViewerTool = null;
        } else {
            activeViewerTool = tool;
        }
        applyViewerToolState();
    };

    window.setAnnotColor = function (color, el, overrideSize) {
        currentAnnotColor = color;
        if (overrideSize) currentAnnotSize = overrideSize;
        document.querySelectorAll('.palette-colors .color-dot').forEach(d => d.classList.remove('active'));
        if (el) el.classList.add('active');
    };

    window.setAnnotSize = function (size, el) {
        currentAnnotSize = size;
        document.querySelectorAll('.palette-sizes .size-dot').forEach(d => d.classList.remove('active'));
        if (el) el.classList.add('active');
    };

    window.clearActivePageDrawing = function () {
        if (activeViewerTool === 'circle') {
            const pages = getActiveVisiblePages();
            let cleared = false;
            pages.forEach(pNum => {
                const pState = circleExerciseState[pNum];
                if (pState && pState.questions) {
                    Object.values(pState.questions).forEach(q => {
                        if (q.circles && q.circles.length > 0) {
                            q.circles = [];
                            q.state = 'ready';
                            cleared = true;
                        }
                    });
                    renderPageCircles(pNum);
                }
            });
            updateCircleBarUI();
            toast(cleared ? 'Sélection réinitialisée.' : 'Aucun cercle à effacer.');
            return;
        }

        const currentCanvases = document.querySelectorAll('.page-annot-canvas');
        currentCanvases.forEach(c => {
            const pNum = c.getAttribute('data-page');
            const parentPage = c.closest('.page-item');
            if (parentPage && parentPage.offsetParent !== null) {
                const ctx = c.getContext('2d');
                ctx.clearRect(0, 0, c.width, c.height);
                delete pageDrawingsCache[pNum];
                delete pageHistory[pNum];
            }
        });
        toast('Annotations de la page effacées.');
    };

    window.undoLastStroke = function () {
        if (activeViewerTool === 'circle') {
            const active = getActiveMultipleChoiceQuestion();
            if (active && active.question) {
                const q = active.question;
                // Active ONLY for multiple choices questions AND before clicking "Corriger"
                if (q.state !== 'correct' && q.state !== 'incorrect' && q.circles && q.circles.length > 0) {
                    q.circles.pop();
                    if (q.circles.length === 0) q.state = 'ready';
                    renderPageCircles(active.pNum);
                    updateCircleBarUI();
                    toast('Dernier cercle annulé.');
                }
            }
            return;
        }

        const currentCanvases = document.querySelectorAll('.page-annot-canvas');
        let undone = false;
        currentCanvases.forEach(c => {
            const pNum = c.getAttribute('data-page');
            const parentPage = c.closest('.page-item');
            if (parentPage && parentPage.offsetParent !== null) {
                if (pageHistory[pNum] && pageHistory[pNum].length > 0) {
                    const prevData = pageHistory[pNum].pop();
                    const ctx = c.getContext('2d');
                    ctx.clearRect(0, 0, c.width, c.height);
                    if (prevData) {
                        const img = new Image();
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0);
                            pageDrawingsCache[pNum] = c.toDataURL();
                        };
                        img.src = prevData;
                    } else {
                        delete pageDrawingsCache[pNum];
                    }
                    undone = true;
                }
            }
        });
        toast(undone ? 'Dernier trait annulé.' : 'Aucun trait à annuler.');
    };

    function applyViewerToolState() {
        document.body.dataset.tool = activeViewerTool || 'none';
        ['penBtn', 'calligraphyBtn', 'circleBtn', 'eraserBtn', 'loupeBtn', 'btn-pen', 'btn-calligraphy', 'btn-circle', 'btn-eraser', 'btn-loupe'].forEach(bId => {
            const b = document.getElementById(bId);
            if (b) {
                b.setAttribute('aria-pressed', 'false');
                b.classList.remove('active');
            }
        });

        const panel = document.getElementById('penPanel');
        const lens = document.getElementById('circular-loupe-lens');
        if (lens && activeViewerTool !== 'loupe') lens.style.display = 'none';

        if (activeViewerTool === 'pen') {
            const b1 = document.getElementById('penBtn');
            const b2 = document.getElementById('btn-pen');
            if (b1) { b1.setAttribute('aria-pressed', 'true'); b1.classList.add('active'); }
            if (b2) b2.classList.add('active');
            if (panel) { panel.hidden = false; panel.dataset.tool = 'pen'; }
            toast('Crayon actif : dessinez ou écrivez sur les pages.');
            setupAllAnnotCanvases();
        } else if (activeViewerTool === 'calligraphy') {
            const b1 = document.getElementById('calligraphyBtn');
            const b2 = document.getElementById('btn-calligraphy');
            if (b1) { b1.setAttribute('aria-pressed', 'true'); b1.classList.add('active'); }
            if (b2) b2.classList.add('active');
            if (panel) { panel.hidden = false; panel.dataset.tool = 'calligraphy'; }
            toast('Plume Calligraphie active : écriture soignée et traits fluides.');
            setupAllAnnotCanvases();
        } else if (activeViewerTool === 'circle') {
            const b1 = document.getElementById('circleBtn');
            const b2 = document.getElementById('btn-circle');
            if (b1) { b1.setAttribute('aria-pressed', 'true'); b1.classList.add('active'); }
            if (b2) b2.classList.add('active');
            if (panel) { panel.hidden = false; panel.dataset.tool = 'circle'; }
            toast('Outil Entourer actif : cliquez ou touchez une option pour l\'entourer.');
            setupAllAnnotCanvases();
        } else if (activeViewerTool === 'eraser') {
            const b1 = document.getElementById('eraserBtn');
            const b2 = document.getElementById('btn-eraser');
            if (b1) { b1.setAttribute('aria-pressed', 'true'); b1.classList.add('active'); }
            if (b2) b2.classList.add('active');
            if (panel) { panel.hidden = false; panel.dataset.tool = 'eraser'; }
            toast('Gomme active : passez sur vos annotations pour les effacer.');
            setupAllAnnotCanvases();
        } else if (activeViewerTool === 'loupe') {
            const b1 = document.getElementById('loupeBtn');
            const b2 = document.getElementById('btn-loupe');
            if (b1) { b1.setAttribute('aria-pressed', 'true'); b1.classList.add('active'); }
            if (b2) b2.classList.add('active');
            if (panel) panel.hidden = true;
            toast('Loupe active : survolez la page pour agrandir les détails.');
        } else {
            if (panel) panel.hidden = true;
        }
        updateCircleBarUI();
    }

    function setupAllAnnotCanvases() {
        document.querySelectorAll('.page-annot-canvas').forEach(canvas => {
            if (!canvas.getAttribute('data-initialized')) {
                canvas.setAttribute('data-initialized', 'true');
                initCanvasListeners(canvas);
            }
            refreshCanvasResolution(canvas);
        });
        document.querySelectorAll('.page-circle-layer').forEach(svg => {
            const pNum = svg.getAttribute('data-page');
            if (pNum) {
                renderPageCircles(pNum);
                updateCircleExerciseUI(pNum);
            }
        });
    }

    function refreshCanvasResolution(canvas) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            const dpr = window.devicePixelRatio || 1;
            const targetW = Math.round(rect.width * dpr);
            const targetH = Math.round(rect.height * dpr);
            const pNum = canvas.getAttribute('data-page');
            if (canvas.width !== targetW || canvas.height !== targetH) {
                const prevData = pageDrawingsCache[pNum];
                canvas.width = targetW;
                canvas.height = targetH;
                if (prevData) {
                    const img = new Image();
                    img.onload = () => {
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, targetW, targetH);
                    };
                    img.src = prevData;
                }
            }
            if (pNum) {
                renderPageCircles(pNum);
            }
        }
    }

    function initCanvasListeners(canvas) {
        const ctx = canvas.getContext('2d');
        const pNum = canvas.getAttribute('data-page');

        function getCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
                scaleRatio: scaleX
            };
        }

        canvas.addEventListener('pointerdown', (e) => {
            if (!['pen', 'eraser', 'brush', 'circle', 'calligraphy'].includes(activeViewerTool)) return;
            e.preventDefault();
            e.stopPropagation();
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
            isAnnotDrawing = true;
            activeDrawingCanvas = canvas;
            activeDrawingCtx = ctx;

            // Push current state to undo history
            if (!pageHistory[pNum]) pageHistory[pNum] = [];
            pageHistory[pNum].push(canvas.toDataURL());
            if (pageHistory[pNum].length > 25) pageHistory[pNum].shift();

            const { x, y, scaleRatio } = getCoords(e);
            annotStartX = x;
            annotStartY = y;
            annotLastX = x;
            annotLastY = y;
            annotLastTime = performance.now();

            if (activeViewerTool === 'pen' || activeViewerTool === 'brush') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentAnnotColor;
                ctx.lineWidth = activeViewerTool === 'brush' ? (currentAnnotSize * scaleRatio * 3) : (currentAnnotSize * scaleRatio);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                if (activeViewerTool === 'brush') ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else if (activeViewerTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(x, y, 16 * scaleRatio, 0, Math.PI * 2);
                ctx.fill();
            } else if (activeViewerTool === 'calligraphy') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentAnnotColor;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = currentAnnotSize * scaleRatio * 1.8;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y);
                ctx.stroke();
            } else if (activeViewerTool === 'circle') {
                const targets = getCircleTargetsForPage(pNum);
                if (targets && targets.length > 0) {
                    const canvasW = canvas.width;
                    const canvasH = canvas.height;
                    const clickXPct = (x / canvasW) * 100;
                    const clickYPct = (y / canvasH) * 100;
                    let hitTarget = null;
                    let minDist = Infinity;

                    for (const t of targets) {
                        const bounds = getTargetBounds(t);
                        const { tx, ty, tw, th, cx: tcx, cy: tcy } = bounds;
                        if (clickXPct >= (tx - 3) && clickXPct <= (tx + tw + 3) &&
                            clickYPct >= (ty - 3) && clickYPct <= (ty + th + 3)) {
                            hitTarget = t;
                            break;
                        }
                        const d = Math.hypot(clickXPct - tcx, clickYPct - tcy);
                        if (d < minDist && d <= Math.max(tw, th) * 0.9) {
                            minDist = d;
                            hitTarget = t;
                        }
                    }

                    if (hitTarget) {
                        selectCircleOption(pNum, hitTarget);
                        isAnnotDrawing = false;
                        return;
                    }
                }
                circlePoints = [{ x, y }];
                circlePrevData = canvas.toDataURL();
                try {
                    circleSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                } catch (err) {
                    circleSnapshot = null;
                }
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!isAnnotDrawing || activeDrawingCanvas !== canvas) return;
            e.preventDefault();
            e.stopPropagation();
            const { x, y, scaleRatio } = getCoords(e);

            if (activeViewerTool === 'pen' || activeViewerTool === 'brush') {
                if (activeViewerTool === 'brush') ctx.globalAlpha = 0.5;
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else if (activeViewerTool === 'eraser') {
                ctx.beginPath();
                ctx.arc(x, y, 16 * scaleRatio, 0, Math.PI * 2);
                ctx.fill();

                // Erase student circle if touched by eraser (only for multiple-choice before correction)
                const pState = circleExerciseState[pNum];
                if (pState && pState.questions) {
                    const cxPct = (x / canvas.width) * 100;
                    const cyPct = (y / canvas.height) * 100;
                    const eraserRadiusPct = ((16 * scaleRatio) / canvas.width) * 100;

                    let removedAny = false;
                    Object.values(pState.questions).forEach(q => {
                        if (q.mode === 'multiple' && q.circles.length > 0 && q.state !== 'correct' && q.state !== 'incorrect') {
                            const prevCount = q.circles.length;
                            q.circles = q.circles.filter(c => {
                                const dist = Math.hypot(cxPct - c.cx, cyPct - c.cy);
                                const nearPerimeter = Math.abs(dist - Math.max(c.rx, c.ry)) <= eraserRadiusPct * 2.5;
                                const inside = dist <= Math.max(c.rx, c.ry);
                                return !(nearPerimeter || inside);
                            });
                            if (q.circles.length !== prevCount) {
                                removedAny = true;
                                if (q.circles.length === 0) {
                                    q.state = 'ready';
                                }
                            }
                        }
                    });

                    if (removedAny) {
                        renderPageCircles(pNum);
                        updateCircleExerciseUI(pNum);
                    }
                }
            } else if (activeViewerTool === 'calligraphy') {
                const now = performance.now();
                const dt = Math.max(1, now - annotLastTime);
                const dx = x - annotLastX;
                const dy = y - annotLastY;
                const angle = Math.atan2(dy, dx);
                // Calligraphy ribbon nib simulation (45 degree chisel)
                const nibAngle = Math.PI / 4;
                const angleFactor = Math.abs(Math.sin(angle - nibAngle));
                let width = (currentAnnotSize * scaleRatio) * (0.6 + 1.8 * angleFactor);

                if (e.pressure > 0 && e.pressure !== 0.5) {
                    width *= (0.5 + e.pressure * 0.9);
                }

                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentAnnotColor;
                ctx.lineWidth = Math.max(1.5, width);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const midX = (annotLastX + x) / 2;
                const midY = (annotLastY + y) / 2;
                ctx.beginPath();
                ctx.moveTo(annotLastX, annotLastY);
                ctx.quadraticCurveTo(annotLastX, annotLastY, midX, midY);
                ctx.stroke();

                annotLastX = midX;
                annotLastY = midY;
                annotLastTime = now;
            } else if (activeViewerTool === 'circle') {
                circlePoints.push({ x, y });
                const drawPreview = () => {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = Math.max(3, currentAnnotSize * scaleRatio * 1.2);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    if (circlePoints.length > 2) {
                        ctx.beginPath();
                        ctx.moveTo(circlePoints[0].x, circlePoints[0].y);
                        for (let i = 1; i < circlePoints.length - 1; i++) {
                            const cx = (circlePoints[i].x + circlePoints[i + 1].x) / 2;
                            const cy = (circlePoints[i].y + circlePoints[i + 1].y) / 2;
                            ctx.quadraticCurveTo(circlePoints[i].x, circlePoints[i].y, cx, cy);
                        }
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                };

                if (circleSnapshot) {
                    ctx.putImageData(circleSnapshot, 0, 0);
                    drawPreview();
                } else if (circlePrevData) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        drawPreview();
                    };
                    img.src = circlePrevData;
                } else {
                    drawPreview();
                }
            }
        });

        const finishDrawing = (e) => {
            if (!isAnnotDrawing || activeDrawingCanvas !== canvas) return;
            isAnnotDrawing = false;
            activeDrawingCanvas = null;
            activeDrawingCtx = null;

            // Handle circle drawing tool
            if (activeViewerTool === 'circle' && circlePoints.length >= 4) {
                const xs = circlePoints.map(p => p.x);
                const ys = circlePoints.map(p => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                const strokeW = maxX - minX;
                const strokeH = maxY - minY;

                // Accidental tiny tap guard
                if (strokeW < 10 && strokeH < 10) {
                    if (circleSnapshot) {
                        ctx.putImageData(circleSnapshot, 0, 0);
                    } else if (circlePrevData) {
                        const img = new Image();
                        img.onload = () => {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                        };
                        img.src = circlePrevData;
                    }
                    return;
                }

                const strokeCenterX = (minX + maxX) / 2;
                const strokeCenterY = (minY + maxY) / 2;

                let rx = Math.max(14, strokeW / 2);
                let ry = Math.max(14, strokeH / 2);
                const ratio = rx / ry;
                // If reasonably circular, snap to well-balanced circle
                if (ratio >= 0.72 && ratio <= 1.38) {
                    const avgR = (rx + ry) / 2;
                    rx = avgR;
                    ry = avgR;
                }

                const targets = getCircleTargetsForPage(pNum);
                const hasTargets = targets.length > 0;

                if (!hasTargets) {
                    // Regular whiteboard geometric circle (no configured targets on this page)
                    const restoreAndDraw = () => {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = currentAnnotColor;
                        const { scaleRatio } = getCoords(e);
                        ctx.lineWidth = Math.max(3.5, currentAnnotSize * scaleRatio * 1.35);
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.beginPath();
                        ctx.ellipse(strokeCenterX, strokeCenterY, rx, ry, 0, 0, 2 * Math.PI);
                        ctx.stroke();

                        const curData = canvas.toDataURL();
                        pageDrawingsCache[pNum] = curData;
                        if (!pageHistory[pNum]) pageHistory[pNum] = [];
                        pageHistory[pNum].push(curData);
                    };

                    if (circleSnapshot) {
                        ctx.putImageData(circleSnapshot, 0, 0);
                        restoreAndDraw();
                    } else if (circlePrevData) {
                        const img = new Image();
                        img.onload = () => {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            restoreAndDraw();
                        };
                        img.src = circlePrevData;
                    } else {
                        restoreAndDraw();
                    }
                    return;
                }

                // Page has Circle Exercise targets!
                // Restore whiteboard canvas cleanly so student circle annotations do not alter or dirty the whiteboard canvas
                if (circleSnapshot) {
                    ctx.putImageData(circleSnapshot, 0, 0);
                } else if (circlePrevData) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = circlePrevData;
                }

                const cxPct = (strokeCenterX / canvas.width) * 100;
                const cyPct = (strokeCenterY / canvas.height) * 100;
                const rxPct = (rx / canvas.width) * 100;
                const ryPct = (ry / canvas.height) * 100;

                const pState = getOrCreateCirclePageState(pNum);
                const targetQ = findQuestionForCircle(pNum, cxPct, cyPct, rxPct, ryPct);
                if (!targetQ) return;

                // When user circled the right choice(s) and evaluation is done, don't let them draw circles again in the same question
                if (targetQ.state === 'correct') {
                    toast((targetQ.title || 'Question') + ' déjà réussie ! 🎯');
                    return;
                }

                if (targetQ.mode === 'single') {
                    // Single-choice mode: immediate evaluation
                    // Check if stroke matches any target configured for this question
                    const matchedTarget = targetQ.targets.find(t => checkCircleMatchesTarget(cxPct, cyPct, rxPct, ryPct, t));
                    if (matchedTarget) {
                        // Snap cleanly to the exact configured zone in Studio Pro!
                        selectCircleOption(pNum, matchedTarget);
                    } else {
                        // Freehand stroke did not match any target zone
                        targetQ.circles = [];
                        const newCircle = {
                            id: 'circle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                            questionId: targetQ.id,
                            cx: cxPct,
                            cy: cyPct,
                            rx: rxPct,
                            ry: ryPct,
                            status: 'incorrect',
                            attempt: targetQ.attempt || 1,
                        };
                        targetQ.circles.push(newCircle);
                        targetQ.state = 'incorrect';
                        targetQ.attempt = (targetQ.attempt || 1) + 1;
                        renderPageCircles(pNum);
                        updateCircleBarUI();
                        playErrorTone();
                        toast('Pas tout à fait... Réessayez !');
                    }
                } else {
                    // Multiple-choice mode: selection phase
                    if (targetQ.state === 'incorrect') {
                        targetQ.circles = [];
                        targetQ.attempt++;
                        targetQ.state = 'selecting';
                    }

                    // Duplicate guard
                    const isDuplicate = targetQ.circles.some(c =>
                        Math.hypot(c.cx - cxPct, c.cy - cyPct) < 2.5 && Math.abs(c.rx - rxPct) < 2.5
                    );
                    if (isDuplicate) return;

                    const newCircle = {
                        id: 'circle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        questionId: targetQ.id,
                        cx: cxPct,
                        cy: cyPct,
                        rx: rxPct,
                        ry: ryPct,
                        status: 'neutral',
                        attempt: targetQ.attempt,
                    };
                    targetQ.circles.push(newCircle);
                    targetQ.state = 'selecting';
                    renderPageCircles(pNum);
                    updateCircleBarUI();
                }
                return;
            }

            pageDrawingsCache[pNum] = canvas.toDataURL();
        };

        canvas.addEventListener('pointerup', finishDrawing);
        canvas.addEventListener('pointercancel', finishDrawing);
    }

    // ── Dynamic Circular Magnifier Lens (Loupe) ──
    (function initLoupe() {
        const lens = document.getElementById('circular-loupe-lens');
        if (!lens) return;

        window.addEventListener('mousemove', (e) => {
            if (activeViewerTool !== 'loupe') {
                lens.style.display = 'none';
                return;
            }

            const el = document.elementFromPoint(e.clientX, e.clientY);
            const pageEl = el ? el.closest('.page-item') : null;
            const img = pageEl ? pageEl.querySelector('.page-img') : null;

            if (!img) {
                lens.style.display = 'none';
                return;
            }

            const rect = img.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                lens.style.display = 'none';
                return;
            }

            lens.style.display = 'block';
            lens.style.left = e.clientX + 'px';
            lens.style.top = e.clientY + 'px';

            const zoomFactor = 2.4;
            const relX = (e.clientX - rect.left) / rect.width;
            const relY = (e.clientY - rect.top) / rect.height;

            const bgW = rect.width * zoomFactor;
            const bgH = rect.height * zoomFactor;
            const bgX = -(relX * bgW - 90);
            const bgY = -(relY * bgH - 90);

            lens.style.backgroundImage = `url("${img.src}")`;
            lens.style.backgroundSize = `${bgW}px ${bgH}px`;
            lens.style.backgroundPosition = `${bgX}px ${bgY}px`;
        });

        window.addEventListener('mouseleave', () => {
            if (lens) lens.style.display = 'none';
        });
    })();

    function updateUI() {
        syncModeButtons();

        const topCount = document.getElementById('topCount');
        const toolCount = document.getElementById('toolCount');

        let displayLabel = '';
        if (currentMode === 'slides') {
            displayLabel = String(currentPage);
        } else {
            const isCover = (currentPage === 1);
            const isBackCover = (currentPage === TOTAL);
            if (isCover) {
                displayLabel = '1';
            } else if (isBackCover) {
                displayLabel = String(TOTAL);
            } else {
                const left = (currentPage % 2 === 0) ? currentPage : (currentPage - 1);
                const right = Math.min(TOTAL, left + 1);
                displayLabel = `${left}–${right}`;
            }
        }

        if (topCount) topCount.textContent = `Page ${displayLabel} / ${TOTAL}`;
        if (toolCount) toolCount.textContent = `${displayLabel} / ${TOTAL}`;

        const isAtStart = currentPage <= 1;
        const isAtEnd = currentPage >= TOTAL;

        const navPrev = document.getElementById('prev');
        const navNext = document.getElementById('next');
        const tPrev = document.getElementById('tPrev');
        const tNext = document.getElementById('tNext');

        if (navPrev) navPrev.disabled = isAtStart;
        if (tPrev) tPrev.disabled = isAtStart;
        if (navNext) navNext.disabled = isAtEnd;
        if (tNext) tNext.disabled = isAtEnd;

        // Active thumbnails in TOC strip
        document.querySelectorAll('.thumb').forEach(t => {
            const n = parseInt(t.dataset.page, 10);
            if (currentMode === 'slides') {
                t.classList.toggle('active', n === currentPage);
            } else {
                if (currentPage === 1) {
                    t.classList.toggle('active', n === 1);
                } else if (currentPage === TOTAL) {
                    t.classList.toggle('active', n === TOTAL);
                } else {
                    const left = (currentPage % 2 === 0) ? currentPage : (currentPage - 1);
                    const right = Math.min(TOTAL, left + 1);
                    t.classList.toggle('active', n === left || n === right);
                }
            }
        });

        // Auto scroll TOC strip if open
        const toc = document.getElementById('toc');
        if (toc && toc.classList.contains('open')) {
            const activeThumb = document.querySelector('.thumb.active');
            const strip = document.getElementById('strip');
            if (activeThumb && strip) {
                strip.scrollTo({
                    left: activeThumb.offsetLeft - strip.clientWidth / 2 + activeThumb.offsetWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
        updateCircleBarUI();
    }

    function playFlipSound() {
        if (!soundEnabled) return;
        const s = new Audio(asset('public/audio/page-flip.wav'));
        s.volume = 0.4;
        s.play().catch(() => { });
    }

    window.toggleSound = () => {
        soundEnabled = !soundEnabled;
        const btn = document.getElementById('soundBtn');
        if (btn) {
            btn.classList.toggle('muted', !soundEnabled);
            btn.classList.toggle('active', !soundEnabled);
            btn.setAttribute('aria-pressed', soundEnabled ? 'false' : 'true');
            btn.title = soundEnabled ? 'Couper le son de page (M)' : 'Activer le son de page (M)';
        }
        toast(soundEnabled ? 'Son activé 🔊' : 'Son coupé 🔇');
    };

    window.toggleFullscreen = async () => {
        const app = document.getElementById('app');
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            if (app) {
                const on = app.classList.toggle('immersive');
                app.classList.toggle('is-fs', on);
                toast(on ? 'Plein écran immersif activé.' : 'Mode immersif désactivé.');
            }
        }
    };
    document.addEventListener('fullscreenchange', () => {
        const isFS = !!document.fullscreenElement;
        const app = document.getElementById('app');
        if (app) app.classList.toggle('is-fs', isFS);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
    });

    function buildThumbs() {
        const strip = document.getElementById('strip');
        if (!strip) return;
        strip.innerHTML = '';
        BOOK.pages.forEach((page, idx) => {
            const pNum = page.pageNumber || (idx + 1);
            const pad3 = String(pNum).padStart(3, '0');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'thumb';
            b.dataset.page = pNum;
            b.setAttribute('aria-label', `Aller à la page ${pNum}`);

            const tpg = document.createElement('span');
            tpg.className = 'tpg';
            const img = document.createElement('img');
            const primaryThumb = page.thumbPath ? asset(page.thumbPath) : (page.imagePath ? asset(page.imagePath) : asset(`public/pages/thumbs/page-${pad3}.webp`));
            img.src = primaryThumb;
            img.alt = `Miniature ${pNum}`;
            img.loading = 'lazy';
            img.onerror = () => {
                img.src = page.imagePath ? asset(page.imagePath) : asset(`public/pages/page-${pad3}.webp`);
            };
            tpg.appendChild(img);

            const tn = document.createElement('span');
            tn.className = 'tn';
            tn.textContent = pNum;

            b.appendChild(tpg);
            b.appendChild(tn);
            b.addEventListener('click', () => {
                window.goToPage(pNum);
            });
            strip.appendChild(b);
        });
    }

    window.toggleToc = function () {
        const toc = document.getElementById('toc');
        const tocBtn = document.getElementById('tocBtn');
        if (!toc) return;
        const isOpen = toc.classList.toggle('open');
        if (tocBtn) tocBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
            updateUI();
        }
    };
    window.openThumbDrawer = window.toggleToc;
    window.closeThumbDrawer = () => {
        const toc = document.getElementById('toc');
        const tocBtn = document.getElementById('tocBtn');
        if (toc) toc.classList.remove('open');
        if (tocBtn) tocBtn.setAttribute('aria-expanded', 'false');
    };

    let toastTimer = null;
    function toast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }
    window.toast = toast;

    const COLORS = [
        ['#17143F', 'Encre'],
        ['#7B6DFF', 'Violet'],
        ['#FF3D81', 'Rose'],
        ['#12A37A', 'Vert'],
        ['#FFD84D', 'Ambre'],
        ['#FFFFFF', 'Blanc'],
    ];

    function buildColors() {
        const colorsEl = document.getElementById('colors');
        if (!colorsEl) return;
        colorsEl.innerHTML = '';
        COLORS.forEach(([hex, name]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'sw';
            b.style.background = hex;
            b.title = name;
            b.setAttribute('aria-label', name);
            b.setAttribute('aria-pressed', hex === currentAnnotColor ? 'true' : 'false');
            b.addEventListener('click', () => {
                currentAnnotColor = hex;
                [...colorsEl.children].forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
            });
            colorsEl.appendChild(b);
        });
    }

    window.setDrawingSize = function (size, el) {
        currentAnnotSize = size;
        document.querySelectorAll('#sizes .sz').forEach(b => b.setAttribute('aria-pressed', b === el ? 'true' : 'false'));
    };

    function openModal(src, alt) {
        stopAllAudio();
        viewerWrap.classList.add('modal-active');
        modalImg.src = src;
        modalImg.alt = alt || 'Zoom HD';
        modalEl.setAttribute('aria-label', alt || 'Zoom HD');
        const titleEl = document.getElementById('zoom-modal-title');
        if (titleEl) {
            titleEl.innerHTML = `<span style="color:var(--brand);margin-right:6px">🔍</span>${escapeHtml(alt || 'Zoom Haute Définition')}`;
        }
        resetZoom();
        modalEl.classList.add('open');
        const closeBtn = modalEl.querySelector('.modal-close-btn');
        if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
        stopAllAudio();
        modalEl.classList.remove('open');
        viewerWrap.classList.remove('modal-active');
        modalImg.src = '';
    }
    window.openModal = openModal;
    window.closeModal = closeModal;

    function getYouTubeEmbedUrl(url) {
        if (!url || typeof url !== 'string') return null;
        const trimmed = url.trim();
        const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (vMatch && vMatch[1]) {
            return `https://www.youtube-nocookie.com/embed/${vMatch[1]}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
        }
        const pathMatch = trimmed.match(/(?:youtu\.be\/|\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/);
        if (pathMatch && pathMatch[1]) {
            return `https://www.youtube-nocookie.com/embed/${pathMatch[1]}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
        }
        return null;
    }

    function openVideoModal(url, title) {
        stopAllAudio();
        const modal = document.getElementById('video-modal');
        const iframe = document.getElementById('video-modal-iframe');
        const titleEl = document.getElementById('video-modal-title');
        const ytBtn = document.getElementById('video-modal-yt-btn');
        const notice = document.getElementById('video-modal-notice');
        const fallbackLink = document.getElementById('video-modal-link-fallback');

        const embedUrl = getYouTubeEmbedUrl(url);
        if (!embedUrl) {
            toast('Lien YouTube manquant ou invalide.');
            return;
        }

        if (titleEl) {
            const hasCustomTitle = title && !/^(?:vid[ée]o\s*youtube)$/i.test(title.trim());
            titleEl.innerHTML = `<span style="color:#ef4444;margin-right:6px">▶</span> ${escapeHtml(hasCustomTitle ? title : 'Vidéo YouTube')}`;
        }
        if (ytBtn) {
            ytBtn.href = url || '#';
        }
        if (fallbackLink) {
            fallbackLink.href = url || '#';
        }
        if (notice) {
            notice.style.display = (window.location.protocol === 'file:') ? 'block' : 'none';
        }
        if (iframe) iframe.src = embedUrl;
        if (modal) modal.classList.add('open');

        // Basculer automatiquement en plein écran lors du clic
        const wrap = document.getElementById('video-modal-wrap');
        if (wrap) {
            if (wrap.requestFullscreen) {
                const p = wrap.requestFullscreen();
                if (p && typeof p.catch === 'function') p.catch(() => { });
            } else if (wrap.webkitRequestFullscreen) {
                wrap.webkitRequestFullscreen();
            }
        }
    }

    function closeVideoModal() {
        if (document.fullscreenElement) {
            const p = document.exitFullscreen?.();
            if (p && typeof p.catch === 'function') p.catch(() => { });
        } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        const modal = document.getElementById('video-modal');
        const iframe = document.getElementById('video-modal-iframe');
        if (iframe) iframe.src = '';
        if (modal) modal.classList.remove('open');
    }

    function toggleVideoFullscreen() {
        const wrap = document.getElementById('video-modal-wrap');
        if (!wrap) return;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (wrap.requestFullscreen) {
                const p = wrap.requestFullscreen();
                if (p && typeof p.catch === 'function') p.catch(() => { });
            } else if (wrap.webkitRequestFullscreen) {
                wrap.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                const p = document.exitFullscreen();
                if (p && typeof p.catch === 'function') p.catch(() => { });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    document.addEventListener('fullscreenchange', () => {
        const btn = document.getElementById('video-modal-fs-btn');
        if (btn) {
            btn.innerHTML = (document.fullscreenElement || document.webkitFullscreenElement) ? '🗗' : '⛶';
            btn.title = (document.fullscreenElement || document.webkitFullscreenElement) ? 'Quitter le plein écran' : 'Plein écran';
        }
    });

    window.openVideoModal = openVideoModal;
    window.closeVideoModal = closeVideoModal;
    window.toggleVideoFullscreen = toggleVideoFullscreen;

    function applyZoomTransform(transition) {
        const t = transition !== false ? 'transform 0.08s ease-out' : 'none';
        modalImg.style.transition = t;
        modalImg.style.transform =
            `scale(${modalZoom}) translate(${modalTranslate.x / modalZoom}px, ${modalTranslate.y / modalZoom}px)`;
        const zL = document.getElementById('zoom-level');
        if (zL) zL.textContent = Math.round(modalZoom * 100) + '%';
        const bOut = document.getElementById('btn-zoom-out');
        if (bOut) bOut.disabled = modalZoom <= MIN_ZOOM;
        const bIn = document.getElementById('btn-zoom-in');
        if (bIn) bIn.disabled = modalZoom >= MAX_ZOOM;
    }

    window.adjustZoom = (delta) => {
        modalZoom = parseFloat(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, modalZoom + delta)).toFixed(2));
        if (modalZoom <= 1) modalTranslate = { x: 0, y: 0 };
        applyZoomTransform();
    };

    window.resetZoom = () => {
        modalZoom = 1; modalTranslate = { x: 0, y: 0 };
        applyZoomTransform();
    };

    document.getElementById('modal-img-wrap').addEventListener('wheel', (e) => {
        e.preventDefault(); e.stopPropagation();
        const delta = -e.deltaY * 0.001 * modalZoom;
        modalZoom = parseFloat(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, modalZoom + delta)).toFixed(3));
        if (modalZoom <= 1) modalTranslate = { x: 0, y: 0 };
        applyZoomTransform(false);
    }, { passive: false });

    document.getElementById('modal-img-wrap').addEventListener('dblclick', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (modalZoom > 1) {
            window.resetZoom();
        } else {
            modalZoom = 2.2;
            applyZoomTransform(true);
        }
    });

    modalImg.addEventListener('mousedown', (e) => {
        if (modalZoom <= 1) return;
        e.preventDefault();
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        translateAtDrag = { ...modalTranslate };
        modalImg.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragStart) return;
        modalTranslate = {
            x: translateAtDrag.x + (e.clientX - dragStart.x),
            y: translateAtDrag.y + (e.clientY - dragStart.y),
        };
        applyZoomTransform(false);
    });
    window.addEventListener('mouseup', () => {
        isDragging = false; dragStart = null;
        modalImg.style.cursor = modalZoom > 1 ? 'grab' : 'zoom-in';
    });

    document.getElementById('modal-img-wrap').addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            const [t1, t2] = [e.touches[0], e.touches[1]];
            pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            pinchStartZoom = modalZoom;
        }
    }, { passive: true });
    document.getElementById('modal-img-wrap').addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && pinchStartDist !== null) {
            e.preventDefault();
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            modalZoom = parseFloat(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoom * (dist / pinchStartDist))).toFixed(3));
            if (modalZoom <= 1) modalTranslate = { x: 0, y: 0 };
            applyZoomTransform(false);
        }
    }, { passive: false });

    window.openHelp = () => document.getElementById('help-modal').classList.add('open');
    window.closeHelp = () => document.getElementById('help-modal').classList.remove('open');

    document.addEventListener('keydown', (e) => {
        const isModal = modalEl.classList.contains('open');
        const vModal = document.getElementById('video-modal');
        if (vModal && vModal.classList.contains('open')) {
            if (e.key === 'Escape') { e.stopPropagation(); closeVideoModal(); return; }
        }
        const isHelp = document.getElementById('help-modal').classList.contains('open');
        const target = e.target;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        if (isModal) {
            switch (e.key) {
                case 'Escape': e.stopPropagation(); closeModal(); break;
                case '+': case '=': e.preventDefault(); window.adjustZoom(ZOOM_STEP); break;
                case '-': e.preventDefault(); window.adjustZoom(-ZOOM_STEP); break;
                case '0': e.preventDefault(); window.resetZoom(); break;
            }
            return;
        }
        if (isHelp) { if (e.key === 'Escape') closeHelp(); return; }
        if (thumbDrawerOpen) { if (e.key === 'Escape') closeThumbDrawer(); return; }
        if (isInput) return;

        switch (e.key) {
            case 'ArrowRight': case 'PageDown': e.preventDefault(); window.goNext(); break;
            case 'ArrowLeft': case 'PageUp': e.preventDefault(); window.goPrev(); break;
            case 'Home': e.preventDefault(); window.goFirst(); break;
            case 'End': e.preventDefault(); window.goLast(); break;
            case 'm': case 'M': window.toggleSound(); break;
            case 'f': case 'F': window.toggleFullscreen(); break;
            case 'p': case 'P': window.toggleViewerTool('pen'); break;
            case 'c': case 'C': window.toggleViewerTool('calligraphy'); break;
            case 'o': case 'O': window.toggleViewerTool('circle'); break;
            case 'e': case 'E': window.toggleViewerTool('eraser'); break;
            case 'z': case 'Z': window.toggleViewerTool('loupe'); break;
            case 'u': case 'U': window.undoLastStroke(); break;
            case '?': window.openHelp(); break;
        }
    }, true);

    buildColors();
    buildThumbs();
    if (currentMode === 'slides') {
        initSlidesView();
    } else {
        initFlipbook();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (currentMode === 'slides') {
                initSlidesView();
            } else {
                initFlipbook();
            }
        }, 150);
    });
}

