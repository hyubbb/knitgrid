import {
  Eraser,
  Hand,
  Maximize2,
  MousePointer2,
  PaintBucket,
  PenLine,
  Pipette
} from 'lucide-react';

export const PRESETS = [
  { label: '16 x 16', cols: 16, rows: 16 },
  { label: '24 x 24', cols: 24, rows: 24 },
  { label: '32 x 32', cols: 32, rows: 32 },
  { label: '48 x 64', cols: 48, rows: 64 },
  { label: '96 x 120', cols: 96, rows: 120 }
];

export const CANVAS_MIN_ZOOM = 4;
export const CANVAS_MAX_ZOOM = 132;

export const TOOLS = [
  { id: 'select', label: '선택', icon: MousePointer2, shortcut: 'v' },
  { id: 'pan', label: '이동', icon: Hand, shortcut: 'h' },
  { id: 'pen', label: '브러시', icon: PenLine, shortcut: 'b' },
  { id: 'eraser', label: '지우개', icon: Eraser, shortcut: 'e' },
  { id: 'fill', label: '채우기', icon: PaintBucket, shortcut: 'f' },
  { id: 'picker', label: '스포이드', icon: Pipette, shortcut: 's' },
  { id: 'mirror', label: '좌우 반전', icon: Maximize2, shortcut: 'm' }
];

export const DISPLAY_MODES = [
  { id: 'color-code', label: '색상 + 코드' },
  { id: 'color', label: '색상만' },
  { id: 'code', label: '코드만' }
];

export const DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM = {
  offsetX: 0,
  offsetY: 0,
  scaleMode: 'uniform',
  scale: 100,
  scaleX: 100,
  scaleY: 100
};
