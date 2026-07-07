import { atom } from 'jotai';
import {
  DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM,
  INITIAL_IMAGE_OPTIONS,
  INITIAL_TEXT_OPTIONS,
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
export const displayModeAtom = atom('color');
export const zoomAtom = atom(86);
export const guideEveryAtom = atom(10);
export const guideColorModeAtom = atom('black');
export const guideCustomColorAtom = atom('#111827');
export const gridLineColorModeAtom = atom('default');
export const gridLineCustomColorAtom = atom('#c9ced6');
export const numberStartAtom = atom(1);
export const rowDirectionAtom = atom('bottom-up');
// 게이지: 10cm당 코수(가로), 10cm당 단수(세로). 0 = 미설정.
export const gaugeStitchesAtom = atom(0);
export const gaugeRowsAtom = atom(0);
// 게이지 기반 실제 코 비율로 셀을 렌더링할지 여부.
export const cellAspectRatioAtom = atom(false);
// 서술형 도안: 뜨기 방식(flat=평면/round=원통)과 첫 행 진행 방향(rtl/ltr), PDF 포함 여부.
export const writtenKnitModeAtom = atom('flat');
export const writtenStartDirectionAtom = atom('rtl');
export const writtenIncludeInPdfAtom = atom(false);
export const showOppositeHeadersAtom = atom(true);
export const currentCellAtom = atom({ row: 23, col: 17 });
export const insertAnchorCellAtom = atom({ row: 23, col: 17 });
export const progressRowAtom = atom(17);
// 현재 행 안에서 진행 중인 코 위치(1부터, 읽기 순서 기준).
export const progressStitchAtom = atom(1);
// 행 끝(마지막 코)에 도달하면 다음 행으로 자동 이동할지 여부.
export const progressAutoAdvanceAtom = atom(true);
// 진행 모드에서 화면 꺼짐 방지(Wake Lock) 사용 여부.
export const wakeLockEnabledAtom = atom(true);
export const completedRowsAtom = atom(new Set([1, 2, 3, 4, 5]));
export const progressMarksAtom = atom(new Set());
export const historyAtom = atom([]);
export const futureAtom = atom([]);
export const isDraggingAtom = atom(false);
export const projectNameAtom = atom('코지 파우치 패턴');
export const cropDraftAtom = atom(null);
export const imageDraftAtom = atom(null);
export const textDraftAtom = atom(null);
export const imageOptionsAtom = atom(INITIAL_IMAGE_OPTIONS);
export const textOptionsAtom = atom(INITIAL_TEXT_OPTIONS);
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
