---
schema_version: 3.2
slug: arc
service_name: Arc
site_url: https://arc.net
fetched_at: 2026-06-26
default_theme: light
brand_color: "#3139FB"
primary_font: Marlin Soft SQ
font_weight_normal: 400
token_prefix: "--colors-"

bold_direction: Playful Gradient
aesthetic_category: Playful Gradient
signature_element: section_transition
code_complexity: high

medium: web
medium_confidence: high

archetype: saas-marketing
archetype_confidence: medium
design_system_level: lv2
design_system_level_evidence: "Semantic --colors-brand* tokens (brandBlue/DeepBlue/DarkBlue/Red/Offwhite) + numeric scales (--radii/--space/--sizes/--fontSizes) + Stitches atomic .c-* classes. System in use, no public DS name."

colors:
  brand-blue: "#3139FB"        # --colors-brandBlue (primary brand)
  brand-deep-blue: "#2404AA"   # --colors-brandDeepBlue
  brand-dark-blue: "#000354"   # --colors-brandDarkBlue (deep navy CTA/footer)
  brand-purple: "#2702C2"      # primaryLightAlt button bg
  brand-red: "#FB3A4D"         # --colors-brandRed (playful accent)
  offwhite: "#FFFCEC"          # --colors-brandOffwhite (warm paper surface)
  cream: "#FFFADD"             # iridescent warm tint
  ink: "#171717"               # primary text
  muted: "#6A6A6A"             # secondary text
  border: "#E2E2E2"            # hairline
  focus: "#96C4FF"             # --colors-focusOutline
  high-contrast: "#000000"     # --colors-highContrast
  low-contrast: "#FFFFFF"      # --colors-lowContrast
  iris-lavender: "#C6C8F9"     # gradient stop
  iris-blue: "#96C4FF"         # gradient stop
  iris-peach: "#FEF1ED"        # gradient stop
  iris-amber: "#FFB223"        # gradient stop / accent
  blue-bright: "#0047FF"       # bright link/cta blue

typography:
  display: "Marlin Soft SQ"
  display-wide: "Sohne Breit"
  serif: "EB Garamond"
  mono: "ABC Favorit Mono"
  body: "Inter"
  ladder:
    - { token: h1-hero, size: "45.51px→48px", weight: 700 }
    - { token: h2, size: "32px→36px", weight: 600 }
    - { token: h3, size: "24px→28px", weight: 600 }
    - { token: body, size: "16px→20px", weight: 400 }
    - { token: label-mono, size: "12px→14px", weight: 400, family: "ABC Favorit Mono" }
  weights_used: [100, 350, 400, 500, 510, 600, 650, 700, 750, 800, 900]
  weights_absent: [200, 300]

components:
  button-primary-dark: { bg: "{colors.brand-dark-blue}", color: "{colors.low-contrast}", radius: "9999px" }
  button-primary-purple: { bg: "{colors.brand-purple}", color: "{colors.low-contrast}", radius: "9999px" }
  button-light: { bg: "{colors.low-contrast}", color: "{colors.brand-purple}", radius: "9999px" }
---

# DESIGN.md — Arc (Claude Code Edition)

---

## 00. Direction & Metaphor
<!-- SOURCE: manual -->

### Narrative

Arc stages a browser like a children's book illustrator stages a story — warm, bright, and unafraid of color. The page opens not on white but on `#FFFCEC (`{colors.offwhite}`)`, a buttery offwhite, with an iridescent spectrum gradient melting across the top: peach `#FEF1ED`, cream `#FFFADD`, lavender `#C6C8F9`, sky `#96C4FF`. It reads like sunlight through a prism. Where Medium whispers, Arc sings.

The identity is built on a **single electric blue**, `#3139FB (`{colors.brand-blue}`)` — a saturated indigo that feels almost UI-native, the color of a focused cursor. It anchors the brand, then escalates: full-bleed sections flip to deep `#2702C2 (`{colors.brand-purple}`)` and navy `#000354 (`{colors.brand-dark-blue}`)`, turning the page into a sequence of bold color rooms. A testimonial section is entirely electric blue with reversed white serif type; the next is warm peach. Each scroll is a new world.

Against the blue, a hot `#FB3A4D (`{colors.brand-red}`)` plays the joker — used sparingly for emphasis, a pop of warmth that keeps the palette from feeling corporate. The supporting palette is wide and confident: ambers `#FFB223`, peaches `#F0B167`, lavenders — a five-to-seven color spectrum, the opposite of restraint.

Type is a chorus, not a soloist. **Marlin Soft SQ** (a friendly squared grotesque) carries headlines and body; **Söhne Breit** goes wide and heavy for statement moments; a serif (**EB Garamond** / Exposure) handles editorial quotes; and **ABC Favorit Mono** / Space Mono set the eyebrows and labels in monospace — that "M M M M (4.0) M" mono texture at the footer is pure Arc. Weights span the full variable range, 100 to 900, including oddball intermediates (350, 510, 650, 750).

Geometry is soft and generous. Corners round at `8 / 12 / 16 / 32px`, buttons are full `9999px` pills, and the spacing scale is roomy (`4` up to `72px`). Nothing is sharp. The whole surface invites a tap.

### Key Characteristics

- Warm offwhite base `#FFFCEC` — never plain white on marketing surfaces
- Iridescent spectrum gradient hero (peach → cream → lavender → sky)
- Single electric-blue brand `#3139FB`, escalating to purple `#2702C2` / navy `#000354`
- Drastic per-section color worlds — light hero, full-bleed blue, warm peach
- Hot red `#FB3A4D` as a rationed playful pop
- Multi-voice type: Marlin Soft + Söhne Breit + serif + ABC Favorit Mono labels
- Full variable-weight range 100–900 incl. 350/510/650/750
- Generous rounding (8/12/16/32px) + `9999px` pill buttons
- Roomy spacing scale 4–72px
- Mono eyebrows/labels as a signature texture

---

### 🤖 Direction Summary (Machine Interface — DO NOT EDIT)

> **BOLD Direction**: Playful Gradient
> **Aesthetic Category**: Playful Gradient
> **Signature Element**: 이 사이트는 **iridescent gradient hero escalating into drastic full-bleed color sections (section_transition)**으로 기억된다.
> **Code Complexity**: high — multi-stop gradients, variable fonts across 100–900, pill geometry, lively hover, per-section color flips.

---

## 01. Quick Start
<!-- SOURCE: manual -->

> 5분 안에 Arc처럼 만들기

```css
/* 1. 폰트 + weight */
body {
  font-family: "Marlin Soft SQ", "Inter", -apple-system, sans-serif;
  font-weight: 400;
}
.eyebrow, .label { font-family: "ABC Favorit Mono", "Space Mono", monospace; }

/* 2. 배경 + 텍스트 */
:root { --bg: #FFFCEC; --fg: #171717; }   /* warm offwhite, NOT white */
body { background: var(--bg); color: var(--fg); }

/* 3. 브랜드 컬러 */
:root { --brand: #3139FB; --brand-deep: #2702C2; --brand-red: #FB3A4D; }
```

**절대 하지 말아야 할 것 하나**: 모서리를 각지게(`border-radius: 0`) 두는 것. Arc의 정체성은 둥근 부드러움이다 — 버튼은 `9999px` 알약, 카드는 `12~16px`.

---

## 02. Provenance
<!-- SOURCE: auto -->

| | |
|---|---|
| Source URL | `https://arc.net` |
| Fetched | 2026-06-26 |
| Extractor | curl Chrome UA (Tier 1, no challenge) |
| HTML size | 660,164 bytes (Next.js + Stitches SSR) |
| CSS files | 1개 외부 (`df28c1bc1b1a6c7d.css`, 6KB) + 4 인라인 블록 (총 ~235KB) |
| Token prefix | `--colors-` / `--radii-` / `--space-` / `--fontSizes-` |
| Method | CSS 커스텀 프로퍼티 + Stitches atomic 클래스 직접 파싱 |

---

## 03. Tech Stack
<!-- SOURCE: auto+manual -->

- **Framework**: Next.js (SSR) + **Stitches** CSS-in-JS (`.c-*` atomic class hashes)
- **Design system**: Internal token system — `--colors-brand*` + numeric scales
- **CSS architecture**: token vars → Stitches atomic classes → composed components
  ```
  --colors-*    semantic brand tokens (brandBlue, brandRed, …)
  --radii/-space/-sizes/-fontSizes  numeric scales (2,4,8,12,16,32 / 4..72 / 10..48)
  .c-bCeQxv-*   generated atomic/variant classes
  ```
- **Default theme**: light (offwhite base) with full-bleed vivid color sections
- **Font loading**: self-hosted Marlin Soft SQ, Söhne Breit, ABC Favorit Mono, EB Garamond + Inter fallback
- **Canonical anchor**: `--colors-brandBlue: #3139FB`

---

## 04. Font Stack
<!-- SOURCE: auto+manual -->

- **Display / body**: `Marlin Soft SQ` (commercial — friendly squared grotesque)
- **Wide display**: `Sohne Breit` / `Sohne Breit Extrafett` (commercial — extra-wide heavy)
- **Serif (editorial quotes)**: `EB Garamond` (open) / Exposure VAR (commercial)
- **Mono (eyebrows/labels)**: `ABC Favorit Mono` (commercial) / `Space Mono` (open)
- **Body fallback**: `Inter` / `InterVariable`
- **Weight normal / bold**: `400` / `700`

```css
:root {
  --font-display: "Marlin Soft SQ", "Inter", -apple-system, sans-serif;
  --font-wide:    "Sohne Breit", "Inter", sans-serif;
  --font-serif:   "EB Garamond", Georgia, serif;
  --font-mono:    "ABC Favorit Mono", "Space Mono", Monaco, monospace;
}
```

### Note on Font Substitutes
<!-- SOURCE: manual -->

- **Marlin Soft SQ** (commercial) → open alternative: **Quicksand** or **Nunito** (friendly rounded), or **Inter** at 500. Marlin is a softened/squared grotesque — Inter reads close at body sizes.
- **Söhne Breit** (commercial, extra-wide) → **Archivo Expanded** or `font-stretch: expanded` on a grotesque.
- **EB Garamond** → freely available; use directly.
- **ABC Favorit Mono** (commercial) → **Space Mono** (Arc itself uses it as a sibling) or **JetBrains Mono**.

---

## 05. Typography Scale
<!-- SOURCE: auto -->

| Token | Size | Weight | Family |
|---|---|---|---|
| `h1-hero` | 45.51px → 48px | 700 | Marlin Soft / serif |
| `h2` | 32px → 36px | 600 | Marlin Soft |
| `h3` | 24px → 28px | 600 | Marlin Soft |
| `body-lg` | 20px | 400 | Marlin Soft / Inter |
| `body` | 16px → 17px | 400 | Inter |
| `label-mono` | 12px → 14px | 400 | ABC Favorit Mono |
| `caption` | 10px → 13px | 400 | mono / sans |

Scale tokens: `--fontSizes` 10 / 12 / 14 / 16 / 20 / 24 / 32 / 36 / 40 / 48px.

### Principles
<!-- SOURCE: manual -->

1. **Type is a chorus**: display sans (Marlin Soft), wide heavy (Söhne Breit), serif (EB Garamond), and mono (ABC Favorit) each have a job — Arc mixes all four on one page.
2. **Mono is the eyebrow voice** — labels, eyebrows, footer metadata set in ABC Favorit / Space Mono.
3. **Full variable-weight range** 100–900, including intermediates 350 / 510 / 650 / 750 — opposite of a restrained ladder.
4. Editorial quotes go **serif** (EB Garamond / Exposure), often reversed white on electric blue.

---

## 06. Colors
<!-- SOURCE: auto -->

### 06-1. Brand (blue family)

| Token | Hex |
|---|---|
| `brand-blue` (`--colors-brandBlue`) | #3139FB |
| `brand-deep-blue` (`--colors-brandDeepBlue`) | #2404AA |
| `brand-dark-blue` (`--colors-brandDarkBlue`) | #000354 |
| `brand-purple` (primaryLightAlt) | #2702C2 |
| `blue-bright` | #0047FF |

### 06-2. Playful Accent

| Token | Hex | Role |
|---|---|---|
| `brand-red` (`--colors-brandRed`) | #FB3A4D | hot pop / emphasis |
| `iris-amber` | #FFB223 | warm accent |
| `accent-orange` | #F0B167 | gradient / warm |

### 06-3. Surfaces / Neutrals

| Token | Hex | Usage |
|---|---|---|
| `offwhite` (`--colors-brandOffwhite`) | #FFFCEC | warm paper base |
| `cream` | #FFFADD | warm tint |
| `low-contrast` (`--colors-lowContrast`) | #FFFFFF | white surface |
| `ink` | #171717 | primary text |
| `muted` | #6A6A6A | secondary text |
| `border` | #E2E2E2 | hairline |
| `high-contrast` (`--colors-highContrast`) | #000000 | max-contrast text |

### 06-4. Iridescent Gradient Stops

| Token | Hex |
|---|---|
| `iris-peach` | #FEF1ED |
| `cream` | #FFFADD |
| `iris-lavender` | #C6C8F9 |
| `iris-blue` / `focus` | #96C4FF |

### 06-7. Dominant Colors (CSS frequency)

| Token | Hex | Frequency |
|---|---|---|
| brand-blue | #3139FB | 11 |
| white | #FFFFFF | 11 |
| offwhite | #FFFCEA | 9 |
| brand-purple | #2702C2 | 4 |
| ink/black | #000000 | 3 |
| brand-deep-blue | #2404AA | 3 |

### 06-8. Color Stories
<!-- SOURCE: manual -->

> **`{colors.brand-blue}` (#3139FB)** — Arc blue. A saturated indigo that feels native to software — the color of a focused cursor. The single brand anchor; it escalates to `{colors.brand-purple}` and `{colors.brand-dark-blue}` for full-bleed sections.

> **`{colors.offwhite}` (#FFFCEC)** — Buttery warm paper. The base surface that keeps Arc from feeling like a cold tech product. Never plain white on marketing.

> **`{colors.brand-red}` (#FB3A4D)** — The joker. A hot coral-red rationed for emphasis and play — keeps a blue-dominant palette warm and human.

> **`{colors.ink}` (#171717)** — Near-black text on offwhite. Soft enough to sit on cream without harshness.

---

## 07. Spacing
<!-- SOURCE: auto -->

| Token | Value |
|---|---|
| space-4 | 4px |
| space-8 | 8px |
| space-12 | 12px |
| space-16 | 16px |
| space-24 | 24px |
| space-32 | 32px |
| space-40 | 40px |
| space-48 | 48px |
| space-56 | 56px |
| space-64 | 64px |
| space-72 | 72px |

### Whitespace Philosophy
<!-- SOURCE: manual -->

Arc gives sections room to become color worlds. Full-bleed bands of electric blue or peach get generous vertical padding (48–72px), letting one big statement or testimonial own the viewport before the next color takes over. The spacing scale is even and roomy — Arc is comfortable, not dense.

---

## 08. Radius
<!-- SOURCE: auto -->

| Token | Value | Context |
|---|---|---|
| `radii-2` | 2px | hairline insets |
| `radii-4` | 4px | small chips |
| `radii-8` | 8px | inputs, small cards |
| `radii-12` | 12px | cards |
| `radii-16` | 16px | panels, product frames |
| `radii-32` | 32px | large hero cards |
| `radii-round` | 9999px | **pill buttons** |

> Arc rounds everything. The signature is the generous `12–16px` card radius and the `9999px` pill button — soft, tappable, friendly.

---

## 10. Motion
<!-- SOURCE: auto+manual -->

| Token | Value | Usage |
|---|---|---|
| transition | ~200–300ms ease | hover color/transform |
| gradient | animated multi-stop spectrum (hero) | iridescent shimmer |

> Arc's motion is lively — hover transforms, the shimmering hero gradient, playful micro-interactions (Playful Gradient aesthetic = rich motion).

---

## 11. Layout Patterns
<!-- SOURCE: auto+manual -->

### Grid System
- **Content max-width**: ~1100–1200px centered
- **Grid type**: Flexbox + centered columns
- **Gutter**: 16–24px

### Hero
- **Pattern Summary**: `iridescent gradient bg + centered serif/sans H1 + dark pill CTA + product screenshot below`
- Layout: centered, single column
- Background: **iridescent spectrum gradient** (peach → cream → lavender → sky)
- **Background Treatment**: multi-stop gradient mesh (the Arc signature) — NOT solid
- H1: 45.51–48px / weight 700, dark ink
- CTA: dark navy/`#000354` pill "Try Dia →"

### Section Rhythm
```css
section {            /* each section a color world */
  padding: 56px 24px;
  /* bg flips: offwhite hero -> #3139FB blue band -> peach */
}
```

### Card Patterns
- **Card bg**: white / offwhite
- **Card radius**: 12–16px (generous)
- **Card border**: 1px #E2E2E2 or none (color/shadow carries)
- **Card shadow**: soft elevation

### Navigation
- **Type**: horizontal bar (Arc ▾ / Mobile / Developers / Students / Blog)
- **Position**: top
- **CTA**: dark pill

---

## 13. Components
<!-- SOURCE: auto+manual -->

### Buttons

Pill buttons (`border-radius: 9999px`), multiple skins:

| Spec | `button-primary-dark` | `button-primary-purple` | `button-light` |
|---|---|---|---|
| Background | `{colors.brand-dark-blue}` (#000354) | `{colors.brand-purple}` (#2702C2) | `{colors.low-contrast}` (#FFF) |
| Text | `{colors.low-contrast}` | `{colors.low-contrast}` | `{colors.brand-purple}` |
| Radius | 9999px | 9999px | 9999px |
| Use | hero "Try Dia →" / Download | section CTA | reversed-on-color CTA |

### Navigation
- Horizontal links, mono/sans, dark pill CTA on the right.

### 13-2. Named Variants
<!-- SOURCE: manual -->

| Variant | Notes |
|---|---|
| `button-primary-dark` | navy `{colors.brand-dark-blue}` pill — hero/download |
| `button-primary-purple` | `{colors.brand-purple}` pill — in-section CTA |
| `button-light` | white pill, purple text — reversed on blue band |
| `eyebrow-mono` | ABC Favorit Mono label / eyebrow |

### 13-3. Signature Micro-Specs
<!-- SOURCE: manual -->

```yaml
iridescent-spectrum-gradient:
  description: "Soft multi-stop prism gradient — the Arc hero signature"
  technique: "linear/radial gradient through peach #FEF1ED -> cream #FFFADD -> lavender #C6C8F9 -> sky #96C4FF"
  applied_to: ["hero background", "section accents"]
  visual_signature: "Sunlight through a prism"

color-room-sections:
  description: "Each scroll section is a distinct bold color world"
  technique: "full-bleed bg flips: #FFFCEC offwhite -> #3139FB blue -> peach"
  applied_to: ["section backgrounds"]
  visual_signature: "Walking through colored rooms"

pill-everything:
  description: "All buttons full-round capsules"
  technique: "border-radius: var(--radii-round) /* 9999px */"
  applied_to: ["all CTAs"]
  visual_signature: "Soft, tappable, friendly"

mono-eyebrow-texture:
  description: "Labels and eyebrows set in monospace"
  technique: "font-family: ABC Favorit Mono / Space Mono on .eyebrow/.label"
  applied_to: ["eyebrows", "footer metadata", "captions"]
  visual_signature: "Technical-playful texture under display type"

variable-weight-chorus:
  description: "Full variable range with odd intermediates"
  technique: "font-weight: 100/350/400/500/510/600/650/700/750/800/900"
  applied_to: ["display + body"]
  visual_signature: "Many voices, one type system"
```

---

## 15. Drop-in CSS
<!-- SOURCE: auto+manual -->

```css
/* Arc — copy into your root stylesheet */
:root {
  /* Fonts */
  --font-display: "Marlin Soft SQ", "Inter", -apple-system, sans-serif;
  --font-serif:   "EB Garamond", Georgia, serif;
  --font-mono:    "ABC Favorit Mono", "Space Mono", Monaco, monospace;

  /* Brand */
  --color-brand:       #3139FB;   /* {colors.brand-blue} ← canonical */
  --color-brand-deep:  #2702C2;   /* {colors.brand-purple} */
  --color-brand-navy:  #000354;   /* {colors.brand-dark-blue} */
  --color-brand-red:   #FB3A4D;   /* {colors.brand-red} */
  --color-focus:       #96C4FF;   /* {colors.focus} */

  /* Surfaces */
  --bg-offwhite: #FFFCEC;   /* {colors.offwhite} — NOT white */
  --bg-cream:    #FFFADD;
  --surface:     #FFFFFF;
  --text:        #171717;   /* {colors.ink} */
  --text-muted:  #6A6A6A;
  --border:      #E2E2E2;

  /* Spacing */
  --space-8: 8px; --space-16: 16px; --space-24: 24px; --space-32: 32px; --space-48: 48px;

  /* Radius */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-pill: 9999px;
}

body { background: var(--bg-offwhite); color: var(--text); font-family: var(--font-display); }
.btn { border-radius: var(--radius-pill); background: var(--color-brand-navy); color: #fff; border: 0; padding: 12px 22px; }
.btn--purple { background: var(--color-brand-deep); }
.eyebrow { font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.04em; }
.card { border-radius: var(--radius-md); background: #fff; border: 1px solid var(--border); }
```

---

## 16. Tailwind Config
<!-- SOURCE: auto+manual -->

```js
// tailwind.config.js — Arc
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#3139FB', deep: '#2702C2', navy: '#000354', red: '#FB3A4D' },
        offwhite: '#FFFCEC', cream: '#FFFADD',
        ink: { DEFAULT: '#171717', muted: '#6A6A6A' },
        focus: '#96C4FF', border: '#E2E2E2',
      },
      fontFamily: {
        display: ['Marlin Soft SQ', 'Inter', 'sans-serif'],
        serif: ['EB Garamond', 'Georgia', 'serif'],
        mono: ['ABC Favorit Mono', 'Space Mono', 'monospace'],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '32px', pill: '9999px' },
    },
  },
};
```

---

## 17. Agent Prompt Guide
<!-- SOURCE: manual -->

### Quick Color Reference

| Role | Token | Hex |
|---|---|---|
| Brand primary | `{colors.brand-blue}` | #3139FB |
| Brand deep | `{colors.brand-purple}` | #2702C2 |
| CTA navy | `{colors.brand-dark-blue}` | #000354 |
| Accent pop | `{colors.brand-red}` | #FB3A4D |
| Background | `{colors.offwhite}` | #FFFCEC |
| Text | `{colors.ink}` | #171717 |
| Border | `{colors.border}` | #E2E2E2 |
| Focus | `{colors.focus}` | #96C4FF |

### Example Component Prompts

#### Hero Section
```
Arc 스타일 히어로를 만들어줘.
- 배경: 이리데센트 그라디언트 (#FEF1ED → #FFFADD → #C6C8F9 → #96C4FF)
- H1: Marlin Soft / serif, 48px, weight 700, color #171717, 중앙 정렬
- 서브: 16-20px, #6A6A6A
- CTA: navy #000354 pill (border-radius 9999px), 흰 텍스트, "Try Dia →"
- 아래: 제품 스크린샷 (radius 16px, soft shadow)
```

#### Button
```
Arc 스타일 pill 버튼을 만들어줘.
- border-radius: 9999px, padding 12px 22px, border 0
- navy: bg #000354 / purple: bg #2702C2 / light: bg #fff text #2702C2
- font Marlin Soft 16px weight 600
```

### Iteration Guide
- **색상**: brand blue `#3139FB` 앵커. 섹션마다 색을 과감히 전환(offwhite → blue → peach). red `#FB3A4D`는 강조에만.
- **폰트**: display=Marlin Soft, eyebrow/label=mono, quote=serif. 섞어 쓰는 게 정체성.
- **radius**: 버튼 9999px, 카드 12–16px. 각지게 만들지 말 것.

---

## 18. DO / DON'T
<!-- SOURCE: manual -->

### ✅ DO

- 배경은 따뜻한 오프화이트 `#FFFCEC`, 섹션마다 과감한 색 전환
- 일렉트릭 블루 `#3139FB` 앵커 + 퍼플 `#2702C2` + navy `#000354` 에스컬레이션
- 버튼은 pill (`border-radius: 9999px`), 카드는 12–16px
- eyebrow/label은 monospace (ABC Favorit / Space Mono)
- red `#FB3A4D`는 플레이풀한 포인트로만
- 이리데센트 그라디언트로 히어로/섹션에 깊이

### ❌ DON'T

- 배경을 `#FFFFFF` 순백으로 두지 말 것 (마케팅) — 대신 `#FFFCEC` 사용
- 모서리를 `border-radius: 0` 각지게 두지 말 것 — pill `9999px` / card `12px`
- 단색 flat 배경만 쓰지 말 것 — Arc는 그라디언트와 색 전환이 핵심
- 폰트를 한 종류로만 쓰지 말 것 — display/mono/serif 혼용이 정체성
- brand blue `#3139FB`를 텍스트 본문에 남발하지 말 것 — 앵커/CTA/링크에
- 채도를 죽이지 말 것 — Arc는 vivid, 회색조로 만들면 정체성 상실

### 🚫 What This Site Doesn't Use (Negative-Space Identity)
<!-- SOURCE: manual -->

- **Sharp corners**: none — every surface rounds (8–32px), buttons fully pill
- **Cold gray base**: none — the floor is warm `#FFFCEC`, not neutral gray
- **Single-font restraint**: none — Arc deliberately runs 4+ font families
- **Monochrome**: never — a 5–7 color spectrum is core
- **Flat solid-only sections**: rare — gradients and color flips carry depth

---

## 19. Known Gaps & Assumptions
<!-- SOURCE: manual -->

- **Single page only** — arc.net landing (Arc/Dia marketing). App UI, pricing, blog not analyzed.
- **Stitches atomic classes** obscure exact per-component specs — radius/padding values inferred from token scales (`--radii`, `--space`) + observed rules, not every component traced.
- **Exact gradient stops** — the iridescent hero is a multi-stop gradient/asset; stop positions and angles approximated from sampled colors, not the precise CSS gradient string.
- **Font rendering** — Marlin Soft SQ / Söhne Breit / ABC Favorit / Exposure are commercial and self-hosted; substitutes (§04) approximate, exact metrics differ.
- **Per-section color sequence** — the full-bleed color bands (offwhite → blue → peach) were sampled from the hero screenshot; deeper-scroll sections beyond the fold not fully captured.
- **Motion** — hover/scroll animation logic (likely JS/IntersectionObserver) not analyzed; only CSS transitions observed.
- **Variable-weight axes** — the 350/510/650/750 intermediate weights confirm variable fonts, but exact axis ranges not extracted.
