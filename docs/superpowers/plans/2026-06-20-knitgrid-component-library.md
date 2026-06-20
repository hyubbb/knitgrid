# KnitGrid 컴포넌트 라이브러리 추출 — 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KnitGrid의 모놀리식 `App`에서 ~19개의 순수 표현형 React 컴포넌트를 `src/components/`로 추출하고, App을 전체 리라이트해 이를 조립하면서 시각·동작을 100% 보존한다.

**Architecture:** 컴포넌트는 기존 시맨틱 CSS 클래스명만 입히는 얇은 표현형 래퍼다(동일 DOM·동일 클래스 → 픽셀 동일 렌더). 상태·핸들러·도메인 로직은 전부 `App.jsx`에 유지한다. `styles.css`는 변경하지 않는다. 검증은 (이 저장소에 테스트 인프라가 없고 인터랙티브 캔버스 앱이므로) **단계별 수동 시각 확인**: 각 작업 끝에 빌드 + 앱 실행 + 스크린샷을 기준선과 육안 비교한다.

**Tech Stack:** Vite 8, React 19, Tailwind v4(`@apply`), lucide-react 아이콘, pnpm. TypeScript 없음(JSDoc로 문서화).

**Spec:** `docs/superpowers/specs/2026-06-20-knitgrid-component-library-design.md`

---

## 일반 규칙 (모든 작업에 적용)

- **순수 표현형**: 컴포넌트는 App 상태에 접근하지 않는다. 데이터·핸들러는 props로만 받는다.
- **이벤트 시그니처**: `onChange(value)`, `onSelect(id)`, `onMove(dr,dc)` 등 raw event가 아닌 **가공된 값**을 넘긴다(명시된 경우 제외).
- **클래스 합성**: 모든 컴포넌트는 `className`을 받아 기존 클래스 뒤에 덧붙이고, 나머지 props는 루트 요소로 `...rest` 스프레드한다.
- **아이콘**: `icon` prop은 컴포넌트 타입(예: lucide의 `PenLine`)을 받아 내부에서 `<Icon size={...} />`로 렌더한다. 기본 size는 기존 마크업 값과 동일하게 둔다.
- **JSDoc**: 각 컴포넌트 위에 `@param`으로 props를 문서화한다(design-sync가 활용).
- **CSS 금지**: `src/styles.css`는 절대 수정하지 않는다. 새 클래스명을 만들지 않는다.
- **배럴**: 컴포넌트를 만들 때마다 `src/components/index.js`에 named export를 추가한다.
- **커밋**: 각 작업 끝에 커밋한다. 커밋 메시지는 한국어, 끝에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

### 시각 검증 절차 (각 작업의 "검증" 스텝에서 실행)

1. `pnpm build` — 통과해야 함(에러 0).
2. 백그라운드로 `pnpm dev` 실행(이미 떠 있으면 재사용). 브라우저로 `http://localhost:5173` 접속.
3. 변경 범위에 해당하는 화면을 기준선 스크린샷(Task 0에서 저장)과 육안 비교. 차이가 보이면 다음 작업으로 넘어가기 전에 수정한다.
4. 비교 대상 화면은 각 작업에 "검증 화면"으로 명시한다.

> 참고: `pnpm dev`는 `vite --host 0.0.0.0`. HMR이 동작하므로 코드 저장 시 자동 갱신된다. 빌드 검증(`pnpm build`)과 시각 검증을 모두 수행한다.

---

## Task 0: 기준선(golden) 스크린샷 캡처

**Files:** 없음(읽기/실행만). 스크린샷은 `docs/superpowers/plans/baseline/`에 저장(커밋하지 않음 — `.gitignore`에 추가).

- [ ] **Step 1:** `pnpm install` (lockfile 기준) 후 `pnpm dev`를 백그라운드로 실행.
- [ ] **Step 2:** 브라우저로 앱을 열고 다음 화면을 스크린샷으로 저장:
  - Edit 모드(기본): 상단바, 툴 레일, 캔버스, 우측 인스펙터(격자 설정/팔레트/진행/내보내기 패널) 전체
  - Preview 모드
  - Progress 모드(진행 칩 보이는 상태)
  - 인스펙터 접힌(collapsed) 상태
  - 모달 4종: 내 작업(localProjects), 새 작업(pendingNewProject), 리사이즈(resize), 크롭(crop), 이미지 설정(image) — 각각 열어서 캡처
  - 팔레트 행 펼친(expanded) 상태
- [ ] **Step 3:** `.gitignore`에 `docs/superpowers/plans/baseline/` 추가하고 커밋.

```bash
echo "docs/superpowers/plans/baseline/" >> .gitignore
git add .gitignore
git commit -m "chore: 기준선 스크린샷 디렉터리 무시

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 1: `main.jsx`를 `App.jsx` + `main.jsx`로 분리 (마크업 변경 없음)

상태·헬퍼·App·HeaderRow·HeaderColumn을 `App.jsx`로 옮기고, `main.jsx`는 부트스트랩만 남긴다. **JSX 마크업은 한 글자도 바꾸지 않는다.**

**Files:**
- Create: `src/App.jsx`
- Modify: `src/main.jsx` (전체 재작성: 부트스트랩만)

- [ ] **Step 1:** `src/main.jsx`의 전체 내용을 `src/App.jsx`로 복사한다. 그런 다음 `App.jsx`에서:
  - 최상단 `import { createRoot } from 'react-dom/client';` 제거.
  - 최하단 부트스트랩 3줄 블록 제거:
    ```js
    const rootElement = document.getElementById('root');
    const root = globalThis.__knitgridRoot ?? createRoot(rootElement);
    globalThis.__knitgridRoot = root;
    root.render(<App />);
    ```
  - `function App() {` 를 `export function App() {` 로 변경.
  - `import './styles.css';` 는 `App.jsx`에 그대로 둔다(앱이 스타일을 가져오도록).
- [ ] **Step 2:** `src/main.jsx`를 다음으로 **전체 교체**한다(HMR 가드 보존):

```jsx
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';

const rootElement = document.getElementById('root');
const root = globalThis.__knitgridRoot ?? createRoot(rootElement);
globalThis.__knitgridRoot = root;
root.render(<App />);
```

- [ ] **Step 3 (검증):** `pnpm build` 통과 확인. 시각 검증 — **검증 화면: 전체(모든 모드)**. 기준선과 완전히 동일해야 함(마크업 무변경).
- [ ] **Step 4 (커밋):**

```bash
git add src/App.jsx src/main.jsx
git commit -m "refactor: App을 App.jsx로 분리, main.jsx는 부트스트랩만

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `components/` 스캐폴딩 + 빈 배럴

**Files:**
- Create: `src/components/index.js` (빈 배럴, 이후 작업에서 export 추가)

- [ ] **Step 1:** `src/components/index.js` 생성:

```js
// KnitGrid 컴포넌트 라이브러리 — 순수 표현형 컴포넌트 배럴 export
// 각 컴포넌트는 src/styles.css의 시맨틱 클래스를 사용하며 props로만 제어된다.
```

- [ ] **Step 2 (커밋):**

```bash
git add src/components/index.js
git commit -m "chore: 컴포넌트 라이브러리 배럴 스캐폴딩

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

# 스테이지 3 — 기본 컨트롤

> 각 컴포넌트 작업의 공통 흐름: **(1) 컴포넌트 파일 생성 + JSDoc → (2) `index.js`에 export 추가 → (3) `App.jsx`에서 해당 마크업을 컴포넌트로 치환 → (4) 빌드 + 시각 검증 → (5) 커밋.**

## Task 3: `Button` + `IconButton`

**Files:**
- Create: `src/components/Button.jsx`
- Modify: `src/components/index.js`, `src/App.jsx` (다수 `<button>` 치환)

- [ ] **Step 1:** `src/components/Button.jsx` 생성:

```jsx
/**
 * 기본 버튼. 기존 시맨틱 클래스(.primary/.danger/.wide/.active)를 변형으로 노출.
 * @param {object} props
 * @param {'default'|'primary'|'danger'} [props.variant='default']
 * @param {React.ComponentType<{size?:number}>} [props.icon] - lucide 아이콘 컴포넌트
 * @param {number} [props.iconSize=16]
 * @param {boolean} [props.wide] - .wide (전체 너비)
 * @param {boolean} [props.active] - .active
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
export function Button({ variant = 'default', icon: Icon, iconSize = 16, wide, active, className = '', children, ...rest }) {
  const classes = [variant !== 'default' ? variant : '', wide ? 'wide' : '', active ? 'active' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes || undefined} {...rest}>
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
    </button>
  );
}

/**
 * 아이콘 전용 버튼. 접근성을 위해 label 필수(→ aria-label + title).
 * @param {object} props
 * @param {React.ComponentType<{size?:number}>} props.icon
 * @param {string} props.label
 * @param {number} [props.size=15]
 * @param {boolean} [props.active]
 * @param {string} [props.className]
 */
export function IconButton({ icon: Icon, label, size = 15, active, className = '', ...rest }) {
  const classes = [active ? 'active' : '', className].filter(Boolean).join(' ');
  return (
    <button className={classes || undefined} aria-label={label} title={rest.title ?? label} {...rest}>
      <Icon size={size} />
    </button>
  );
}
```

- [ ] **Step 2:** `index.js`에 추가: `export { Button, IconButton } from './Button.jsx';`
- [ ] **Step 3:** `App.jsx`에서 일반 `<button>`들을 `Button`/`IconButton`으로 치환. 대표 사례(전부는 아님 — 각 `<button>`을 검토해 매핑):
  - `command-group` 버튼들(새 작업/내 작업/undo/redo/PNG/PDF/JSON): 일반 → `<Button icon={Plus} onClick={...}>새 작업</Button>`. `.primary` 로컬 저장 → `<Button variant="primary" icon={Save} ...>`. 아이콘만 있는 undo/redo → `<IconButton icon={Undo2} label="되돌리기" ... />`.
  - 패널/모달의 `.primary`/`.danger` 버튼 → `variant`.
  - `격자 크기 적용`의 `.wide` → `wide`.
  - `.active`를 className으로 토글하던 버튼(예: 프리셋·source-overlay) 중 단순한 것 → `active` prop. **단, 다음 작업에서 전용 컴포넌트로 갈 것(mode-tabs, tool-rail, preset-grid, display-tabs)은 여기서 건드리지 말 것.**
  - `move-pad`/`insert-control`의 아이콘 버튼 → `IconButton`. **단 MovePad/StepperControl 작업(Task 18/19)에서 통째로 치환되므로 여기서는 생략 가능.**
  > 원칙: 이번 작업에서는 "전용 컴포넌트가 없는 일반/primary/danger/wide 버튼"만 치환한다. 세그먼트·툴레일·프리셋 등은 각자 작업에서 처리.
- [ ] **Step 4 (검증):** `pnpm build` 통과. 시각 검증 — **검증 화면: 상단바 command-group, 각 패널의 액션 버튼, 모달 액션 버튼**. 호버/disabled 상태 포함 육안 비교.
- [ ] **Step 5 (커밋):** `git add -A && git commit -m "feat: Button/IconButton 추출 및 일반 버튼 치환 ..."`

---

## Task 4: `FileButton`

기존: `<label className="file-button"><Icon/>이미지<input type="file" .../></label>` (이미지 업로드, line ~2322).

**Files:** Create `src/components/FileButton.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 숨김 file input을 감싼 라벨 버튼. .file-button 스타일을 사용.
 * @param {object} props
 * @param {React.ComponentType<{size?:number}>} [props.icon]
 * @param {number} [props.iconSize=16]
 * @param {string} [props.accept]
 * @param {(files: FileList) => void} props.onFiles
 * @param {string} [props.title]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
export function FileButton({ icon: Icon, iconSize = 16, accept, onFiles, title, className = '', children }) {
  return (
    <label className={`file-button ${className}`.trim()} title={title}>
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
        }}
      />
    </label>
  );
}
```

> 주의: 기존 `prepareImageDraft` 핸들러는 `event`를 받는다. `onFiles`는 `FileList`를 넘기므로, App에서 `onFiles={(files) => prepareImageDraft({ target: { files } })}` 로 어댑트하거나 `prepareImageDraft`가 `files`를 직접 받도록 호출부를 맞춘다. **핸들러 시그니처는 변경 시 해당 함수 내부에서 `event.target.files` 사용처를 확인할 것.** 가장 안전한 방법: 기존 `onChange={prepareImageDraft}`를 유지하려면 FileButton에 `onChange` 패스스루를 쓰지 말고, App에서 `onFiles={(files) => handleImageFiles(files)}`로 명시. 구현 시 `prepareImageDraft` 정의를 읽어 어느 쪽이 깔끔한지 판단.

- [ ] **Step 2:** `index.js`에 `export { FileButton } from './FileButton.jsx';`
- [ ] **Step 3:** App.jsx의 `.file-button` 라벨을 `FileButton`으로 치환.
- [ ] **Step 4 (검증):** 빌드 통과. **검증 화면: 상단바 "이미지" 버튼 → 실제 이미지 업로드 시 크롭/이미지 모달이 뜨는지 인터랙션 확인.**
- [ ] **Step 5 (커밋).**

---

## Task 5: `SegmentedControl` (mode-tabs / display-tabs)

기존: `mode-tabs`(Edit/Preview/Progress, 아이콘 포함, line ~2284), `display-tabs`(색상+코드/색상/코드, line ~2817). 둘 다 "버튼 목록 + active" 패턴.

**Files:** Create `src/components/SegmentedControl.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 세그먼트/탭 컨트롤. items를 버튼 목록으로 렌더하고 active를 표시.
 * 컨테이너 클래스(예: 'mode-tabs', 'display-tabs')를 className으로 받아 기존 스타일을 입는다.
 * @param {object} props
 * @param {Array<{id:string,label:string,icon?:React.ComponentType<{size?:number}>}>} props.items
 * @param {string} props.value - 현재 선택된 id
 * @param {(id:string) => void} props.onChange
 * @param {number} [props.iconSize=15]
 * @param {string} props.className - 컨테이너 클래스 (필수: 시각 스타일이 여기서 옴)
 * @param {string} [props.ariaLabel]
 */
export function SegmentedControl({ items, value, onChange, iconSize = 15, className, ariaLabel }) {
  return (
    <nav className={className} aria-label={ariaLabel}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={value === item.id ? 'active' : ''} onClick={() => onChange(item.id)}>
            {Icon ? <Icon size={iconSize} /> : null}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
```

> `display-tabs`는 원래 `<div>`였고 `mode-tabs`는 `<nav>`였다. 시맨틱 영향은 미미하나, 정확성을 위해 `as` prop을 추가하지 말고(YAGNI) `<nav>`로 통일하되, **시각 검증에서 두 탭 모두 기존과 동일하게 보이는지 확인**. 차이가 보이면 className만으로 해결되는지 점검.

- [ ] **Step 2:** export 추가.
- [ ] **Step 3:** App.jsx에서:
  - `mode-tabs` 블록 → `<SegmentedControl className="mode-tabs" ariaLabel="작업 모드" items={[{id:'edit',label:'Edit',icon:PenLine},{id:'preview',label:'Preview',icon:Eye},{id:'progress',label:'Progress',icon:Rows3}]} value={mode} onChange={setMode} />`
  - `display-tabs` 블록 → `<SegmentedControl className="display-tabs" items={DISPLAY_MODES} value={displayMode} onChange={setDisplayMode} />` (DISPLAY_MODES는 아이콘 없음).
- [ ] **Step 4 (검증):** 빌드 통과. **검증 화면: 상단바 모드 탭(3개 모드 전환), 팔레트 패널 display-tabs.**
- [ ] **Step 5 (커밋).**

---

## Task 6: `Slider` (zoom-control)

기존: `zoom-control`(ZoomOut 아이콘 + range + ZoomIn + `<b>{zoom}%</b>`, line ~2374).

**Files:** Create `src/components/Slider.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 아이콘 + range + 값 표시 슬라이더. .zoom-control 류 스타일.
 * @param {object} props
 * @param {number} props.min
 * @param {number} props.max
 * @param {number} props.value
 * @param {(value:number) => void} props.onChange - 숫자 값을 넘김
 * @param {React.ComponentType<{size?:number}>} [props.leftIcon]
 * @param {React.ComponentType<{size?:number}>} [props.rightIcon]
 * @param {React.ReactNode} [props.valueLabel] - 우측 값 표시(예: '120%')
 * @param {number} [props.iconSize=15]
 * @param {string} [props.className='zoom-control']
 */
export function Slider({ min, max, value, onChange, leftIcon: Left, rightIcon: Right, valueLabel, iconSize = 15, className = 'zoom-control' }) {
  return (
    <div className={className}>
      {Left ? <Left size={iconSize} /> : null}
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      {Right ? <Right size={iconSize} /> : null}
      {valueLabel != null ? <b>{valueLabel}</b> : null}
    </div>
  );
}
```

- [ ] **Step 2:** export 추가.
- [ ] **Step 3:** App.jsx `zoom-control` → `<Slider min={46} max={132} value={zoom} onChange={setZoom} leftIcon={ZoomOut} rightIcon={ZoomIn} valueLabel={`${zoom}%`} />`.
- [ ] **Step 4 (검증):** 빌드 통과. **검증 화면: 캔버스 툴바 줌 슬라이더(드래그하며 값 변화).**
- [ ] **Step 5 (커밋).**

---

## Task 7: `TextField` + `NumberField`

기존: 프로젝트 이름 input(`<input value={projectName} ...>`, brand 내부, line ~2280), 가로/세로 NumberField(line ~2666), 이동 칸 수, 삽입 등. 대부분 `<label>라벨<input .../></label>` 패턴.

**Files:** Create `src/components/TextField.jsx`, `src/components/NumberField.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** `TextField.jsx`:

```jsx
/**
 * 라벨 + 텍스트 input. 라벨 텍스트가 없으면 aria-label만 적용(brand의 프로젝트 이름처럼).
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} props.value
 * @param {(value:string) => void} props.onChange
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function TextField({ label, value, onChange, ariaLabel, className, ...rest }) {
  const input = (
    <input value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel ?? label} className={label ? undefined : className} {...rest} />
  );
  if (!label) return input;
  return (
    <label className={className}>
      {label}
      {input}
    </label>
  );
}
```

- [ ] **Step 2:** `NumberField.jsx`:

```jsx
/**
 * 라벨 + 숫자 input. onChange는 숫자를 넘긴다(빈 값은 NaN 방지를 위해 호출자가 처리).
 * @param {object} props
 * @param {string} [props.label]
 * @param {number} props.value
 * @param {(value:number) => void} props.onChange
 * @param {number} [props.min]
 * @param {number} [props.max]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function NumberField({ label, value, onChange, min, max, ariaLabel, className, ...rest }) {
  const input = (
    <input type="number" min={min} max={max} value={value} aria-label={ariaLabel ?? label} className={label ? undefined : className}
      onChange={(event) => onChange(Number(event.target.value))} {...rest} />
  );
  if (!label) return input;
  return (
    <label className={className}>
      {label}
      {input}
    </label>
  );
}
```

> 주의: 기존 가로/세로 input은 `onChange={(e) => setDraftCols(Math.min(200, Number(e.target.value)))}` 처럼 **클램프 로직**이 인라인이다. `NumberField`의 onChange는 순수 숫자만 넘기므로, App에서 `onChange={(v) => setDraftCols(Math.min(200, v))}` 로 클램프를 호출부에 유지한다. `clampNumber(...)` 사용처도 동일하게 `onChange={(v) => setMoveSteps(clampNumber(v, 1, 200))}`. **각 input의 기존 변환 로직을 그대로 onChange 콜백으로 옮긴다.**

- [ ] **Step 3:** export 2개 추가. App.jsx 치환:
  - 프로젝트 이름: `<TextField value={projectName} onChange={setProjectName} ariaLabel="프로젝트 이름" />`
  - 가로/세로: `<NumberField label="가로" min={1} max={200} value={draftCols} onChange={(v) => setDraftCols(Math.min(200, v))} />` (세로 동일)
  - 이동 칸 수, 삽입 기준 등 나머지 숫자 input 치환.
- [ ] **Step 4 (검증):** 빌드 통과. **검증 화면: 상단바 프로젝트명 입력, 격자 설정 패널 가로/세로/이동/삽입 입력(값 변경 동작 확인).**
- [ ] **Step 5 (커밋).**

---

## Task 8: `Select`

기존: 보조선 색상 select(line ~2814), 행 번호 방향 select(line ~2841), 정렬/fit 옵션 select(이미지 모달). 패턴: `<label>라벨<select value=.. onChange=..><option/></select></label>` 또는 라벨 없는 인라인 select(병합/삭제 대체 색상).

**Files:** Create `src/components/Select.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 라벨 + 네이티브 select. options로 렌더하거나 children으로 <option>을 직접 줄 수 있다.
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} props.value
 * @param {(value:string) => void} props.onChange
 * @param {Array<{value:string,label:string}>} [props.options]
 * @param {React.ReactNode} [props.children] - options 대신 직접 <option> 주입
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function Select({ label, value, onChange, options, children, ariaLabel, className, ...rest }) {
  const select = (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel ?? label} className={label ? undefined : className} {...rest}>
      {options ? options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>) : children}
    </select>
  );
  if (!label) return select;
  return (
    <label className={className}>
      {label}
      {select}
    </label>
  );
}
```

> 병합/삭제 대체 색상 select처럼 동적 `<option>`이 필요한 곳은 `children`으로 기존 `palette.filter(...).map(...)` 을 그대로 넘긴다.

- [ ] **Step 2:** export 추가. App.jsx의 select들을 치환(라벨 있는 것은 `label`+`options`, 동적인 것은 `children`).
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 격자 설정의 보조선 색상/행 번호 방향, 이미지 모달의 정렬/fit, 팔레트 펼침의 병합/삭제 select.**
- [ ] **Step 4 (커밋).**

---

## Task 9: `Toggle` (visibility / icon-toggle)

기존: `palette-visibility-toggle`(EyeOff/Eye + 텍스트, line ~2876), `icon-toggle`(인스펙터 접기, line ~2643), 원본 보기 토글 등 "눌림 상태 + 아이콘" 버튼.

**Files:** Create `src/components/Toggle.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 눌림 상태를 가진 토글 버튼. 클래스는 호출자가 className으로 지정(.palette-visibility-toggle 등).
 * @param {object} props
 * @param {boolean} props.pressed
 * @param {(next:boolean) => void} props.onChange
 * @param {React.ComponentType<{size?:number}>} [props.icon] - pressed 무관 단일 아이콘
 * @param {React.ComponentType<{size?:number}>} [props.iconOn] - pressed=true일 때
 * @param {React.ComponentType<{size?:number}>} [props.iconOff] - pressed=false일 때
 * @param {number} [props.iconSize=13]
 * @param {string} [props.pressedClassName] - pressed일 때 추가 클래스(예: '', 'is-hidden')
 * @param {string} [props.className]
 * @param {string} [props.label] - aria-label
 * @param {React.ReactNode} [props.children]
 */
export function Toggle({ pressed, onChange, icon: Icon, iconOn: On, iconOff: Off, iconSize = 13, pressedClassName, className = '', label, children, ...rest }) {
  const Chosen = pressed ? (On ?? Icon) : (Off ?? Icon);
  const classes = [className, pressed && pressedClassName ? pressedClassName : ''].filter(Boolean).join(' ');
  return (
    <button className={classes || undefined} aria-pressed={pressed} aria-label={label} onClick={() => onChange(!pressed)} {...rest}>
      {Chosen ? <Chosen size={iconSize} /> : null}
      {children}
    </button>
  );
}
```

> `palette-visibility-toggle`은 pressed=`visible`이고 hidden일 때 `is-hidden` 클래스가 붙으며 아이콘이 EyeOff↔Eye, 텍스트가 숨김↔표시로 바뀐다. children에 `<span>{visible ? '숨김' : '표시'}</span>` 를 넘기되, 그 텍스트는 호출부에서 계산. `event.stopPropagation()`이 필요한 곳(팔레트 행 내부)은 `onClick`을 직접 쓰지 말고 Toggle의 onChange 안에서 처리하거나, Toggle에 `onClick` 패스스루로 stopPropagation을 추가. **PaletteRow(Task 16)에서 함께 다뤄지므로, 인스펙터 접기/원본 보기 같은 독립 토글만 이번에 치환하고, 팔레트 내부 토글은 Task 16에서 처리해도 된다.**

- [ ] **Step 2:** export 추가. App.jsx에서 독립 토글(인스펙터 접기 `icon-toggle`, 원본 보기 등) 치환.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 인스펙터 접기/펼치기, 캔버스 툴바 원본 보기 토글.**
- [ ] **Step 4 (커밋).**

---

# 스테이지 4 — 레이아웃 / 컨테이너

## Task 10: `Panel`

기존: `<section className="panel ...">` + `<div className="panel-title"><Icon/><strong>제목</strong>{선택적 우측 버튼}</div>` + 내용. (설정/팔레트/진행/내보내기 패널)

**Files:** Create `src/components/Panel.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 제목 달린 카드 패널. .panel + .panel-title 구조를 캡슐화.
 * @param {object} props
 * @param {string} props.title
 * @param {React.ComponentType<{size?:number}>} [props.icon]
 * @param {number} [props.iconSize=17]
 * @param {React.ReactNode} [props.action] - 헤더 우측 슬롯(예: '추가' 버튼)
 * @param {string} [props.titleId] - 제목 strong의 id
 * @param {string} [props.className] - .panel에 덧붙일 변형(예: 'setup-panel', 'progress-panel')
 * @param {React.ReactNode} props.children
 */
export function Panel({ title, icon: Icon, iconSize = 17, action, titleId, className = '', children }) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel-title">
        {Icon ? <Icon size={iconSize} /> : null}
        <strong id={titleId}>{title}</strong>
        {action}
      </div>
      {children}
    </section>
  );
}
```

- [ ] **Step 2:** export 추가. App.jsx의 4개 패널을 `Panel`로 감싼다:
  - 격자 설정: `<Panel className="setup-panel" icon={Settings2} title="격자 설정" action={<IconButton icon={ArrowRight} label="격자 설정 접기" className="icon-toggle" onClick={() => setIsInspectorCollapsed(true)} />}>...`
  - 팔레트: `<Panel icon={Palette} title="팔레트 / 코드" action={<Button onClick={addPaletteColor}>추가</Button>}>...`
  - 진행: `<Panel className="progress-panel" icon={CheckSquare} title="진행 모드">...`
  - 내보내기: `<Panel className="export-panel" icon={ArrowDownToLine} title="가져오기 / 내보내기">...`
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 우측 인스펙터 4개 패널 헤더/내용 전부.**
- [ ] **Step 4 (커밋).**

---

## Task 11: `Toolbar`

기존: `command-group`(상단바 액션들), `canvas-toolbar`(좌: 격자 정보, 중: 줌, 우: 원본 오버레이). 단순 가로 컨테이너.

**Files:** Create `src/components/Toolbar.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 가로 액션 바 컨테이너. 자식을 그대로 배치한다(스타일은 className에서).
 * @param {object} props
 * @param {string} props.className - 'command-group' | 'canvas-toolbar' 등
 * @param {React.ReactNode} props.children
 */
export function Toolbar({ className, children, ...rest }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}
```

> Toolbar는 매우 얇다. 가치는 design-sync에서 "가로 액션 바"라는 명명된 부품을 노출하는 데 있다. `command-group`/`canvas-toolbar` div를 `<Toolbar className="...">`로 치환.

- [ ] **Step 2:** export 추가. App.jsx 치환.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 상단바, 캔버스 툴바.**
- [ ] **Step 4 (커밋).**

---

## Task 12: `ToolRail`

기존: `<aside className="tool-rail">` + TOOLS.map 버튼 + 회전/반복 버튼(line ~2342).

**Files:** Create `src/components/ToolRail.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 세로 아이콘 도구 레일. items를 선택 가능한 도구 버튼으로 렌더하고, children으로 추가 액션 버튼을 받는다.
 * @param {object} props
 * @param {Array<{id:string,label:string,icon:React.ComponentType<{size?:number}>}>} props.items
 * @param {string} props.value - 활성 도구 id
 * @param {(id:string) => void} props.onSelect
 * @param {number} [props.iconSize=20]
 * @param {string} [props.ariaLabel]
 * @param {React.ReactNode} [props.children] - 추가 버튼(회전/반복 등)
 */
export function ToolRail({ items, value, onSelect, iconSize = 20, ariaLabel, children }) {
  return (
    <aside className="tool-rail" aria-label={ariaLabel}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={value === item.id ? 'active' : ''} onClick={() => onSelect(item.id)} title={item.label}>
            <Icon size={iconSize} />
            <span>{item.label}</span>
          </button>
        );
      })}
      {children}
    </aside>
  );
}
```

> 기존 onClick은 `item.id === 'mirror' ? mirrorGrid() : setTool(item.id)` 처럼 특수 분기가 있다. `onSelect`에서 `(id) => id === 'mirror' ? mirrorGrid() : setTool(id)` 로 동일하게 처리. 회전/반복 버튼은 children으로 `<button onClick={rotateGrid}>...`(또는 Icon+span 유지) 넘긴다.

- [ ] **Step 2:** export 추가. App.jsx 치환.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 좌측 툴 레일(도구 선택, 회전/반복/좌우반전 동작).**
- [ ] **Step 4 (커밋).**

---

## Task 13: `Modal`

기존 **5종** 모달: `modal-backdrop > section.image-modal[변형] > image-modal-header(제목/부제 + 닫기 X) + 본문 + image-modal-actions`. 정확한 목록(누락 주의 — "새 작업"과 "리사이즈"는 둘 다 resize-modal 변형이라 헷갈리기 쉬움):

| 조건(open) | title | variant(두번째 클래스) | bodyClassName | titleId |
|---|---|---|---|---|
| `localProjectsOpen` | 내 작업 | `local-project-modal` | `local-project-modal-body` | `local-project-modal-title` |
| `pendingNewProject` | 새 작업 시작 | `resize-modal` | `resize-modal-body` | `new-project-modal-title` |
| `pendingResize` | (리사이즈 제목) | `resize-modal` | `resize-modal-body` | `resize-modal-title` |
| `cropDraft` | (크롭 제목) | `crop-modal` | `crop-modal-body` | `crop-modal-title` |
| `imageDraft` | (이미지 설정 제목) | (없음) | `image-modal-body` | `image-modal-title` |

**Files:** Create `src/components/Modal.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
import { X } from 'lucide-react';

/**
 * 모달 셸: 백드롭 + image-modal 박스 + 헤더(제목/부제/닫기) + 본문(children) + 액션 슬롯.
 * 내용 구조는 모달마다 다르므로 children/actions 슬롯으로 주입한다.
 * @param {object} props
 * @param {boolean} props.open - false면 아무것도 렌더하지 않음
 * @param {string} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {() => void} props.onClose
 * @param {string} [props.variant] - 'resize-modal' | 'crop-modal' | 'local-project-modal' 등 → image-modal에 덧붙임
 * @param {string} [props.bodyClassName] - 본문 래퍼 클래스(예: 'resize-modal-body', 'crop-modal-body'); 없으면 'image-modal-body'
 * @param {React.ReactNode} [props.actions] - image-modal-actions 내용
 * @param {string} [props.titleId]
 * @param {string} [props.closeLabel='닫기']
 * @param {React.ReactNode} props.children
 */
export function Modal({ open, title, subtitle, onClose, variant = '', bodyClassName = 'image-modal-body', actions, titleId, closeLabel = '닫기', children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`image-modal ${variant}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="image-modal-header">
          <div>
            <strong id={titleId}>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          <button onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </div>
        <div className={bodyClassName}>{children}</div>
        {actions ? <div className="image-modal-actions">{actions}</div> : null}
      </section>
    </div>
  );
}
```

> 각 모달의 본문 내용(목록/슬라이더/입력 등)과 액션 버튼들은 App에 그대로 두고 children/actions로 주입한다. **로직(핸들러, 상태)은 이동하지 않는다.** 각 모달의 `bodyClassName`을 기존 값과 정확히 맞춘다(local: `local-project-modal-body`, resize/new: `resize-modal-body`, crop: `crop-modal-body`, image: `image-modal-body`). `variant`도 기존 second class와 일치(`local-project-modal`, `resize-modal`, `crop-modal`, 이미지 모달은 없음).

- [ ] **Step 2:** export 추가. App.jsx의 **5개 모달 전부**를 `Modal`로 치환. 각 모달의 `{조건 ? (...) : null}` 래핑을 `<Modal open={조건} ...>`로 바꾼다(Modal 내부에서 open 처리). 위 표의 5개를 하나도 빠뜨리지 말 것.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 5종 모달을 각각 열고 닫기 — 제목/부제/본문/액션/X 버튼 동작 및 시각 비교.** 특히 크롭 모달 슬라이더, 이미지 설정 모달이 정확한지 확인.
- [ ] **Step 4 (커밋).**

---

## Task 14: `StatusBar`

기존: `<footer className="statusbar">` + span 4개(line ~3481).

**Files:** Create `src/components/StatusBar.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 하단 상태 바. 자식 span들을 그대로 배치.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function StatusBar({ children }) {
  return <footer className="statusbar">{children}</footer>;
}
```

- [ ] **Step 2:** export 추가. App.jsx `<footer className="statusbar">` → `<StatusBar>` (span들은 그대로 children).
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 하단 상태 바(도구/위치/활성 코드/모드 텍스트).**
- [ ] **Step 4 (커밋).**

---

# 스테이지 5 — 도메인 표현형

## Task 15: `Swatch`

기존: `<button className="palette-swatch" style={{background: color}} ... />`(line ~2887). 색상 칩.

**Files:** Create `src/components/Swatch.jsx`; Modify `index.js`, `App.jsx`(부분 — 팔레트 행 내부, Task 16과 함께 처리 가능).

- [ ] **Step 1:** 생성:

```jsx
/**
 * 색상 스와치 버튼. 배경색을 표시하고 클릭 가능.
 * @param {object} props
 * @param {string} props.color
 * @param {string} [props.code]
 * @param {boolean} [props.active]
 * @param {string} [props.title]
 * @param {(event:React.MouseEvent) => void} [props.onClick]
 * @param {string} [props.className]
 */
export function Swatch({ color, code, active, title, onClick, className = '', ...rest }) {
  const classes = ['palette-swatch', active ? 'active' : '', className].filter(Boolean).join(' ');
  return <button className={classes} style={{ background: color }} title={title} onClick={onClick} {...rest} />;
}
```

- [ ] **Step 2:** export 추가. (치환은 Task 16의 PaletteRow에서 함께 사용)
- [ ] **Step 3 (검증):** 빌드 통과(아직 미사용이어도 OK). 
- [ ] **Step 4 (커밋).**

---

## Task 16: `PaletteRow` (복합 — 가장 주의)

기존: `palette-list > palette-row`(line ~2861~3050). 가시성 토글 + 스와치 + 코드/이름 input + 카운트 + 펼침 시 편집기(색상/HEX/코드/이름/병합/삭제). 핸들러가 많고 `stopPropagation`이 곳곳에 있다.

**전략:** 마크업을 **있는 그대로** `PaletteRow` 컴포넌트로 옮기고, App 핸들러를 props로 주입한다. 로직(정규화, 병합, 삭제 규칙)은 App에 유지하고 콜백으로 전달. 내부에서 Task 9의 `Toggle`, Task 15의 `Swatch`, Task 8의 `Select`를 재사용한다.

**Files:** Create `src/components/PaletteRow.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** `App.jsx`의 `palette.map((item) => {...})` 한 행 렌더 블록 전체를 `PaletteRow.jsx`로 옮긴다. 컴포넌트 시그니처(props)를 다음으로 정의한다:

```jsx
/**
 * 팔레트 한 행: 가시성 토글 + 스와치 + 코드/이름 + 카운트 + (펼침 시) 편집기.
 * 모든 데이터/핸들러는 props. 로직은 App에 유지.
 * @param {object} props
 * @param {{id:string,code:string,name:string,color:string}} props.item
 * @param {boolean} props.visible
 * @param {boolean} props.active
 * @param {boolean} props.expanded
 * @param {number} props.count - 사용 칸 수
 * @param {Array<{id:string,code:string,name:string}>} props.palette - 병합/삭제 대상 목록
 * @param {boolean} props.canDelete - palette.length > 1
 * @param {(id:string) => void} props.onActivate
 * @param {(id:string) => void} props.onToggleExpand
 * @param {(id:string) => void} props.onToggleVisibility
 * @param {(id:string, patch:object) => void} props.onUpdate
 * @param {(sourceId:string, targetId:string) => void} props.onMerge
 * @param {(id:string, replacementId?:string) => void} props.onDelete
 * @param {(value:string) => string|null} props.normalizeHex
 */
export function PaletteRow({ item, visible, active, expanded, count, palette, canDelete, onActivate, onToggleExpand, onToggleVisibility, onUpdate, onMerge, onDelete, normalizeHex }) {
  // ... 기존 palette-row 마크업을 그대로 옮기되,
  //   setActivePaletteId(item.id) → onActivate(item.id)
  //   setExpandedPaletteId 토글 → onToggleExpand(item.id)
  //   togglePaletteVisibility(item.id) → onToggleVisibility(item.id)
  //   updatePaletteItem(item.id, patch) → onUpdate(item.id, patch)
  //   mergePaletteItems({sourceId, targetId}) → onMerge(item.id, targetId)
  //   deletePaletteItem(item.id, repl) → onDelete(item.id, repl)
  //   palette.length <= 1 → !canDelete
  //   activeCounts.get(item.id) → count
}
```

> **중요:** 마크업·클래스·`stopPropagation` 호출을 한 글자도 바꾸지 말 것. 오직 App 함수 호출을 props 콜백으로 치환만 한다. 내부 가시성 토글은 `Toggle`, 스와치는 `Swatch`, 병합/삭제 select는 `Select`로 바꿔도 되지만, **불확실하면 원본 `<button>`/`<select>`를 그대로 두는 것이 안전하다**(시각 동일성이 최우선). 1차로 원본 마크업 그대로 옮겨 동작을 확인한 뒤, 여유가 있으면 내부 프리미티브로 리팩터.

- [ ] **Step 2:** App.jsx의 `palette-list` 안 map을 `<PaletteRow key={item.id} item={item} visible={isPaletteVisible(item)} active={activePaletteId === item.id} expanded={expandedPaletteId === item.id} count={activeCounts.get(item.id) || 0} palette={palette} canDelete={palette.length > 1} onActivate={setActivePaletteId} onToggleExpand={(id) => setExpandedPaletteId((c) => c === id ? '' : id)} onToggleVisibility={togglePaletteVisibility} onUpdate={updatePaletteItem} onMerge={(sourceId, targetId) => mergePaletteItems({ sourceId, targetId })} onDelete={deletePaletteItem} normalizeHex={normalizeHex} />` 로 치환. (콜백 시그니처는 기존 함수에 맞게 정확히 어댑트)
- [ ] **Step 3:** export 추가.
- [ ] **Step 4 (검증):** 빌드 통과. **검증 화면: 팔레트 패널 — 행 선택, 펼침 편집기, 색상/HEX/코드/이름 변경, 가시성 토글, 병합, 삭제(대체 색상 포함), 추가.** 인터랙션 전부 한 바퀴.
- [ ] **Step 5 (커밋).**

---

## Task 17: `Chip` (progress row-chips)

기존: `row-chips > button[done][current]`(line ~3040).

**Files:** Create `src/components/Chip.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 진행 행 칩 버튼. done/current 상태를 클래스로 표시.
 * @param {object} props
 * @param {React.ReactNode} props.label
 * @param {boolean} [props.done]
 * @param {boolean} [props.current]
 * @param {() => void} props.onClick
 */
export function Chip({ label, done, current, onClick }) {
  const classes = [done ? 'done' : '', current ? 'current' : ''].filter(Boolean).join(' ');
  return (
    <button className={classes || undefined} onClick={onClick}>
      {label}
    </button>
  );
}
```

- [ ] **Step 2:** export 추가. App.jsx `row-chips` 안 버튼 → `<Chip key={row} label={row} done={completedRows.has(row)} current={progressRow === row} onClick={() => { setProgressRow(row); toggleCompletedRow(row); }} />`. **주의: 칩을 감싼 `Array.from({length: Math.min(rows, 36)}, ...)` 루프와 `rowDirection`/`numberStart` 행 번호 계산 로직은 App.jsx에 그대로 유지한다(컴포넌트로 옮기지 말 것).**
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 진행 패널 행 칩(클릭 시 완료 토글/현재 행).**
- [ ] **Step 4 (커밋).**

---

## Task 18: `PresetGrid`

기존: `preset-grid > button[active]`(PRESETS.map, line ~2651).

**Files:** Create `src/components/PresetGrid.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 프리셋 격자 크기 버튼 그리드.
 * @param {object} props
 * @param {Array<{label:string,rows:number,cols:number}>} props.presets
 * @param {number} props.rows - 현재 행
 * @param {number} props.cols - 현재 열
 * @param {(rows:number, cols:number) => void} props.onSelect
 */
export function PresetGrid({ presets, rows, cols, onSelect }) {
  return (
    <div className="preset-grid">
      {presets.map((preset) => (
        <button
          key={preset.label}
          className={rows === preset.rows && cols === preset.cols ? 'active' : ''}
          onClick={() => onSelect(preset.rows, preset.cols)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2:** export 추가. App.jsx `preset-grid` → `<PresetGrid presets={PRESETS} rows={rows} cols={cols} onSelect={requestGridResize} />`.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 격자 설정 프리셋 그리드(선택 시 리사이즈 확인 모달).**
- [ ] **Step 4 (커밋).**

---

## Task 19: `MovePad`

기존: `move-pad`(3x3 방향 패드 + 중앙 칸 수, line ~2690).

**Files:** Create `src/components/MovePad.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * 도안 이동용 방향 패드. 상/하/좌/우 버튼 + 중앙 라벨.
 * @param {object} props
 * @param {(dr:number, dc:number) => void} props.onMove - (행델타, 열델타)
 * @param {React.ReactNode} props.centerLabel
 * @param {boolean} [props.disabled]
 * @param {number} [props.iconSize=15]
 */
export function MovePad({ onMove, centerLabel, disabled, iconSize = 15 }) {
  return (
    <div className="move-pad">
      <span />
      <button onClick={() => onMove(-1, 0)} disabled={disabled} title="도안 위로 이동"><ArrowUp size={iconSize} /></button>
      <span />
      <button onClick={() => onMove(0, -1)} disabled={disabled} title="도안 왼쪽으로 이동"><ArrowLeft size={iconSize} /></button>
      <div>{centerLabel}</div>
      <button onClick={() => onMove(0, 1)} disabled={disabled} title="도안 오른쪽으로 이동"><ArrowRight size={iconSize} /></button>
      <span />
      <button onClick={() => onMove(1, 0)} disabled={disabled} title="도안 아래로 이동"><ArrowDown size={iconSize} /></button>
      <span />
    </div>
  );
}
```

- [ ] **Step 2:** export 추가. App.jsx `move-pad` → `<MovePad onMove={movePattern} centerLabel={`${paintedCellCount}칸`} disabled={!paintedCellCount} />`.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 격자 설정 "도안 이동" 패드(4방향 이동 동작).**
- [ ] **Step 4 (커밋).**

---

## Task 20: `StepperControl`

기존: `insert-control`(- 라벨 + 사이 라벨 + +, 행/열 추가, line ~2706~2900대). 위 행/아래 행/좌 열/우 열 4개 반복.

**Files:** Create `src/components/StepperControl.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
import { Minus, Plus } from 'lucide-react';

/**
 * -/라벨/+ 스테퍼. 행·열 추가/제거 컨트롤.
 * @param {object} props
 * @param {React.ReactNode} props.label
 * @param {() => void} props.onAdd
 * @param {() => void} props.onRemove
 * @param {boolean} [props.addDisabled]
 * @param {boolean} [props.removeDisabled]
 * @param {string} [props.addTitle]
 * @param {string} [props.removeTitle]
 * @param {number} [props.iconSize=14]
 */
export function StepperControl({ label, onAdd, onRemove, addDisabled, removeDisabled, addTitle, removeTitle, iconSize = 14 }) {
  return (
    <div className="insert-control">
      <button className="remove" onClick={onRemove} disabled={removeDisabled} title={removeTitle} aria-label={removeTitle}><Minus size={iconSize} /></button>
      <span>{label}</span>
      <button onClick={onAdd} disabled={addDisabled} title={addTitle} aria-label={addTitle}><Plus size={iconSize} /></button>
    </div>
  );
}
```

- [ ] **Step 2:** export 추가. App.jsx의 `insert-control` 4개를 각각 `StepperControl`로 치환(라벨/핸들러/disabled 조건을 기존 그대로 매핑). 예(위 행): `<StepperControl label="위 행" onAdd={() => insertRow('above')} onRemove={() => removeRow('above')} addDisabled={rows >= 200} removeDisabled={rows <= 1 || insertAnchorCell.row === 0} addTitle="기준 위에 행 추가" removeTitle="기준 위 행 제거" />`.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 격자 설정 "행/열 추가" 4개 컨트롤(추가/제거 동작 + disabled).**
- [ ] **Step 4 (커밋).**

---

## Task 21: `Badge`

기존: `<span className={`local-save-state state-${localSaveState}`}>`(line ~2301). 저장 상태 핀.

**Files:** Create `src/components/Badge.jsx`; Modify `index.js`, `App.jsx`.

- [ ] **Step 1:** 생성:

```jsx
/**
 * 상태 핀/뱃지. state로 변형 클래스를 만든다(state-${state}).
 * @param {object} props
 * @param {string} [props.state] - 'saved' | 'saving' | 'error' 등 → state-${state}
 * @param {string} [props.baseClassName='local-save-state']
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 */
export function Badge({ state, baseClassName = 'local-save-state', title, children }) {
  const classes = [baseClassName, state ? `state-${state}` : ''].filter(Boolean).join(' ');
  return (
    <span className={classes} title={title}>
      {children}
    </span>
  );
}
```

- [ ] **Step 2:** export 추가. App.jsx `local-save-state` → `<Badge state={localSaveState} title={localSaveMessage || localSaveStatusLabel}>{localSaveStatusLabel}</Badge>`.
- [ ] **Step 3 (검증):** 빌드 통과. **검증 화면: 상단바 저장 상태 핀(로컬 저장 눌러 상태 전이).**
- [ ] **Step 4 (커밋).**

---

## Task 22: 최종 정리 & 전체 회귀 검증

**Files:** Modify `src/App.jsx`(미사용 import 정리), `src/components/index.js`(최종 확인), `package.json`(라이브러리 진입점 추가).

- [ ] **Step 1:** App.jsx에서 컴포넌트화로 더 이상 직접 쓰지 않는 lucide 아이콘 import를 정리한다(단, 컴포넌트 파일들이 자체 import하므로 App에서만 제거). ESLint/빌드 경고 확인.
- [ ] **Step 2:** `package.json`에 라이브러리 진입점 추가(앱 빌드 스크립트는 유지):

```json
"exports": { ".": "./src/components/index.js" }
```

- [ ] **Step 3:** `src/components/index.js`에 19개 export가 모두 있는지 확인:
  Button, IconButton, FileButton, SegmentedControl, Slider, TextField, NumberField, Select, Toggle, Panel, Toolbar, ToolRail, Modal, StatusBar, Swatch, PaletteRow, Chip, PresetGrid, MovePad, StepperControl, Badge.
- [ ] **Step 4 (전체 회귀 검증):** `pnpm build` 통과. 앱 실행 후 **전체 시나리오 한 바퀴**:
  - Edit/Preview/Progress 모드 전환
  - 4개 패널 전부, 인스펙터 접기/펼치기
  - 4종 모달 열고 닫기
  - 핵심 인터랙션: 펜으로 그리기, 지우개, 채우기(fill), 스포이드, 좌우반전, 회전, 반복, 도안 이동, 행/열 추가, 줌, 프리셋 리사이즈, 팔레트 추가/편집/병합/삭제, 이미지 업로드→크롭→적용, PNG/PDF/JSON 내보내기, 로컬 저장/열기.
  - 기준선 스크린샷과 전 화면 육안 비교 — 차이 0.
- [ ] **Step 5 (검증):** `git status`로 `src/styles.css`가 변경되지 않았는지 확인(`git diff --stat src/styles.css`는 비어야 함).
- [ ] **Step 6 (커밋):**

```bash
git add -A
git commit -m "refactor: 컴포넌트 라이브러리 추출 완료 + 라이브러리 진입점

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 완료 기준 (스펙 성공 기준과 일치)

- `pnpm build` 통과.
- 앱이 리라이트 전과 시각·동작 동일(전 모드/패널/모달/핵심 인터랙션).
- `src/components/`의 ~19개 컴포넌트가 전부 순수 표현형이고 `index.js`에서 export됨.
- App 마크업이 추출 컴포넌트로 치환되어 중복/드리프트 없음.
- `src/styles.css` 무변경.

## 후속 (이 플랜 범위 밖)

라이브러리 완성 후 `/design-sync`를 재실행해 claude.ai/design에 동기화한다(package shape, Storybook 없음, 단일 styles.css, 시맨틱 클래스 기반 conventions 헤더 작성).
