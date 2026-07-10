import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, Hand, RotateCcw, Trash2 } from "lucide-react";
import { clampFiniteNumber } from "../../../../../app/model/knitgridModel.js";
import { parseNumericInput } from "../../../../../shared/lib/number.js";

// 편집 화면의 '적용된 원본 이미지' 오버레이 표시/조정 툴바 컨트롤
export function SourceOverlayControls({ editor, canEditSourceOverlay, isPanTool, previousToolRef }) {
  const {
    setTool,
    appliedSourceImage,
    showAppliedSourceOverlay,
    setShowAppliedSourceOverlay,
    appliedSourceOverlayOpacity,
    setAppliedSourceOverlayOpacity,
    isAdjustingAppliedSourceOverlay,
    setIsAdjustingAppliedSourceOverlay,
    appliedSourceOverlayMoveStep,
    setAppliedSourceOverlayMoveStep,
    appliedSourceOverlayTransform,
    updateAppliedSourceOverlayTransform,
    moveAppliedSourceOverlay,
    resetAppliedSourceOverlayTransform,
    clearAppliedSourceImage,
  } = editor;

  return (
    <div className='source-overlay-control'>
      <button
        className={showAppliedSourceOverlay ? "active" : ""}
        onClick={() => {
          setShowAppliedSourceOverlay((value) => {
            if (value) setIsAdjustingAppliedSourceOverlay(false);
            return !value;
          });
        }}
        disabled={!appliedSourceImage}
        title={
          appliedSourceImage
            ? `${appliedSourceImage.name} 원본 보기`
            : "적용된 원본 이미지 없음"
        }
      >
        <Eye size={14} />
        원본 보기
      </button>
      {canEditSourceOverlay ? (
        <button
          className={isAdjustingAppliedSourceOverlay ? "active" : ""}
          onClick={() =>
            setIsAdjustingAppliedSourceOverlay((value) => {
              const nextValue = !value;
              if (nextValue && isPanTool) {
                setTool(
                  previousToolRef.current === "pan"
                    ? "pen"
                    : previousToolRef.current || "pen",
                );
              }
              return nextValue;
            })
          }
          disabled={!appliedSourceImage || !showAppliedSourceOverlay}
          title='원본 위치와 크기 조정'
        >
          <Hand size={14} />
          원본 조정
        </button>
      ) : null}
      <label>
        <span>투명도</span>
        <input
          type='range'
          min='15'
          max='85'
          value={appliedSourceOverlayOpacity}
          disabled={!appliedSourceImage || !showAppliedSourceOverlay}
          onChange={(event) =>
            setAppliedSourceOverlayOpacity(Number(event.target.value))
          }
          aria-label='편집 화면 원본 투명도'
        />
      </label>
      {canEditSourceOverlay ? (
        <>
          <div
            className='source-overlay-scale-mode'
            aria-label='원본 크기 조정 방식'
          >
            <button
              className={
                appliedSourceOverlayTransform.scaleMode === "uniform"
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateAppliedSourceOverlayTransform({
                  scaleMode: "uniform",
                })
              }
              disabled={!appliedSourceImage || !showAppliedSourceOverlay}
            >
              균일
            </button>
            <button
              className={
                appliedSourceOverlayTransform.scaleMode === "free"
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateAppliedSourceOverlayTransform({ scaleMode: "free" })
              }
              disabled={!appliedSourceImage || !showAppliedSourceOverlay}
            >
              가로/세로
            </button>
          </div>
          {appliedSourceOverlayTransform.scaleMode === "uniform" ? (
            <label>
              <span>크기</span>
              <input
                type='range'
                min='50'
                max='250'
                step='1'
                value={appliedSourceOverlayTransform.scale}
                disabled={
                  !appliedSourceImage || !showAppliedSourceOverlay
                }
                onChange={(event) =>
                  updateAppliedSourceOverlayTransform({
                    scale: event.target.value,
                  })
                }
                aria-label='원본 균일 크기'
              />
            </label>
          ) : (
            <>
              <label>
                <span>가로</span>
                <input
                  type='range'
                  min='50'
                  max='250'
                  step='1'
                  value={appliedSourceOverlayTransform.scaleX}
                  disabled={
                    !appliedSourceImage || !showAppliedSourceOverlay
                  }
                  onChange={(event) =>
                    updateAppliedSourceOverlayTransform({
                      scaleX: event.target.value,
                    })
                  }
                  aria-label='원본 가로 크기'
                />
              </label>
              <label>
                <span>세로</span>
                <input
                  type='range'
                  min='50'
                  max='250'
                  step='1'
                  value={appliedSourceOverlayTransform.scaleY}
                  disabled={
                    !appliedSourceImage || !showAppliedSourceOverlay
                  }
                  onChange={(event) =>
                    updateAppliedSourceOverlayTransform({
                      scaleY: event.target.value,
                    })
                  }
                  aria-label='원본 세로 크기'
                />
              </label>
            </>
          )}
          <div className='source-overlay-stepper'>
            <label>
              <span>이동</span>
              <input
                type='text'
                inputMode='decimal'
                pattern='[0-9]*[.,]?[0-9]*'
                autoComplete='off'
                spellCheck={false}
                value={appliedSourceOverlayMoveStep}
                disabled={
                  !appliedSourceImage || !showAppliedSourceOverlay
                }
                onChange={(event) =>
                  setAppliedSourceOverlayMoveStep(
                    clampFiniteNumber(
                      parseNumericInput(
                        event.target.value,
                        appliedSourceOverlayMoveStep,
                      ),
                      0.1,
                      200,
                    ),
                  )
                }
                aria-label='원본 이동 칸 수'
              />
            </label>
            <div
              className='source-overlay-move-pad'
              aria-label='원본 이동'
            >
              <button
                onClick={() => moveAppliedSourceOverlay(0, -1)}
                disabled={
                  !appliedSourceImage || !showAppliedSourceOverlay
                }
                title='원본 위로 이동'
                aria-label='원본 위로 이동'
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={() => moveAppliedSourceOverlay(-1, 0)}
                disabled={
                  !appliedSourceImage || !showAppliedSourceOverlay
                }
                title='원본 왼쪽으로 이동'
                aria-label='원본 왼쪽으로 이동'
              >
                <ArrowLeft size={13} />
              </button>
              <button
                onClick={() => moveAppliedSourceOverlay(1, 0)}
                disabled={
                  !appliedSourceImage || !showAppliedSourceOverlay
                }
                title='원본 오른쪽으로 이동'
                aria-label='원본 오른쪽으로 이동'
              >
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => moveAppliedSourceOverlay(0, 1)}
                disabled={
                  !appliedSourceImage || !showAppliedSourceOverlay
                }
                title='원본 아래로 이동'
                aria-label='원본 아래로 이동'
              >
                <ArrowDown size={13} />
              </button>
            </div>
          </div>
          <button
            className='icon-only reset'
            onClick={resetAppliedSourceOverlayTransform}
            disabled={!appliedSourceImage || !showAppliedSourceOverlay}
            title='정렬 초기화'
            aria-label='정렬 초기화'
          >
            <RotateCcw size={14} />
          </button>
          <button
            className='icon-only'
            onClick={clearAppliedSourceImage}
            disabled={!appliedSourceImage}
            title='원본 제거'
            aria-label='원본 제거'
          >
            <Trash2 size={14} />
          </button>
        </>
      ) : null}
    </div>
  );
}
