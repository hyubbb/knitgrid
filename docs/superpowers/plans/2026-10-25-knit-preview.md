# 방안뜨기 실물 미리보기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 격자 도안을 메리야스 V자 코 질감으로 렌더링하는 `실물` 보기 모드와 실물 PNG 내보내기를 추가한다.

**Architecture:** 순수 레이아웃 모듈(`knitLayout.js`)이 그리기 순서·색을 계산하고, Canvas 렌더러(`knitRenderer.js`)가 색별 스프라이트를 캐시해 찍는다. 편집기에서는 `.cells` 안에 절대배치 캔버스를 셀 **아래**에 깔고, 실물 모드에서 셀을 투명하게 만들어 클릭 편집을 그대로 유지한다.

**Tech Stack:** React 19, Canvas 2D, Tailwind v4 (`@apply`), `node:test`

Spec: `docs/superpowers/specs/2026-10-25-knit-preview-design.md`

---

## File Structure

- Create `src/features/knit-preview/model/knitLayout.js` — 순수: `buildKnitStitches`, `getDefaultKnitCellScale`, `shadeColor`, 상수
- Create `src/features/knit-preview/model/knitRenderer.js` — Canvas: `getSafeDpr`, `renderKnitFabric` (스프라이트 캐시 내부)
- Create `src/pages/editor/ui/parts/KnitPreviewLayer.jsx` — 오버레이 캔버스 컴포넌트
- Create `tests/knitLayout.test.js`
- Modify `src/app/model/editorConfig.js` — `DISPLAY_MODES`에 knit
- Modify `src/app/model/knitgridModel.js` — knit-preview re-export
- Modify `src/app/model/useKnitGridEditor.js` — knit 모드 기본 비율, 로드 정규화, `exportKnitPng`
- Modify `src/pages/editor/ui/parts/EditorCanvas.jsx` — 레이어 렌더, Cell 투명 처리
- Modify `src/pages/editor/ui/parts/EditorTopbar.jsx` — 메뉴 항목
- Modify `src/styles.css` — 실물 모드 스타일

---

### Task 1: knitLayout (TDD)

**Files:** Create `src/features/knit-preview/model/knitLayout.js`, `tests/knitLayout.test.js`

- [ ] Step 1: 실패하는 테스트 작성

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildKnitStitches,
  getDefaultKnitCellScale,
  shadeColor,
  KNIT_BASE_COLOR
} from '../src/features/knit-preview/model/knitLayout.js';

const palette = [
  { id: 'a', code: 'A', name: '빨강', color: '#ff0000', visible: true },
  { id: 'b', code: 'B', name: '파랑', color: '#0000ff', visible: false }
];
const cell = (paletteId, active = true) => ({ active, color: '#123456', symbol: '', label: '', note: '', paletteId });

test('buildKnitStitches draws bottom row first, left to right', () => {
  const grid = [[cell('a'), cell('a')], [cell('a'), cell('a')]];
  const order = buildKnitStitches({ grid, palette }).map(({ row, col }) => `${row}:${col}`);
  assert.deepEqual(order, ['1:0', '1:1', '0:0', '0:1']);
});

test('buildKnitStitches uses palette color for painted cells', () => {
  const [stitch] = buildKnitStitches({ grid: [[cell('a')]], palette });
  assert.equal(stitch.color, '#ff0000');
});

test('buildKnitStitches fills empty and hidden cells with the base color', () => {
  const grid = [[cell('', false), cell('b')]];
  const colors = buildKnitStitches({ grid, palette }).map((s) => s.color);
  assert.deepEqual(colors, [KNIT_BASE_COLOR, KNIT_BASE_COLOR]);
  const custom = buildKnitStitches({ grid, palette, baseColor: '#222222' }).map((s) => s.color);
  assert.deepEqual(custom, ['#222222', '#222222']);
});

test('getDefaultKnitCellScale is wider than tall and keeps area', () => {
  const { w, h } = getDefaultKnitCellScale();
  assert.ok(Math.abs(h / w - 0.75) < 1e-9);
  assert.ok(Math.abs(w * h - 1) < 1e-9);
});

test('shadeColor lightens, darkens and passes through', () => {
  assert.equal(shadeColor('#808080', 0), '#808080');
  assert.equal(shadeColor('#808080', 1), '#ffffff');
  assert.equal(shadeColor('#808080', -1), '#000000');
  assert.equal(shadeColor('#fff', -0.5), '#808080');
  assert.equal(shadeColor('not-a-color', 0.3), 'not-a-color');
});
```

- [ ] Step 2: `node --test tests/knitLayout.test.js` → FAIL (모듈 없음)
- [ ] Step 3: 구현

```js
import { resolveCellDisplay } from '../../../entities/palette/model/paletteModel.js';

// 빈 칸은 실물에서 바탕실로 뜬 코다.
export const KNIT_BASE_COLOR = '#ffffff';
// 메리야스 한 코의 세로/가로 비율(게이지 미입력 시 기본값).
export const KNIT_STITCH_RATIO = 0.75;

// 윗단 코가 아랫단 코 머리를 덮어야 하므로 아랫단부터 그린다.
export const buildKnitStitches = ({ grid, palette, baseColor = KNIT_BASE_COLOR }) => {
  const stitches = [];
  for (let row = grid.length - 1; row >= 0; row -= 1) {
    grid[row].forEach((cell, col) => {
      const display = resolveCellDisplay(cell, palette);
      stitches.push({ row, col, color: cell.active && display.visible ? display.color : baseColor });
    });
  }
  return stitches;
};

// 면적을 유지(w*h=1)하면서 세로/가로 = KNIT_STITCH_RATIO.
export const getDefaultKnitCellScale = () => {
  const root = Math.sqrt(1 / KNIT_STITCH_RATIO);
  return { w: root, h: 1 / root };
};

const parseHex = (hex) => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!match) return null;
  const raw = match[1].length === 3 ? match[1].replace(/./g, '$&$&') : match[1];
  return [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16));
};

// amount > 0이면 흰색 쪽, < 0이면 검정 쪽으로 섞는다(-1~1).
export const shadeColor = (hex, amount) => {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const target = amount >= 0 ? 255 : 0;
  const t = Math.min(1, Math.abs(amount));
  return `#${rgb.map((v) => Math.round(v + (target - v) * t).toString(16).padStart(2, '0')).join('')}`;
};
```

- [ ] Step 4: `node --test tests/knitLayout.test.js` → PASS
- [ ] Step 5: Commit `feat: 실물 미리보기 레이아웃 모델`

### Task 2: knitRenderer

**Files:** Create `src/features/knit-preview/model/knitRenderer.js`; Modify `src/app/model/knitgridModel.js`

- [ ] Step 1: 구현 — `getSafeDpr(width, height, preferred)`(캔버스 한 변 16384px 제한), `renderKnitFabric(ctx, { stitches, rows, cols, cellW, cellH, dpr, originX, originY, edges })`
  - 1패스: 각 칸을 `shadeColor(color, -0.45)`로 채움 (다리 사이 틈의 그늘)
  - 2패스: 색별 스프라이트(`cellW × cellH*1.4`, 바닥을 셀 바닥에 맞춤)를 `drawImage`
  - 스프라이트: 좌우 기울어진 타원 다리 2개. 기본색 채움 → 바깥 테두리 그림자(-0.4) → 안쪽 하이라이트(+0.3, 반투명) → 가운데 홈(-0.5)
  - `edges`: 맨 위/아래에 코머리 가로 타원 줄
  - 캐시 키 `${color}|${cellW}|${cellH}|${dpr}`, 256개 넘으면 비움
- [ ] Step 2: `knitgridModel.js`에 `export * from '../../features/knit-preview/model/knitLayout.js'` 와 renderer re-export 추가
- [ ] Step 3: `npm run build` 통과 확인 → Commit `feat: 실물 미리보기 캔버스 렌더러`

### Task 3: 편집기 연결

**Files:** editorConfig.js, useKnitGridEditor.js, KnitPreviewLayer.jsx, EditorCanvas.jsx, styles.css

- [ ] Step 1: `DISPLAY_MODES`에 `{ id: 'knit', label: '실물' }`
- [ ] Step 2: `cellAspectScale` memo — 게이지 비활성 + `displayMode === 'knit'`이면 `getDefaultKnitCellScale()`
- [ ] Step 3: 로드 시 `DISPLAY_MODES.some((m) => m.id === data.displayMode) ? data.displayMode : 'color'`
- [ ] Step 4: `KnitPreviewLayer` — `buildKnitStitches`를 `useMemo`, `useEffect`에서 rAF로 `renderKnitFabric`, cleanup 시 `cancelAnimationFrame`
- [ ] Step 5: `ChartGrid`에서 knit 모드일 때 `.cells`에 `knit-mode` 클래스와 `<KnitPreviewLayer>` 첫 자식. `Cell`은 knit 모드에서 배경 `transparent`, 기호 span 미표시
- [ ] Step 6: CSS — `.knit-preview-layer`(absolute, left/top 0, z-0, pointer-events-none), `.cells.knit-mode .cell`(z-1, 테두리 투명), 가이드 테두리는 `color-mix` 45%
- [ ] Step 7: 브라우저 확인 → Commit `feat: 실물 보기 모드`

### Task 4: 실물 PNG 내보내기

- [ ] Step 1: `exportKnitPng` — 기준 셀 24px, 비율은 게이지 활성 시 `cellAspectScale`, 아니면 `getDefaultKnitCellScale()`. 여백 24px, 배경 `#f3f4f6`, dpr `getSafeDpr(w, h, 2)`. 파일명 `${projectName || 'knitgrid'}-실물.png`
- [ ] Step 2: 훅 반환값과 `EditorTopbar` 파일 메뉴에 `{ id: 'export-knit-png', label: '실물 이미지(PNG) 내보내기', icon: Shirt, onSelect: exportKnitPng }`
- [ ] Step 3: `npm run build`, 브라우저에서 다운로드 확인 → Commit `feat: 실물 이미지 내보내기`
