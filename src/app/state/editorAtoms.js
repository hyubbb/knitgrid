import { atom } from 'jotai';
import {
  DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM,
  INITIAL_IMAGE_OPTIONS,
  INITIAL_PALETTE,
  seedGrid
} from '../model/knitgridModel.js';

export const rowsAtom = atom(64);
export const colsAtom = atom(48);
export const draftRowsAtom = atom(64);
export const draftColsAtom = atom(48);
export const gridAtom = atom(seedGrid());
export const paletteAtom = atom(INITIAL_PALETTE);
export const activePaletteIdAtom = atom('h7');
export const toolAtom = atom('pen');
export const modeAtom = atom('edit');
export const displayModeAtom = atom('color-code');
export const zoomAtom = atom(86);
export const guideEveryAtom = atom(10);
export const guideColorModeAtom = atom('black');
export const guideCustomColorAtom = atom('#111827');
export const gridLineColorModeAtom = atom('default');
export const gridLineCustomColorAtom = atom('#c9ced6');
export const numberStartAtom = atom(1);
export const rowDirectionAtom = atom('bottom-up');
export const showOppositeHeadersAtom = atom(true);
export const currentCellAtom = atom({ row: 23, col: 17 });
export const insertAnchorCellAtom = atom({ row: 23, col: 17 });
export const progressRowAtom = atom(17);
export const completedRowsAtom = atom(new Set([1, 2, 3, 4, 5]));
export const historyAtom = atom([]);
export const futureAtom = atom([]);
export const isDraggingAtom = atom(false);
export const projectNameAtom = atom('코지 파우치 패턴');
export const cropDraftAtom = atom(null);
export const imageDraftAtom = atom(null);
export const imageOptionsAtom = atom(INITIAL_IMAGE_OPTIONS);
export const imagePaletteModeAtom = atom('extract');
export const imageCandidatesAtom = atom([]);
export const selectedImageCandidateIdAtom = atom('');
export const imageCandidateSeedAtom = atom(0);
export const imageCandidateLoadingAtom = atom(false);
export const showOriginalOverlayAtom = atom(false);
export const originalOverlayOpacityAtom = atom(46);
export const appliedSourceImageAtom = atom(null);
export const showAppliedSourceOverlayAtom = atom(false);
export const appliedSourceOverlayOpacityAtom = atom(45);
export const isAdjustingAppliedSourceOverlayAtom = atom(false);
export const appliedSourceOverlayMoveStepAtom = atom(1);
export const appliedSourceOverlayTransformAtom = atom(DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM);
export const expandedPaletteIdAtom = atom('');
export const paletteNoticeAtom = atom('');
export const pendingResizeAtom = atom(null);
export const moveStepsAtom = atom(1);
export const isInspectorCollapsedAtom = atom(false);
export const currentLocalProjectIdAtom = atom('');
export const localProjectsAtom = atom([]);
export const localProjectsOpenAtom = atom(false);
export const localSaveStateAtom = atom('unsaved');
export const localSaveMessageAtom = atom('');
export const pendingNewProjectAtom = atom(false);
export const startScreenDismissedAtom = atom(false);
// URL ?project= 값을 라우팅 원천으로 사용: null=시작화면, 'new'=새 도안, 그 외=로컬 도안 id
export const routeProjectAtom = atom(
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('project') : null
);
