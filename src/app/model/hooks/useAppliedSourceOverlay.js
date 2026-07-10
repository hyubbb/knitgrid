import { useCallback, useRef } from 'react';
import { DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM, clampFiniteNumber } from '../knitgridModel.js';

// 편집 화면에 얹히는 '적용된 원본 이미지' 오버레이의 변형(이동/확대)·포인터 드래그·표시 상태 관리.
export function useAppliedSourceOverlay({
  appliedSourceOverlayTransform,
  setAppliedSourceOverlayTransform,
  appliedSourceOverlayMoveStep,
  setAppliedSourceOverlayMoveStep,
  isAdjustingAppliedSourceOverlay,
  setAppliedSourceImage,
  setShowAppliedSourceOverlay,
  setAppliedSourceOverlayOpacity,
  setIsAdjustingAppliedSourceOverlay
}) {
  const appliedSourceDragRef = useRef(null);

  const appliedSourceTransformCss = appliedSourceOverlayTransform.scaleMode === 'free'
    ? `translate(calc(${appliedSourceOverlayTransform.offsetX} * var(--cell)), calc(${appliedSourceOverlayTransform.offsetY} * var(--cell))) scale(${appliedSourceOverlayTransform.scaleX / 100}, ${appliedSourceOverlayTransform.scaleY / 100})`
    : `translate(calc(${appliedSourceOverlayTransform.offsetX} * var(--cell)), calc(${appliedSourceOverlayTransform.offsetY} * var(--cell))) scale(${appliedSourceOverlayTransform.scale / 100})`;

  const resetAppliedSourceOverlayTransform = useCallback(() => {
    setAppliedSourceOverlayTransform(DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM);
    setAppliedSourceOverlayMoveStep(1);
  }, [setAppliedSourceOverlayTransform, setAppliedSourceOverlayMoveStep]);

  const updateAppliedSourceOverlayTransform = useCallback((patch) => {
    setAppliedSourceOverlayTransform((previous) => {
      const next = { ...previous, ...patch };
      return {
        offsetX: clampFiniteNumber(next.offsetX, -200, 200),
        offsetY: clampFiniteNumber(next.offsetY, -200, 200),
        scaleMode: next.scaleMode === 'free' ? 'free' : 'uniform',
        scale: clampFiniteNumber(next.scale, 50, 250),
        scaleX: clampFiniteNumber(next.scaleX, 50, 250),
        scaleY: clampFiniteNumber(next.scaleY, 50, 250)
      };
    });
  }, [setAppliedSourceOverlayTransform]);

  const moveAppliedSourceOverlay = useCallback((colDelta, rowDelta) => {
    const step = clampFiniteNumber(appliedSourceOverlayMoveStep, 0.1, 200);
    setAppliedSourceOverlayMoveStep(step);
    setAppliedSourceOverlayTransform((previous) => ({
      ...previous,
      offsetX: clampFiniteNumber(previous.offsetX + colDelta * step, -200, 200),
      offsetY: clampFiniteNumber(previous.offsetY + rowDelta * step, -200, 200)
    }));
  }, [appliedSourceOverlayMoveStep, setAppliedSourceOverlayMoveStep, setAppliedSourceOverlayTransform]);

  const handleAppliedSourceOverlayPointerDown = (event) => {
    if (!isAdjustingAppliedSourceOverlay) return;
    event.preventDefault();
    event.stopPropagation();
    const cellSize = parseFloat(getComputedStyle(event.currentTarget).getPropertyValue('--cell')) || 24;
    appliedSourceDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: appliedSourceOverlayTransform.offsetX,
      offsetY: appliedSourceOverlayTransform.offsetY,
      cellSize
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAppliedSourceOverlayPointerMove = (event) => {
    const drag = appliedSourceDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    setAppliedSourceOverlayTransform((previous) => ({
      ...previous,
      offsetX: clampFiniteNumber(drag.offsetX + (event.clientX - drag.startX) / drag.cellSize, -200, 200),
      offsetY: clampFiniteNumber(drag.offsetY + (event.clientY - drag.startY) / drag.cellSize, -200, 200)
    }));
  };

  const handleAppliedSourceOverlayPointerUp = (event) => {
    const drag = appliedSourceDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    appliedSourceDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const clearAppliedSourceImage = useCallback(() => {
    setAppliedSourceImage((previous) => {
      if (previous?.src) URL.revokeObjectURL(previous.src);
      return null;
    });
    setShowAppliedSourceOverlay(false);
    setAppliedSourceOverlayOpacity(45);
    setIsAdjustingAppliedSourceOverlay(false);
    resetAppliedSourceOverlayTransform();
  }, [resetAppliedSourceOverlayTransform, setAppliedSourceImage, setShowAppliedSourceOverlay, setAppliedSourceOverlayOpacity, setIsAdjustingAppliedSourceOverlay]);

  const replaceAppliedSourceImageFromDraft = useCallback((draft, options, nextRows, nextCols) => {
    if (!draft?.src) return;
    setAppliedSourceImage((previous) => {
      if (previous?.src && previous.src !== draft.src) URL.revokeObjectURL(previous.src);
      return {
        src: draft.src,
        name: draft.name,
        width: draft.width,
        height: draft.height,
        imageOptions: { ...options },
        rows: nextRows,
        cols: nextCols
      };
    });
    setShowAppliedSourceOverlay(false);
    setAppliedSourceOverlayOpacity(45);
    setIsAdjustingAppliedSourceOverlay(false);
    resetAppliedSourceOverlayTransform();
  }, [resetAppliedSourceOverlayTransform, setAppliedSourceImage, setShowAppliedSourceOverlay, setAppliedSourceOverlayOpacity, setIsAdjustingAppliedSourceOverlay]);

  return {
    appliedSourceTransformCss,
    resetAppliedSourceOverlayTransform,
    updateAppliedSourceOverlayTransform,
    moveAppliedSourceOverlay,
    handleAppliedSourceOverlayPointerDown,
    handleAppliedSourceOverlayPointerMove,
    handleAppliedSourceOverlayPointerUp,
    clearAppliedSourceImage,
    replaceAppliedSourceImageFromDraft
  };
}
