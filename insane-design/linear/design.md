---
schema_version: 3.2
slug: linear
service_name: Linear
site_url: https://linear.app
fetched_at: 2026-06-26
default_theme: dark
brand_color: "#5E6AD2"
primary_font: Inter
font_weight_normal: 400
token_prefix: "--color-"

bold_direction: Cool Productivity
aesthetic_category: Cool Productivity
signature_element: minimal_extreme
code_complexity: medium

medium: web
medium_confidence: high

archetype: app-dashboard
archetype_confidence: high
design_system_level: lv3
design_system_level_evidence: "LCH-based semantic color system, refined neutral ramp + single indigo brand, styled-components token vars, documented public design system."

colors:
  bg: "#08090A"            # signature near-black surface
  surface: "#0F1011"       # raised panel
  surface-2: "#16171A"     # elevated
  border: "#23252A"        # crisp hairline
  border-strong: "#33363D"
  text: "#F7F8F8"          # near-white
  text-muted: "#8A8F98"    # muted gray
  text-faint: "#62666D"
  brand: "#5E6AD2"         # Linear indigo
  brand-light: "#818FFF"   # lighter indigo (on dark)
  brand-hover: "#6E79EC"
  white: "#FFFFFF"
  black: "#000000"

typography:
  display: "Inter"
  body: "Inter"
  mono: "Berkeley Mono"
  weights_used: [400, 510, 538, 590, 680]
  weights_absent: [100, 200, 300, 900]

components:
  button-primary: { bg: "{colors.brand}", color: "{colors.white}", radius: "8px" }
  button-secondary: { bg: "{colors.surface}", color: "{colors.text}", border: "{colors.border}", radius: "8px" }
---

# DESIGN.md — Linear (Claude Code Edition)

---

## 00. Direction & Metaphor
<!-- SOURCE: manual -->

### Narrative

Linear reads like a precision instrument machined from a single block of graphite. The surface is a near-black `#08090A (`{colors.bg}`)` — not pure black, a hair warmer and softer — and everything is built in tightly-controlled neutral grays. Where most products shout in color, Linear is almost monochrome: text in near-white `#F7F8F8 (`{colors.text}`)`, secondary information dropping to a muted `#8A8F98 (`{colors.text-muted}`)`, structure drawn with crisp 1px hairlines at `#23252A (`{colors.border}`)`.

Color is a privilege, not a default. A single indigo — `#5E6AD2 (`{colors.brand}`)`, brightening to `#818FFF` on dark surfaces — is rationed for the moments that matter: a primary action, a focused state, a status accent. It never floods the interface. The discipline is the brand: Linear proves that restraint reads as quality.

Typography is Inter (their refined cut), set at intentional sizes with subtle negative tracking on display, and a narrow band of weights (400 / 510 / 538 / 590) — no extreme bolds, no hairline lights. Geometry is calm: an 8px radius on cards and buttons, generous-but-disciplined spacing, and motion that is fast and frictionless (150–200ms) — never decorative.

The whole system is engineered for **focus**. Dense data, zero noise, one accent. It is the canonical "cool productivity" surface.

### Key Characteristics

- Near-black neutral base `#08090A` (not pure black) — warm-cool refined dark
- Tight neutral gray ramp; text near-white `#F7F8F8`, muted `#8A8F98`
- Single indigo brand `#5E6AD2` / `#818FFF`, rationed to actions/focus/status
- Crisp 1px hairline borders `#23252A` — structure in line, not shadow
- Inter, narrow weight band (400–590), subtle negative display tracking
- Calm 8px radius, disciplined spacing
- Fast frictionless motion (150–200ms), never decorative
- Monochrome-dominant — color is an event, not a default

---

### 🤖 Direction Summary (Machine Interface — DO NOT EDIT)

> **BOLD Direction**: Cool Productivity
> **Aesthetic Category**: Cool Productivity
> **Signature Element**: 이 사이트는 **near-black neutral surface with a single rationed indigo accent (minimal_extreme)**으로 기억된다.
> **Code Complexity**: medium — refined neutral system, subtle borders/glows, fast transitions, restrained accent.

---

## 01. Quick Start
<!-- SOURCE: manual -->

> 5분 안에 Linear처럼 만들기

```css
/* 1. 폰트 */
body { font-family: "Inter", -apple-system, sans-serif; font-weight: 400; }

/* 2. 배경 + 텍스트 (dark-first, neutral) */
:root { --bg: #08090A; --fg: #F7F8F8; --muted: #8A8F98; --border: #23252A; }
body { background: var(--bg); color: var(--fg); }

/* 3. 브랜드 — 아껴 쓰기 */
:root { --brand: #5E6AD2; }   /* 포인트로만 — 남발 금지 */
```

**절대 하지 말아야 할 것 하나**: 브랜드 인디고를 인터페이스 전반에 칠하는 것. Linear의 정체성은 **무채색 + 가끔의 포인트**다 — 색을 줄일수록 Linear에 가까워진다.

---

## 02. Provenance
<!-- SOURCE: auto -->

| | |
|---|---|
| Source URL | `https://linear.app` |
| Fetched | 2026-06-26 |
| Extractor | curl Chrome UA (Tier 1) |
| HTML size | 2.4MB (Next.js + styled-components SSR) |
| CSS files | 81개 외부 컴포넌트 CSS + 261KB 인라인 styled-components |
| Token prefix | `--color-` (LCH-based 글로벌 토큰) |
| Method | styled-components 클래스 + 컴포넌트 CSS 파싱 |

---

## 03. Tech Stack
<!-- SOURCE: auto+manual -->

- **Framework**: Next.js + **styled-components** (`/*!sc*/` markers, per-component CSS chunks)
- **Design system**: Linear DS — **LCH color space** semantic tokens (famous for perceptual-uniform color)
- **CSS architecture**: global `--color-*` LCH tokens → styled-components → component classes
- **Default theme**: dark (`#08090A`) — light theme also supported
- **Font loading**: Inter (refined cut) self-hosted + Berkeley Mono
- **Canonical anchor**: indigo `#5E6AD2`

---

## 04. Font Stack
<!-- SOURCE: auto+manual -->

- **Display / body**: `Inter` (Linear's refined variable cut)
- **Mono**: `Berkeley Mono` / SF Mono
- **Weight normal / bold**: `400` / `590`

```css
:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "Berkeley Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
```

### Note on Font Substitutes
<!-- SOURCE: manual -->

- **Inter** is freely available — use directly. Linear's cut adds subtle tweaks; stock Inter at weight 400/510/590 with `-0.012em` display tracking reads close.

---

## 05. Typography Scale
<!-- SOURCE: auto -->

| Token | Size | Weight | Tracking |
|---|---|---|---|
| `title-1` (hero) | 56–64px | 538 | -0.022em |
| `title-4` | 28–32px | 538 | -0.018em |
| `title-7` | 21px | 510 | -0.012em |
| `body` | 15–16px | 400 | normal |
| `small` | 13px | 400 | normal |
| `label` | 12px | 510 | normal |

### Principles
<!-- SOURCE: manual -->

1. Narrow weight band: 400 / 510 / 538 / 590 — no extreme bolds (700+) or thins.
2. Negative tracking on display only; body stays neutral.
3. Inter throughout — one type voice, calm and engineered.

---

## 06. Colors
<!-- SOURCE: auto -->

### 06-1. Brand (indigo — rationed)

| Token | Hex |
|---|---|
| `brand` | #5E6AD2 |
| `brand-light` (on dark) | #818FFF |
| `brand-hover` | #6E79EC |

### 06-2. Neutral Ramp (dark)

| Token | Hex |
|---|---|
| `bg` (near-black) | #08090A |
| `surface` | #0F1011 |
| `surface-2` | #16171A |
| `border` | #23252A |
| `border-strong` | #33363D |
| `text` (near-white) | #F7F8F8 |
| `text-muted` | #8A8F98 |
| `text-faint` | #62666D |

### 06-3. Neutral Ramp (light)

| Token | Hex |
|---|---|
| `bg` | #FFFFFF |
| `surface` | #F8F8F9 |
| `border` | #E6E6E8 |
| `text` | #08090A |
| `text-muted` | #6B6F76 |

### 06-8. Color Stories
<!-- SOURCE: manual -->

> **`{colors.bg}` (#08090A)** — The signature near-black. Not pure `#000000` — a hair of warmth keeps it from feeling like a void. Everything else is built on this floor.

> **`{colors.brand}` (#5E6AD2)** — The only chromatic value, an indigo rationed to primary actions, focus rings, and status. On dark it brightens to `#818FFF`. Used everywhere it would be ordinary; here it stays special.

> **`{colors.text}` (#F7F8F8)** — Near-white text. Softened off pure white to reduce glare on the dark surface.

> **`{colors.border}` (#23252A)** — Crisp 1px hairline. Linear draws structure with line, not shadow — borders do the elevation work.

---

## 07. Spacing
<!-- SOURCE: auto -->

| Token | Value |
|---|---|
| 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px | (8px base rhythm) |

### Whitespace Philosophy
<!-- SOURCE: manual -->

Linear is dense but never cramped — it packs information at an 8px rhythm with disciplined gutters. The calm comes from restraint in color and weight, not from empty space. Every pixel earns its place.

---

## 08. Radius
<!-- SOURCE: auto -->

| Token | Value | Context |
|---|---|---|
| `radius-sm` | 4px | chips, inputs |
| `radius` | 8px | cards, buttons (default) |
| `radius-lg` | 12px | panels, modals |
| `radius-round` | 9999px | avatars, status pills |

> Calm, consistent 8px radius — neither sharp nor playful. Engineered neutrality.

---

## 10. Motion
<!-- SOURCE: auto+manual -->

| Token | Value | Usage |
|---|---|---|
| transition | 150–200ms cubic-bezier(0.4,0,0.2,1) | hover/state |
| glow | subtle radial brand glow | hero accents only |

> Fast, frictionless, never decorative — motion serves speed, not spectacle.

---

## 11. Layout Patterns
<!-- SOURCE: auto+manual -->

### Grid System
- **Content max-width**: ~1024–1200px
- **Grid type**: Flexbox + app sidebar layout
- **Sidebar**: left nav, dense list rows

### Hero
- **Pattern Summary**: `near-black bg + large near-white H1 (538 weight) + muted subtext + product screenshot`
- Background: solid `#08090A` with subtle radial brand glow
- H1: 56–64px / weight 538 / tracking -0.022em / near-white

### Card / Panel
- bg `{colors.surface}` (#0F1011), 1px `{colors.border}`, radius 8px, no/low shadow
- Elevation by border + subtle bg lift, not heavy shadow

### Navigation
- Top bar: logo + minimal links + white "Sign up" pill (white on dark)
- App: left sidebar, dense rows, tiny status accents

---

## 13. Components
<!-- SOURCE: auto+manual -->

### Buttons

| Spec | `button-primary` | `button-secondary` | `button-white` |
|---|---|---|---|
| Background | `{colors.brand}` (#5E6AD2) | `{colors.surface}` | `{colors.white}` |
| Text | `{colors.white}` | `{colors.text}` | `{colors.black}` |
| Border | none | 1px `{colors.border}` | none |
| Radius | 8px | 8px | 8px / pill |
| Note | rationed primary action | default | top-nav "Sign up" |

### 13-3. Signature Micro-Specs
<!-- SOURCE: manual -->

```yaml
near-black-not-black:
  description: "Base is #08090A, never pure #000000"
  technique: "background: #08090A — a warmer, softer near-black"
  visual_signature: "Depth without a void"

rationed-single-accent:
  description: "One indigo, used only where it matters"
  technique: "brand #5E6AD2 / #818FFF on actions/focus/status ONLY"
  visual_signature: "Color reads as quality because it's rare"

hairline-elevation:
  description: "Structure drawn with 1px borders, not shadow"
  technique: "border: 1px solid #23252A; minimal box-shadow"
  visual_signature: "Crisp, engineered, flat-but-layered"

narrow-weight-band:
  description: "Inter at 400/510/538/590 — no extremes"
  technique: "font-weight limited; negative tracking on display only"
  visual_signature: "Calm, even typographic color"

fast-frictionless-motion:
  description: "150–200ms transitions, never decorative"
  technique: "transition: 160ms cubic-bezier(0.4,0,0.2,1)"
  visual_signature: "Software that feels instant"
```

---

## 15. Drop-in CSS
<!-- SOURCE: auto+manual -->

```css
/* Linear — copy into your root stylesheet */
:root {
  --font-sans: "Inter", -apple-system, sans-serif;

  /* Neutral (dark-first) */
  --l-bg:        #08090A;   /* {colors.bg} */
  --l-surface:   #0F1011;   /* {colors.surface} */
  --l-surface-2: #16171A;
  --l-border:    #23252A;   /* {colors.border} */
  --l-border-strong: #33363D;
  --l-text:      #F7F8F8;   /* {colors.text} */
  --l-muted:     #8A8F98;   /* {colors.text-muted} */
  --l-faint:     #62666D;

  /* Brand — rationed */
  --l-brand:       #5E6AD2; /* {colors.brand} */
  --l-brand-light: #818FFF;
  --l-brand-hover: #6E79EC;

  /* Radius */
  --l-radius-sm: 4px; --l-radius: 8px; --l-radius-lg: 12px;
}

body { background: var(--l-bg); color: var(--l-text); font-family: var(--font-sans); }
.btn { border-radius: var(--l-radius); background: var(--l-brand); color: #fff; border: 0; padding: 8px 14px; transition: background 160ms cubic-bezier(0.4,0,0.2,1); }
.btn--secondary { background: var(--l-surface); color: var(--l-text); border: 1px solid var(--l-border); }
.card { background: var(--l-surface); border: 1px solid var(--l-border); border-radius: var(--l-radius); }
```

---

## 17. Agent Prompt Guide
<!-- SOURCE: manual -->

### Quick Color Reference

| Role | Token | Hex |
|---|---|---|
| Brand (rationed) | `{colors.brand}` | #5E6AD2 |
| Background (dark) | `{colors.bg}` | #08090A |
| Surface | `{colors.surface}` | #0F1011 |
| Text | `{colors.text}` | #F7F8F8 |
| Muted | `{colors.text-muted}` | #8A8F98 |
| Border | `{colors.border}` | #23252A |

### Iteration Guide
- **색상**: 무채색이 기본. 브랜드 인디고는 primary action / focus / status에만. 남발 금지.
- **고도(elevation)**: 그림자 대신 1px 보더로. surface는 bg보다 한 단계 밝게.
- **타이포**: Inter, weight 400–590. display에만 음수 tracking.
- **radius**: 8px 일관. 각지거나 과도하게 둥글게 X.

---

## 18. DO / DON'T
<!-- SOURCE: manual -->

### ✅ DO

- 무채색 베이스: dark `#08090A` / light `#FFFFFF`, 텍스트 near-white/near-black
- 브랜드 인디고 `#5E6AD2`는 포인트로만 (action/focus/status)
- 구조는 1px 보더 `#23252A`로 — 그림자 최소
- Inter, weight 400–590, display 음수 tracking
- 8px radius 일관, 빠른 150–200ms 트랜지션

### ❌ DON'T

- 배경을 순흑 `#000000`으로 두지 말 것 — 대신 `#08090A` 사용
- 브랜드 컬러를 인터페이스 전반에 칠하지 말 것 — 포인트로만
- 깊이를 무거운 `box-shadow`로 만들지 말 것 — 1px 보더로
- weight `700` 이상 / `300` 이하 극단 사용 자제 — 400~590 밴드
- 채도 높은 다색 팔레트 금지 — 무채색 + 단일 인디고

### 🚫 What This Site Doesn't Use (Negative-Space Identity)
<!-- SOURCE: manual -->

- **Pure black**: never — `#08090A`, a softened near-black
- **Multi-color palette**: none — one indigo accent only
- **Heavy shadows**: rare — 1px borders carry elevation
- **Extreme weights**: 700+/300- absent — narrow 400–590 band
- **Decorative motion**: none — transitions serve speed only

---

## 19. Known Gaps & Assumptions
<!-- SOURCE: manual -->

- **LCH tokens not fully extracted** — Linear's global color file (LCH-based) was not among the 12 CSS chunks grabbed; neutral ramp + brand reconstructed from component CSS (`#08090A`, `#818FFF`) + known Linear palette. Exact LCH values not captured.
- **Light theme partial** — Linear is dark-first; light values inferred from known Linear light mode, not fully sampled.
- **Single page** — marketing homepage only; in-app surfaces (board, issue view) have denser component specs not traced.
- **Weight values** — narrow band (400/510/538/590) inferred from styled-components vars; exact variable-font axis not extracted.
- **Motion curves** — transition timing approximated; exact cubic-bezier per component not fully sampled.
