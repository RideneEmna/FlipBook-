export type InteractionType =
  | 'audio'
  | 'zoom'
  | 'video'
  | 'tts'
  | 'fill-blank'
  | 'reveal'
  | 'checkbox-task'
  | 'highlight'
  | 'lasso'
  | 'score-button'
  | 'drag-drop'
  | 'circle-exercise';

export interface BaseInteraction {
  id: string;
  type: InteractionType;
  title?: string;
  x: string | number;
  y: string | number;
}

export interface AudioInteraction extends BaseInteraction {
  type: 'audio';
  src: string;
}

export interface ZoomInteraction extends BaseInteraction {
  type: 'zoom';
  width: string | number;
  height: string | number;
  hiresSrc: string;
}

export interface VideoInteraction extends BaseInteraction {
  type: 'video';
  youtubeUrl: string;
  width?: string | number;
  height?: string | number;
}

export interface DragDropInteraction extends BaseInteraction {
  type: 'drag-drop';
  width: string | number;
  height: string | number;
  targetX: string | number;
  targetY: string | number;
  targetWidth: string | number;
  targetHeight: string | number;
  artworkUrl?: string;
  maskColor?: string;
  maskPadding?: number;
  label?: string;
  groupId?: string;
}

export interface CircleExerciseInteraction extends BaseInteraction {
  type: 'circle-exercise';
  width: string | number;
  height: string | number;
  tolerance?: number;
  questionId?: string;
  questionTitle?: string;
  isCorrect?: boolean;
  groupId?: string;
  mode?: 'single' | 'multiple';
  requireAll?: boolean;
  strictSelection?: boolean;
}

export type PageInteraction =
  | AudioInteraction
  | ZoomInteraction
  | VideoInteraction
  | DragDropInteraction
  | CircleExerciseInteraction
  | (BaseInteraction & Record<string, any>);

export interface PageData {
  pageNumber: number;
  imagePath: string;
  thumbPath: string;
  title?: string;
  interactions: PageInteraction[];
}

export interface BookConfig {
  title: string;
  totalPages: number;
  pageAspectRatio: number;
  pages: PageData[];
  canvasPreset?: {
    key?: string;
    id?: string;
    width?: number;
    height?: number;
  };
}
