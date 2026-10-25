# 방안뜨기 실물 미리보기 (Knit Preview) 설계

- 날짜: 2026-10-25
- 상태: 승인됨
- 상위 로드맵: A(실물 미리보기) → B(대바늘 기호도안) → C(코바늘 기호도안). 이 문서는 A만 다룬다.

## 목적

방안뜨기(배색) 격자 도안을 그렸을 때, 메리야스(겉뜨기)로 떴을 경우 실물이 어떻게 보일지 V자 코 질감으로 렌더링해 보여준다. 편집 중 바로 전환해 확인할 수 있어야 하고, 이미지로 저장할 수 있어야 한다.

## 결정 사항

| 항목 | 결정 |
| --- | --- |
| 표시 방식 | 기존 `displayMode`에 `'knit'`(실물) 추가. 같은 캔버스에서 전환 |
| 렌더 방식 | `.cells` 안, 셀 **아래**에 `<canvas>` 1장 (`pointer-events: none`). 실물 모드에서 셀은 투명한 클릭 영역 |
| 편집 | 실물 모드에서도 허용. 아래 셀 버튼이 포인터 이벤트를 그대로 받음 |
| 빈 칸(active=false) | 바탕실 색으로 뜬 코로 렌더 (기본 `#ffffff`) |
| 코 비율 | 게이지 비율이 활성이면 기존 `cellAspectScale` 사용. 아니면 실물 모드에서만 기본 비율(가로:세로 = 1 : 0.75) 적용 |
| 내보내기 | 상단 내보내기 메뉴에 "실물 이미지(PNG)" 추가 |

## 구성 요소

### 1. `src/features/knit-preview/model/knitLayout.js` (순수 함수, DOM/Canvas 의존 없음)

- `buildKnitStitches({ grid, palette, baseColor })` → 그리기 순서대로 정렬된 코 목록
  - 각 항목: `{ row, col, color }`
  - 순서: **아랫단 → 윗단** (윗단 코가 아랫단 코 머리를 덮도록). 같은 단 안에서는 왼쪽 → 오른쪽.
  - 색: `resolveCellDisplay(cell, palette)`로 결정. `active=false`이거나 팔레트에서 숨김(`visible=false`)이면 `baseColor`.
- `getDefaultKnitCellScale()` → `{ w, h }`: 세로/가로 = 0.75를 면적 보존(w*h=1)으로 정규화한 값. 게이지 비율이 활성일 때는 기존 `cellAspectScale`을 그대로 쓴다.
- `shadeColor(hex, amount)` → 하이라이트/그림자용 색 계산.

### 2. `src/features/knit-preview/model/knitRenderer.js` (Canvas 2D)

- `createStitchSprite(color, cellW, cellH, dpr)` → 오프스크린 캔버스 1개(한 코 모양)
  - 한 코 = 좌/우 두 개의 잎사귀형 다리(V). 기본색 채움 + 바깥쪽 그림자, 안쪽 하이라이트, 가운데 홈 그림자.
  - 스프라이트 높이는 셀 높이의 약 1.35배. 다리 아래 끝이 셀 아래에 오고 위쪽은 윗단 셀로 겹쳐 올라간다.
- `renderKnitFabric(ctx, { stitches, cellW, cellH, dpr, options })`
  - 색별 스프라이트를 `Map` 캐시로 재사용하고 `drawImage`로 찍는다. 200×200(4만 코)에서도 한 프레임 안에 그리는 것이 목표.
  - `options.edges`: 맨 위·맨 아래 마감선(코머리 줄) 표시 여부. 기본 true.
- 스프라이트 캐시는 `cellW/cellH/dpr`가 바뀌면 무효화한다.

### 3. `src/pages/editor/ui/parts/KnitPreviewLayer.jsx`

- props: `grid`, `palette`, `cellW`, `cellH`, `rows`, `cols`, `baseColor`
- 셀 영역(`.cells`)과 같은 위치·크기의 절대배치 `<canvas>`. `devicePixelRatio`를 반영한다.
- grid/palette/셀 크기가 바뀔 때만 다시 그린다. 연속 변경(브러시 드래그)은 `requestAnimationFrame` 1회로 합친다.

### 4. 기존 코드 변경

- `src/app/model/editorConfig.js`: `DISPLAY_MODES`에 `{ id: 'knit', label: '실물' }` 추가.
- `src/pages/editor/ui/parts/EditorCanvas.jsx`
  - `displayMode === 'knit'`일 때 `KnitPreviewLayer` 렌더.
  - 셀 배경/격자선 숨김 (`.cells.knit-mode` 클래스로 CSS 처리). 가이드·진행 표시·행/열 번호는 반투명 유지.
  - 셀 크기 스케일: 훅의 `cellAspectScale`이 게이지 비활성 + 실물 모드일 때 `getDefaultKnitCellScale()`을 반환.
- `src/app/model/useKnitGridEditor.js`: `exportKnitPng()` 추가. 오프스크린 캔버스에 `renderKnitFabric`로 그린 뒤 다운로드(파일명 `<프로젝트명>-실물.png`).
- `src/pages/editor/ui/parts/EditorTopbar.jsx`: 내보내기 메뉴에 "실물 이미지(PNG)" 항목 추가.
- `src/styles.css`: 실물 모드용 스타일.

## 데이터 / 저장

- 프로젝트 저장 포맷 변경 없음. `displayMode`는 기존과 같이 저장된다. 로드 시 `DISPLAY_MODES`에 없는 값은 `'color'`로 정규화한다 (현재 `data.displayMode || 'color'`를 id 검사로 강화).
- 바탕실 색은 이번 범위에서 상수 `#ffffff`. (설정 UI는 필요해지면 추가)

## 오류 처리

- Canvas 2D 컨텍스트 생성 실패 시 그리기를 건너뛴다(셀은 투명하게 남음). 현대 브라우저에서는 발생하지 않는 경로로 보고 별도 대체 화면은 두지 않는다.
- 매우 큰 캔버스(브라우저 최대 크기 초과) 대비: 캔버스 픽셀 크기가 16384px를 넘으면 dpr을 낮춰 맞춘다.

## 범위 제외

- 안뜨기·기법별 질감 (B에서 다룸)
- 뒷면 걸침실(플로트) 표현
- 조명 방향, 3D 효과, 실 종류 질감 선택
- 바탕실 색 설정 UI

## 테스트

- `tests/knitLayout.test.js` (`node:test`)
  - 그리기 순서가 아랫단 → 윗단, 왼 → 오른쪽인지
  - 빈 칸/숨김 팔레트 칸이 `baseColor`로 대체되는지
  - 팔레트 색이 반영되는지
  - `getKnitCellScale`: 게이지 활성 시 통과, 비활성 시 w/h = 1/0.75이고 w*h ≈ 1
  - `shadeColor` 경계값(0, 음수, 양수)
- 렌더러(Canvas)는 브라우저에서 수동 확인: 48×64 눈꽃 패턴을 참고 이미지와 비교, 200×200에서 드래그 시 끊김 확인, 실물 PNG 내보내기 확인.
- `npm run build` 통과.
