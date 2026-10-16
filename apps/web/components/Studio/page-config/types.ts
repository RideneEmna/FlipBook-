export type InteractiveToolKey =
  | 'highlight'
  | 'lasso'
  | 'tts'
  | 'audio'
  | 'video'
  | 'zoom'
  | 'blank'
  | 'reveal'
  | 'check'
  | 'button'
  | 'drag-drop'
  | 'circle-exercise';

export interface ToolDef {
  n: string;
  ic: string;
  c: string;
  k: 'rect' | 'lasso' | 'pt';
  w?: number;
  h?: number;
  hint: string;
}

export const TOOL_DEFS: Record<InteractiveToolKey, ToolDef> = {
  highlight: {
    n: 'Sélection / Surligner',
    ic: 'Highlighter',
    c: '#facc15',
    k: 'rect',
    hint: 'Dessinez un rectangle sur le texte à surligner.',
  },
  lasso: {
    n: 'Lasso paragraphe',
    ic: 'Lasso',
    c: '#a78bfa',
    k: 'lasso',
    hint: "Maintenez et tracez librement autour d'un paragraphe.",
  },
  tts: {
    n: 'TTS',
    ic: 'Volume2',
    c: '#38bdf8',
    k: 'rect',
    hint: 'Dessinez une zone : un clic la lira à voix haute.',
  },
  audio: {
    n: 'Audio',
    ic: 'Music',
    c: '#f472b6',
    k: 'pt',
    w: 0.07,
    h: 0.05,
    hint: 'Cliquez pour placer un lecteur audio.',
  },
  video: {
    n: 'Vidéo',
    ic: 'Video',
    c: '#fb7185',
    k: 'rect',
    hint: 'Dessinez la zone qui ouvrira la vidéo.',
  },
  zoom: {
    n: 'Zoom',
    ic: 'ZoomIn',
    c: '#34d399',
    k: 'rect',
    hint: 'Dessinez la zone à agrandir dans une modale HD.',
  },
  blank: {
    n: 'Texte à trou',
    ic: 'TextCursorInput',
    c: '#fbbf24',
    k: 'rect',
    hint: 'Dessinez un rectangle sur le mot à masquer.',
  },
  reveal: {
    n: 'Révéler',
    ic: 'Eye',
    c: '#818cf8',
    k: 'rect',
    hint: "Dessinez la zone à masquer jusqu'au clic.",
  },
  check: {
    n: 'Case à cocher',
    ic: 'CheckSquare',
    c: '#2dd4bf',
    k: 'pt',
    w: 0.04,
    h: 0.03,
    hint: 'Cliquez pour placer une case à cocher.',
  },
  button: {
    n: 'Bouton corriger',
    ic: 'CheckCircle2',
    c: '#f97316',
    k: 'pt',
    w: 0.2,
    h: 0.045,
    hint: 'Cliquez pour placer le bouton de correction.',
  },
  'drag-drop': {
    n: 'Glisser-Déposer',
    ic: 'Move',
    c: '#ec4899',
    k: 'rect',
    hint: "Dessinez un rectangle sur l'élément à rendre déplaçable, puis ajustez sa destination.",
  },
  'circle-exercise': {
    n: 'Entourer la zone',
    ic: 'Circle',
    c: '#10b981',
    k: 'rect',
    hint: "Dessinez un rectangle sur la zone correcte que l'élève devra entourer.",
  },
};

export interface InteractiveItem {
  id: string;
  type: InteractiveToolKey;
  x: number;
  y: number;
  w: number;
  h: number;
  pts?: [number, number][];
  color?: string;
  note?: string;
  text?: string;
  lang?: string;
  rate?: number;
  read?: boolean;
  label?: string;
  fileName?: string;
  fileUrl?: string;
  autoplay?: boolean;
  title?: string;
  url?: string;
  level?: number;
  answer?: string;
  hint?: string;
  cs?: boolean;
  content?: string;
  correct?: boolean;
  // Drag & drop fields
  targetX?: number;
  targetY?: number;
  targetW?: number;
  targetH?: number;
  artworkUrl?: string;
  maskColor?: string;
  maskPadding?: number;
  // Circle exercise fields
  tolerance?: number;
  circleMode?: 'single' | 'multiple';
  questionId?: string;
  questionTitle?: string;
  isCorrect?: boolean;
  requireAll?: boolean;
  strictSelection?: boolean;
  groupId?: string;
}

export type PageKind = 'pdf' | 'blank' | 'image' | 'demo';

export interface StudioConfigPage {
  id: string;
  kind: PageKind;
  idx?: number;
  name?: string;
  num?: number;
  doc?: any; // PDFDocumentProxy
  imageUrl?: string;
  items: InteractiveItem[];
}

export const DEFAULT_ITEM_DATA: Record<InteractiveToolKey, Partial<InteractiveItem>> = {
  highlight: { color: '#facc15', note: '' },
  lasso: { text: '', color: '#a78bfa', read: true, lang: 'fr-FR' },
  tts: { text: '', lang: 'fr-FR', rate: 1 },
  audio: { label: 'Piste audio', autoplay: false },
  video: { title: '', url: '' },
  zoom: { title: 'Zoom HD', level: 2.5 },
  blank: { answer: '', hint: '', cs: false },
  reveal: { content: '', color: '#6366f1' },
  check: { label: '', correct: true },
  button: { label: 'Corriger' },
  'drag-drop': {
    label: 'Élément mobile',
    maskColor: '#ffffff',
    maskPadding: 0,
    color: '#ec4899',
  },
  'circle-exercise': {
    label: 'Zone à entourer',
    tolerance: 0.5,
    circleMode: 'single',
    questionId: 'q1',
    questionTitle: 'Question 1',
    isCorrect: true,
    requireAll: true,
    strictSelection: true,
    color: '#10b981',
  },
};
