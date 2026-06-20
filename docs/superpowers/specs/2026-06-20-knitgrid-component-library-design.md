# KnitGrid 컴포넌트 라이브러리 추출 — 설계 문서

- 날짜: 2026-06-20
- 상태: 승인 대기 (spec 리뷰 → 사용자 검토)
- 목적: 모놀리식 KnitGrid 앱에서 재사용 가능한 순수 표현형 컴포넌트 라이브러리를 추출하고, App을 그 컴포넌트들로 전체 리라이트한다. 완성된 라이브러리는 이후 `/design-sync`로 claude.ai/design에 동기화한다.

## 배경

KnitGrid는 Vite + React 19 + Tailwind v4 기반의 단일 페이지 애플리케이션(한국어 뜨개 도안 에디터)이다. 현재 소스는 사실상 두 파일이다:

- `src/main.jsx` (3,527줄): 단일 `App()` 컴포넌트(997~3498줄) + 두 개의 작은 헬퍼(`HeaderRow`, `HeaderColumn`). `createRoot`로 직접 렌더.
- `src/styles.css` (1,252줄): Tailwind `@apply`(280회 사용)로 구성된 **시맨틱 클래스 기반** 스타일(`.panel`, `.tool-rail button`, `.palette-swatch`, `.primary`/`.danger`/`.active` 변형 등).

**export된 컴포넌트가 전혀 없고**(`export` 없음, `package.json`은 `"private": true`, `main`/`module`/`exports` 없음), Storybook도 없다. 따라서 design-sync가 가져갈 재사용 부품이 현재로선 없다. 이 작업은 그 부품을 만든다.

## 목표 / 비목표

**목표**
- ~19개의 순수 표현형(presentational), props로 제어되는 컴포넌트를 `src/components/`에 추출한다.
- App을 전체 리라이트하여 이 컴포넌트들을 조립하도록 한다(단일 진실 공급원, 드리프트 없음).
- 앱의 동작·시각적 렌더를 100% 보존한다.
- 라이브러리 진입점(`src/components/index.js` 배럴)을 노출한다.

**비목표 (YAGNI)**
- TypeScript 도입하지 않음(프로젝트 컨벤션 유지: `.jsx`, ESM, 단일 styles.css).
- CSS 재구성/스코프화하지 않음(`styles.css`는 그대로 유지).
- 비제어형(uncontrolled) 컴포넌트 변형 미지원.
- design-sync 동기화 자체는 이 작업 범위 밖(라이브러리 완성 후 별도로 `/design-sync` 재실행).
- 앱의 상태/로직 동작 변경 없음(IndexedDB, 이미지 양자화, 캔버스, undo/redo 등 의미 보존).

## 접근법

채택: **접근법 A — 프레젠테이셔널 프리미티브 + 단일 스타일시트.**

- 컴포넌트는 기존 시맨틱 클래스명만 입히는 얇은 래퍼. 동일 DOM·동일 클래스 → 픽셀 단위 동일 렌더.
- 상태·핸들러·도메인 로직은 전부 `App.jsx`에 유지. 컴포넌트는 App 상태에 의존하지 않음.
- `styles.css`는 손대지 않음(시각적 회귀 위험 최소화). design-sync는 `styles.css`의 `@import` 클로저를 통째로 받으므로 단일 스타일시트로 완전 동작.

거부한 대안:
- **접근법 B (컴포넌트별 스코프드 CSS)**: 1,252줄 CSS를 쪼개면 `@apply` + 교차 선택자(`.tool-rail button.active`) 때문에 회귀 위험이 큼. 전체 리라이트와 동시 진행 시 위험 가중.
- **접근법 C (헤드리스 + 스타일드 분리)**: 이 앱 규모엔 과함(YAGNI).

## 파일 구조

기존 프로젝트의 평평하고 미니멀한 구조에 맞춘다(`primitives/layout/domain` 같은 계층 분류 없음).

```
src/
  components/
    index.js          ← 배럴 export (라이브러리 진입점)
    Button.jsx        Button + IconButton
    FileButton.jsx
    SegmentedControl.jsx
    Slider.jsx
    TextField.jsx
    NumberField.jsx
    Select.jsx
    Toggle.jsx
    Panel.jsx
    Toolbar.jsx
    ToolRail.jsx
    Modal.jsx
    StatusBar.jsx
    Swatch.jsx
    PaletteRow.jsx
    Chip.jsx
    PresetGrid.jsx
    MovePad.jsx
    StepperControl.jsx
    Badge.jsx
  App.jsx             ← main.jsx에서 분리한 App 본체
  main.jsx            ← createRoot 부트스트랩만
  styles.css          ← 그대로 유지
```

기존 컨벤션 유지: `.jsx`, ESM, TypeScript 없음, 단일 `styles.css`, 기존 시맨틱 클래스명 그대로 사용.

## 컴포넌트 카탈로그 (~19개)

각 항목: 역할 / 주요 props / 대체할 기존 마크업.

### 기본 컨트롤
- **Button** — 기본 버튼. `variant`('default'|'primary'|'danger'), `icon`, `wide`, `active`, `disabled`, `title`, `onClick`, `children`. 대체: `command-group`/패널의 `<button>`, `.primary`/`.danger`/`.wide`.
- **IconButton** — 아이콘 전용 버튼. `icon`, `label`(a11y 필수), `active`, `size`. 대체: `.icon-toggle`, move-pad/insert 버튼.
- **FileButton** — 숨김 file input 래퍼. `icon`, `accept`, `onFiles`, `children`. 대체: `.file-button`(이미지 업로드).
- **SegmentedControl** — 탭/세그먼트. `items[{id,label,icon}]`, `value`, `onChange(id)`. 대체: `.mode-tabs`, `.display-tabs`, `.segmented`, image-palette-modes.
- **Slider** — 아이콘+레인지+값. `min`,`max`,`value`,`onChange(number)`, `leftIcon`,`rightIcon`, `valueLabel`. 대체: `.zoom-control`.
- **TextField** — 라벨+텍스트 input. `label`,`value`,`onChange(string)`. 대체: 프로젝트 이름 input.
- **NumberField** — 라벨+숫자 input. `label`,`min`,`max`,`value`,`onChange(number)`. 대체: 가로/세로/이동칸/삽입 input.
- **Select** — 라벨+네이티브 select. `label`,`options`,`value`,`onChange`. 대체: fit/정렬 옵션 select.
- **Toggle** — 표시/숨김 토글. `pressed`,`onChange(boolean)`,`icon`. 대체: `.palette-visibility-toggle`, eye 토글.

### 레이아웃 / 컨테이너
- **Panel** — 제목 달린 카드. `title`,`icon`,`action`(헤더 우측 슬롯),`className`,`children`. 대체: `.panel` + `.panel-title`.
- **Toolbar** — 가로 액션 바. `align`,`children`. 대체: `.command-group`, `.canvas-toolbar`.
- **ToolRail** — 세로 아이콘 도구 목록. `items[{id,label,icon}]`,`value`,`onSelect(id)` (+ 자식 추가 버튼). 대체: `.tool-rail`.
- **Modal** — 백드롭+헤더/바디/액션 셸. `open`,`title`,`onClose`,`actions`,`size`,`children`. 대체: `.modal-backdrop`+`.image-modal`(로컬/리사이즈/크롭/이미지 모달). 헤더/바디/액션 슬롯만 제공하고 내용은 App이 children으로 주입 → 모달별 구조 차이 흡수.
- **StatusBar** — 하단 상태 바. `children`. 대체: `.statusbar`.

### 도메인 표현형
- **Swatch** — 색상+코드 칩. `color`,`code`,`name`,`active`,`onClick`. 대체: `.palette-swatch`.
- **PaletteRow** — 스와치+이름+액션 행. `swatch`, `actions`, … 대체: `.palette-row`.
- **Chip** — 진행 행 칩. `label`,`done`,`onToggle`. 대체: `.row-chips` 칩.
- **PresetGrid** — 프리셋 버튼 그리드. `presets`,`value`,`onSelect`. 대체: `.preset-grid`.
- **MovePad** — 방향 패드. `onMove(dr,dc)`,`centerLabel`,`disabled`. 대체: `.move-pad`.
- **StepperControl** — -/라벨/+ 행. `label`,`onAdd`,`onRemove`, disabled 조건. 대체: `.insert-control`.
- **Badge** — 상태 핀. `state`,`children`,`title`. 대체: `.local-save-state`.

총 19개(Button/IconButton을 한 파일에 두면 18개 파일).

## API 규칙

- **이벤트**: `onClick`, `onChange(value)`, `onSelect(id)`, `onMove(dr,dc)` — 변경 핸들러는 raw event가 아닌 **가공된 값**을 넘김.
- **제어형**: 선택 컨트롤은 항상 `value` + `onChange` 제어형. 비제어형 미지원.
- **아이콘**: `icon`은 컴포넌트 타입(lucide의 `PenLine` 등)을 받아 내부에서 `<Icon size=.../>` 렌더. 사이즈 기본값은 기존 마크업 값(15/16/20 등) 보존.
- **접근성**: 아이콘 전용 버튼은 `label`(→ `aria-label`/`title`) 필수.
- **클래스 합성**: 모든 컴포넌트가 `className` prop을 받아 기존 클래스 뒤에 덧붙임. 추가 props는 루트로 spread(`...rest`).
- **슬롯**: Panel/Modal/Toolbar 등 합성 가능한 것은 `children`/슬롯 방식.
- **문서화**: TypeScript 미도입. 각 컴포넌트에 JSDoc `@param`으로 props 문서화(design-sync의 `.d.ts`/`.prompt.md` 생성에 활용).
- **export**: `index.js` 배럴에서 named export로 전부 노출.

## 리라이트 전략 & 검증

**원칙: 동작은 100% 보존, 마크업만 컴포넌트로 치환.** App의 상태·핸들러·로직은 의미 변경 없이 유지.

**단계 (각 단계 끝에 빌드 + 앱 실행 + 스크린샷으로 이전/이후 육안 비교):**

1. **기준선 캡처** — 현재 앱을 실행해 주요 화면(Edit/Preview/Progress 모드, 각 패널, 모달 4종)을 스크린샷으로 저장(golden).
2. **App 분리** — `main.jsx` → `App.jsx`(App 본체) + `main.jsx`(부트스트랩). *마크업 변경 없음.* 빌드·실행·스크린샷 → 기준선과 동일 확인.
3. **기본 컨트롤 추출 & 치환** — Button/IconButton/FileButton/SegmentedControl/Slider/TextField/NumberField/Select/Toggle 생성 후 App 마크업 치환. 검증.
4. **레이아웃 컨테이너** — Panel/Toolbar/ToolRail/Modal/StatusBar. Modal은 4종 모달을 셸로 감싸 children 주입. 검증(모달 열고 닫기 포함).
5. **도메인 표현형** — Swatch/PaletteRow/Chip/PresetGrid/MovePad/StepperControl/Badge. 검증.
6. **배럴 & 정리** — `components/index.js`, JSDoc 마무리, 미사용 import 정리. 최종 전체 검증(전 모드 + 전 모달 + 그리기/지우기/채우기/이미지 업로드 등 핵심 인터랙션 한 바퀴).

**검증 방식 (단계별 수동 확인):**
- 각 단계: `pnpm build` 통과 + `pnpm dev`로 앱 실행 → 기준선 스크린샷과 육안 비교. 차이 발견 시 다음 단계 전 수정.
- 단계 3~5는 컴포넌트 그룹 단위라 회귀 시 범위가 좁아 원인 추적이 쉬움.
- 스크린샷은 브라우저로 앱을 띄워 캡처해 보여주고, 애매하면 직접 확인 요청.

**리스크 & 완화:**
- 가장 큰 리스크: Modal 셸로 4종 모달을 감쌀 때 내부 구조 차이(크롭=슬라이더, 리사이즈=입력 등). → Modal은 헤더/바디/액션 슬롯만 제공하고 내용은 App이 그대로 주입해 구조 차이를 흡수.

## design-sync 연동 (후속, 범위 밖)

- `src/components/index.js`가 모든 컴포넌트를 named export. `package.json`에 라이브러리 진입점(`"exports": { ".": "./src/components/index.js" }`) 추가 또는 design-sync의 `componentSrcMap`으로 `src/components/*.jsx` 직접 매핑(converter에 맞는 방식은 동기화 시점에 결정 — package shape, Storybook 없음).
- 단일 `src/styles.css`를 라이브러리 스타일시트로 제공. conventions 헤더에 "시맨틱 클래스 기반, props로 제어, 새 클래스 금지" 같은 실제 어휘 명시(동기화 단계에서 작성).
- 이 작업의 산출물은 **빌드 가능하고 export된 순수 컴포넌트 라이브러리 + 리라이트된 동작하는 앱**. 완료 후 `/design-sync` 재실행으로 동기화.

## 성공 기준

- `pnpm build`가 통과한다.
- 앱이 리라이트 전과 시각적·동작적으로 동일하다(전 모드, 전 패널, 4종 모달, 핵심 인터랙션).
- `src/components/`의 ~19개 컴포넌트가 전부 순수 표현형이고 `index.js`에서 export된다.
- App 마크업이 추출 컴포넌트로 치환되어 중복/드리프트가 없다.
- `styles.css`는 변경되지 않았다.
