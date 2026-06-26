---
schema_version: 3.2
slug: medium
service_name: Medium
site_url: https://medium.com
fetched_at: 2026-06-26
default_theme: light
brand_color: "#1A8917"
primary_font: sohne
font_weight_normal: 400
token_prefix: "--color-"

# apply Lv3 BOLD 리디자인 지원 필드
bold_direction: Editorial Magazine
aesthetic_category: Editorial Magazine
signature_element: typo_contrast
code_complexity: low

# 매체 분기
medium: web
medium_confidence: high

# Archetype + Design System Level
archetype: editorial-magazine
archetype_confidence: high
design_system_level: lv2
design_system_level_evidence: "Semantic CSS variables — --color-{bg|fg|border}-{neutral|accent|error|utility}-{primary..quaternary}, 19+ light-mode core tokens mirrored from src/styles/colors/global.ts, atomic styled-components class layer. A system in active use, no publicly-named DS."

# 데이터 객체화 (Cross-reference 토큰 그래프)
colors:
  accent-green: "#1A8917"        # --color-fg-accent-primary (brand)
  accent-green-hover: "#156D12"  # green button :hover
  accent-bg-secondary: "#BBDBBA" # --color-bg-accent-secondary
  accent-bg-tertiary: "#D2E7D1"  # --color-bg-accent-tertiary
  accent-bg-quaternary: "#E8F3E8"# --color-bg-accent-quaternary
  surface-cream: "#F7F4ED"       # marketing hero / nav surface
  surface-white: "#FFFFFF"       # --color-bg-neutral-primary (app/reading)
  surface-secondary: "#F2F2F2"   # --color-bg-neutral-secondary
  surface-tertiary: "#F9F9F9"    # --color-bg-neutral-tertiary
  ink: "#242424"                 # --color-fg-neutral-primary (body text)
  ink-muted: "#6B6B6B"           # --color-fg-neutral-secondary
  pure-black: "#000000"          # hero headline only
  pill-dark: "#191919"           # dark CTA background (rgba 25,25,25)
  border-strong: "#242424"       # --color-border-neutral-secondary (hairline rules)
  border-hairline: "#F2F2F2"     # --color-border-neutral-primary
  border-light: "#E5E5E5"        # --color-border-neutral-tertiary
  error: "#C94A4A"               # --color-fg-error-primary
  utility-yellow: "#FFFAE1"      # --color-bg-utility-yellow-primary
  utility-blue: "#E5F2FF"        # --color-bg-utility-blue-primary

typography:
  display: "gt-super"
  body: "sohne"
  reading: "charter"
  ladder:
    - { token: h1-hero, size: "70px→120px", weight: 400, line-height: "74px→100px", tracking: "-0.05em→-0.055em" }
    - { token: subtitle, size: "22px", weight: 400, line-height: "28px" }
    - { token: button, size: "16px", weight: 500, line-height: "24px" }
    - { token: nav-link, size: "14px", weight: 400, line-height: "20px" }
    - { token: footer, size: "13px", weight: 400 }
  weights_used: [300, 400, 500, 700]
  weights_absent: [100, 200, 600, 800, 900]

components:
  button-primary-dark:  { bg: "{colors.pill-dark}",  hover: "{colors.pure-black}",        color: "{colors.surface-white}", radius: "99em", padding: "8px 16px" }
  button-primary-green: { bg: "{colors.accent-green}", hover: "{colors.accent-green-hover}", color: "{colors.surface-white}", radius: "99em", padding: "8px 20px", width: "196px" }
  nav-link:    { color: "{colors.ink}", size: "14px", font: "sohne" }
  footer-link: { color: "{colors.ink-muted}", size: "13px" }
---

# DESIGN.md — Medium (Claude Code Edition)

---

## 00. Direction & Metaphor
<!-- SOURCE: manual -->

### Narrative

Medium reads like a literary magazine that learned to ship software. The logged-out homepage opens on a sheet of warm paper — `#F7F4ED (`{colors.surface-cream}`)`, not white — and lets a single serif headline do all the talking: **"Human stories & ideas"** set in GT Super at up to 120px, color pure `#000000 (`{colors.pure-black}`)`, tracking pulled tight to `-0.055em`. It's the masthead of a broadsheet, not the hero of a SaaS landing page.

The whole identity is a tension between two type personalities. **GT Super**, a high-contrast serif, carries the brand voice — the wordmark, the headline. **Söhne**, a clean grotesque sans, carries everything functional — nav, subtitle, buttons, footer. There is no third voice. The reading experience itself runs on **Charter**, the serif Medium serves into article bodies. Three fonts, three jobs, no overlap.

Color is rationed. The brand is a single grass green, `#1A8917 (`{colors.accent-green}`)` — Medium green — and it appears almost nowhere on the chrome. It lives in the hand-drawn flower-and-pen illustration, in inline links, and in one variant of the primary button. Everything else is ink: text at `#242424 (`{colors.ink}`)`, secondary at `#6B6B6B (`{colors.ink-muted}`)`. The page has **zero box-shadow and zero gradient** — structure is drawn with 1px rules, and not faint gray ones either: the nav and footer are separated by a near-black `#242424` hairline, the way a newspaper rules off a column.

The buttons are the only soft thing on the page. Every one is a full `99em` pill capsule; every other corner is square (`0`). That pill-and-square duality is the site's quiet signature. Curiously, Medium ships the primary CTA in two skins from the same component — a green pill (`{colors.accent-green}` → `{colors.accent-green-hover}` on hover) and a near-black pill (`{colors.pill-dark}` → `#000000`) — both 196px wide, both white-text, surfaced at different breakpoints.

Motion is almost absent. Transitions are `background-color`/`color` only, `300ms linear` — never a transform, never an animated shadow. The page doesn't perform; it sits there like a printed cover and trusts the typography. This is restraint as a brand: the editorial confidence to leave the right half of the hero as nothing but cream air and one green illustration.

### Key Characteristics

- Warm cream paper surface `#F7F4ED` for marketing — never `#FFFFFF` on the hero
- GT Super serif display (70–120px) vs Söhne sans body — masthead-over-editorial contrast
- Single grass-green accent `#1A8917`, rationed to illustration / links / one CTA skin
- Near-black `#242424` text (not pure black); pure `#000000` reserved for the hero headline
- 1px `#242424` hairline rules separate nav and footer — print-style, not soft gray
- Every button a `99em` pill; everything else square (`0` radius)
- Zero box-shadow, zero gradient anywhere on the page
- Display tracking tightens with size: `-0.05em` at 70px → `-0.055em` at 80–120px
- Weight 600 deliberately absent — the ladder jumps 500 → 700
- Motion limited to `300ms linear` color fades; no transforms

---

### 🤖 Direction Summary (Machine Interface — DO NOT EDIT)

> **BOLD Direction**: Editorial Magazine
> **Aesthetic Category**: Editorial Magazine
> **Signature Element**: 이 사이트는 **cream-paper canvas holding a GT Super serif masthead over a single rationed green (typo_contrast)**으로 기억된다.
> **Code Complexity**: low — CSS variables + one 300ms-linear color transition, pill buttons, no shadow/gradient/transform.

---

## 01. Quick Start
<!-- SOURCE: manual -->

> 5분 안에 Medium처럼 만들기 — 3가지만 하면 80%

```css
/* 1. 폰트 + weight */
body {
  font-family: "sohne", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 400;
}
h1, .display {
  font-family: "gt-super", Georgia, Cambria, "Times New Roman", Times, serif;
  letter-spacing: -0.055em;
  color: #000000;
}

/* 2. 배경 + 텍스트 */
:root { --bg: #F7F4ED; --fg: #242424; }   /* warm cream, NOT white */
body { background: var(--bg); color: var(--fg); }

/* 3. 브랜드 컬러 */
:root { --brand: #1A8917; --brand-hover: #156D12; }
```

**절대 하지 말아야 할 것 하나**: 마케팅 배경을 `#FFFFFF` 순백으로 두는 것. Medium의 정체성은 따뜻한 종이색 `#F7F4ED`다 — 순백으로 바꾸는 순간 "잡지"가 "앱 대시보드"가 된다.

---

## 02. Provenance
<!-- SOURCE: auto -->

| | |
|---|---|
| Source URL | `https://medium.com` |
| Fetched | 2026-06-26 |
| Extractor | curl 6-tier → Cloudflare challenge → Wayback Machine snapshot `20260625215241id_` |
| HTML size | 39,189 bytes (Next.js / styled-components SSR) |
| CSS files | 1개 외부 (`unbound.css`, 19KB 폰트 정의) + 15 인라인 `<style>` 블록, 총 ~27,000자 |
| Token prefix | `--color-` |
| Method | CSS 커스텀 프로퍼티 + atomic 클래스 직접 파싱 · AI 추론 없음 |

---

## 03. Tech Stack
<!-- SOURCE: auto+manual -->

- **Framework**: Next.js (server-rendered, `data-rh` React-Helmet hydration markers)
- **Design system**: Internal token system — prefix `--color-`, mirrored from `src/styles/colors/global.ts`
- **CSS architecture**: styled-components / glamor atomic classes over a semantic CSS-variable root
  ```
  Root tokens   (--color-{bg|fg|border}-*)   semantic light-mode hex
  Atomic layer  (.a .b .cl .em .ct ...)       single-property utility classes
  Component     (composed class strings)       e.g. "cl b eh ei ej ek el em eo ..."
  ```
- **Class naming**: 2-char atomic utilities (`.cl` = font-family sohne, `.em` = bg #1A8917) — generated, not BEM
- **Default theme**: light (bg = `#FFFFFF` system / `#F7F4ED` marketing). `color-scheme: light` forced; `enable_dark_mode_v0` gate OFF on this path
- **Font loading**: external `glyph.medium.com/css/unbound.css` `@font-face` (sohne, charter, gt-super, source-serif-pro, source-code-pro, fell, opendyslexic, noe)
- **Canonical anchor**: `--color-fg-accent-primary: #1a8917` — the brand green

---

## 04. Font Stack
<!-- SOURCE: auto+manual -->

- **Display font**: `gt-super` (GT Super, Grilli Type — commercial) — hero headline + wordmark
- **Body / UI font**: `sohne` (Söhne, Klim Type Foundry — commercial) — nav, subtitle, buttons, footer
- **Reading font**: `charter` (Charter, Matthew Carter — freely available) — article bodies
- **Code font**: `source-code-pro` (Adobe — open source)
- **Weight normal / bold**: `400` / `700`

```css
:root {
  --font-display: gt-super, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-body:    sohne, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-reading: charter, Georgia, "Cambria", serif;
  --font-code:    source-code-pro, Menlo, Monaco, "Courier New", monospace;
  --font-weight-normal: 400;
  --font-weight-bold:   700;
}
body { font-family: var(--font-body); font-weight: var(--font-weight-normal); }
```

### Note on Font Substitutes
<!-- SOURCE: manual -->

- **GT Super** (commercial) → open alternative: **Source Serif Pro** (Medium already ships it as a reading fallback) or **PT Serif** at display sizes; push `letter-spacing` to `-0.05em` to recover GT Super's tight display set. For higher contrast, **Playfair Display**.
- **Söhne** (commercial) → open alternative: **Inter** at weight 400, or simply Medium's own native stack `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Söhne is a Helvetica-genus grotesque — Inter/system stack reads close.
- **Charter** → freely licensed; use directly, fallback `Georgia`.

---

## 05. Typography Scale
<!-- SOURCE: auto -->

| Token | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| `h1-hero` (base) | 70px | 400 | 74px | -0.05em |
| `h1-hero` (sm↑) | 80px | 400 | 72px | -0.055em |
| `h1-hero` (md↑) | 106px | 400 | 95px | -0.055em |
| `h1-hero` (lg↑) | 120px | 400 | 100px | -0.055em |
| `subtitle` | 22px | 400 | 28px | — |
| `button-hero` | 16px | 500 | 24px | — |
| `button-alt` | 20px | 500 | 28px | — |
| `nav-link` | 14px | 400 | 20px | — |
| `footer-link` | 13px | 400 | — | — |

> ⚠️ The hero headline scales 70px → 120px across breakpoints while tracking *tightens* (`-0.05em` → `-0.055em`) — bigger type, tighter set. This optical compensation is the difference between "Medium" and "a serif on cream."

### Principles
<!-- SOURCE: manual -->

1. Two type personalities, strictly separated: **GT Super** (serif) for brand voice, **Söhne** (sans) for every functional surface. They never trade jobs.
2. **Weight 600 is absent.** The ladder uses 300 / 400 / 500 / 700 only — Medium jumps straight from medium to bold.
3. The hero headline is the *only* element in pure `#000000`. All other text sits at `#242424 (`{colors.ink}`)` — a softer ink.
4. Display tracking is negative and size-dependent (`-0.05em → -0.055em`); body and UI keep default tracking (`0`).
5. **Charter** is a distinct third font for reading — article bodies are serif, not the Söhne UI sans.
6. Numerals in the headline use `font-feature-settings: 'pnum' on, 'lnum' on` (proportional lining figures) so the ampersand and digits sit correctly.

---

## 06. Colors
<!-- SOURCE: auto -->

### 06-1. Brand (green family)
<!-- --color-fg-accent-primary + accent backgrounds -->

| Token | Hex |
|---|---|
| `accent-green` (brand / `--color-fg-accent-primary`) | #1A8917 |
| `accent-green-hover` (button :hover) | #156D12 |
| `accent-bg-secondary` (`--color-bg-accent-secondary`) | #BBDBBA |
| `accent-bg-tertiary` (`--color-bg-accent-tertiary`) | #D2E7D1 |
| `accent-bg-quaternary` (`--color-bg-accent-quaternary`) | #E8F3E8 |

### 06-3. Neutral Ramp (light)
<!-- SOURCE: auto -->

| Step | Token | Hex |
|---|---|---|
| Ink (text) | `--color-fg-neutral-primary` | #242424 |
| Ink muted | `--color-fg-neutral-secondary` | #6B6B6B |
| Pure black (headline only) | — | #000000 |
| Pill dark (CTA bg) | rgba(25,25,25) | #191919 |
| Surface cream (marketing) | — | #F7F4ED |
| Surface white | `--color-bg-neutral-primary` | #FFFFFF |
| Surface secondary | `--color-bg-neutral-secondary` | #F2F2F2 |
| Surface tertiary | `--color-bg-neutral-tertiary` | #F9F9F9 |
| Surface inverse | `--color-bg-neutral-quaternary` | #242424 |

### 06-4. Utility / Accent backgrounds
<!-- SOURCE: auto -->

| Family | Token | Hex |
|---|---|---|
| Yellow | `--color-bg-utility-yellow-primary` | #FFFAE1 |
| Blue | `--color-bg-utility-blue-primary` | #E5F2FF |

### 06-5. Semantic
<!-- SOURCE: auto -->

| Token | Hex | Usage |
|---|---|---|
| `--color-fg-error-primary` | #C94A4A | error text |
| `--color-bg-error-primary` | #C94A4A | error fill |
| `--color-border-error-primary` | #C94A4A | error border |

### 06-6. Borders / Hairlines
<!-- SOURCE: auto -->

| Token | Hex | Usage |
|---|---|---|
| `--color-border-neutral-secondary` | #242424 | **strong rules** — nav-bottom, footer-top, hero illustration block |
| `--color-border-neutral-primary` | #F2F2F2 | soft dividers |
| `--color-border-neutral-tertiary` | #E5E5E5 | lightest dividers |

### 06-7. Dominant Colors (CSS frequency)
<!-- SOURCE: auto -->

| Token | Hex | Frequency |
|---|---|---|
| accent-green | #1A8917 | 10 |
| ink | #242424 | 9 |
| pure-black | #000000 | 7 |
| error | #C94A4A | 6 |
| white | #FFFFFF | 6 |
| green-dark | #156D12 | 4 |
| surface-secondary | #F2F2F2 | 4 |
| surface-cream | #F7F4ED | 4 |

> ⚠️ The single highest-frequency *chromatic* hex is `#1A8917`. Many other chromatic hex in the raw CSS (`#0E0EFF`, `#AA0D91`, `#5C2699`, `#643820`, `#C41A16` …) come from the `.hljs-*` **syntax-highlighting** theme for code blocks — they are NOT brand colors and are excluded from the palette (see §19).

### 06-8. Color Stories
<!-- SOURCE: manual -->

> **`{colors.accent-green}` (#1A8917)** — Medium green, the single brand color. It is rationed: the hand-drawn illustration, inline article links, and one skin of the primary button. It is deliberately kept *off* the chrome — nav, text, and most CTAs stay neutral so the green still feels like an event. Hover deepens to `#156D12 (`{colors.accent-green-hover}`)`.

> **`{colors.surface-cream}` (#F7F4ED)** — Warm paper. The marketing surface that makes Medium feel like print rather than software. The system's *default* surface is white (`{colors.surface-white}`), but the logged-out homepage is staged on cream — the most important single decision on the page.

> **`{colors.ink}` (#242424)** — Body ink. Not `#000000`. Every functional word — nav, subtitle, footer — sits at this softened near-black. Pure black is held in reserve for one element: the hero headline.

> **`{colors.border-strong}` (#242424)** — The hairline. Medium separates nav and footer with a *1px near-black* rule, not a faint gray line. It reads like a newspaper column rule — structure drawn in ink instead of shadow.

---

## 07. Spacing
<!-- SOURCE: auto -->

| Token | Value | Use case |
|---|---|---|
| space-2xs | 8px | button padding (vertical), tight gaps |
| space-xs | 16px | button padding (horizontal), footer link gap |
| space-sm | 20px | green-button h-padding, footer link margin |
| space-md | 24px | container side margin (mobile), footer padding |
| space-nav | 25px | nav vertical padding, nav-link gap, logo margin |
| space-lg | 32px | headline margin-bottom (mobile) |
| space-xl | 48px | container side margin (md), headline margin-bottom |
| space-2xl | 64px | container side margin (lg), hero side margin |
| space-3xl | 75px | nav height, hero top margin |

**주요 alias**:
- nav: `padding: 25px 0; min-height: 75px`
- hero block: `margin: 75px {24|48|64}px 0`

### Whitespace Philosophy
<!-- SOURCE: manual -->

Medium spends its space on air, not density. The hero is `min-height: 560px` with the headline anchored to the *left* and the entire right half handed to a single floating illustration — no grid, no second column of content, just cream. Side margins breathe outward with the viewport (`24px → 48px → 64px`) while the text column is capped at `720px`, the classic Medium reading measure. The `75px` gap between the fixed nav and the hero top is the page taking a full breath before it says anything.

---

## 08. Radius
<!-- SOURCE: auto -->

| Token | Value | Context |
|---|---|---|
| `radius-pill` | 99em | **all buttons** (`.dc`) — full capsule |
| `radius-circle` | 50% | loading spinner, avatars (`.l`) |
| `radius-none` | 0 | everything else — cards, sections, surfaces |

> Medium has no mid-range radius. It is pills (`99em`) and circles (`50%`) for interactive elements, and hard `0` corners for every surface. The pill-vs-square duality is a signature — see §13-3.

---

## 09. Shadows
<!-- SOURCE: auto -->

> N/A — Medium's homepage uses **zero `box-shadow`**. All structural separation is carried by 1px hairline borders (`#242424` strong / `#E5E5E5` light). The absence is deliberate identity, not missing data (see §18 Negative-Space).

---

## 10. Motion
<!-- SOURCE: auto -->

| Token | Value | Usage |
|---|---|---|
| `transition-color` | `background-color 300ms linear` | button / surface hover (`.ba`) |
| `transition-button` | `background-color 300ms linear, color 300ms linear` | button text+bg (`.bb button`) |
| `spinner` | `rotate 0→360deg, 2s infinite linear` (`@keyframes k1`) | loading indicator (40px, 2px border) |

> Motion is `linear`, never eased, and limited to color — no `transform`, no animated shadow. The only keyframe animation on the page is the loading spinner.

---

## 11. Layout Patterns
<!-- SOURCE: auto+manual -->

### Grid System
- **Content max-width**: 1192px (nav/page container, `.bh`)
- **Grid type**: Flexbox (atomic flex utilities — `.g{display:flex}`, no CSS Grid on the hero)
- **Column count**: hero = 2 zones (text + absolute-positioned illustration), not a formal grid
- **Gutter**: side margins `24 / 48 / 64px` responsive

### Hero
- **Pattern Summary**: `min-height 560px + solid cream #F7F4ED + left-aligned GT Super H1 (70–120px) + pill CTA below + right absolute-positioned illustration`
- Layout: 2-zone split — left text column (`max-width: 720px`), right illustration absolutely positioned (`top: 54%`, `left: 782px`, `transform: translateY(-50%)`)
- Background: solid `#F7F4ED (`{colors.surface-cream}`)`
- **Background Treatment**: solid cream — no gradient, no noise, no image overlay
- H1: `70px → 120px` / weight `400` / tracking `-0.05em → -0.055em` / color `#000000`
- Max-width: 720px (text column)

### Section Rhythm
```css
.hero {
  background: #F7F4ED;          /* {colors.surface-cream} */
  min-height: 560px;
  margin: 75px 64px 0;          /* top, side(lg), bottom */
  overflow: hidden;
}
```

### Card Patterns
- **Homepage hero has no card components.** The right zone is a single illustration, not a card grid.
- Medium's feed (off this page) separates list items with hairline rules — no radius, no shadow. Not present on the LOHP; do not invent card chrome.

### Navigation Structure
- **Type**: horizontal bar, links + dark pill CTA
- **Position**: fixed (`position: fixed; top: 0; left: 0; right: 0`)
- **Height**: 75px (`padding: 25px 0`)
- **Background**: `#F7F4ED` cream (matches hero) / `#FFFFFF` on app surfaces
- **Border**: `border-bottom: solid 1px #242424` — the signature near-black rule
- **Container**: `max-width: 1192px`, logo 25px tall (`fill: #242424`)

### Content Width
- **Prose / reading max-width**: 680–720px
- **Container max-width**: 1192px
- **Footer max-width**: 680px

---

## 12. Responsive Behavior
<!-- SOURCE: auto+manual -->

### Breakpoints
Medium uses mobile-first atomic classes; exact `@media` boundaries are obscured by the generated class layer (see §19). Observed responsive steps:

| Name | Approx. | Behavior |
|---|---|---|
| Mobile | base | headline 70px, side margin 24px, margin-bottom 32px |
| Small | ~728px↑ | headline 80px, margin-bottom 48px |
| Medium | ~1080px↑ | headline 106px, side margin 48px |
| Large | ~1304px↑ | headline 120px, side margin 64px, illustration shown |

### Touch Targets
- **Nav height**: 75px (`min-height: 75px`)
- **Button height**: ~40px (8px vertical padding + 24px line-height)
- **CTA width**: 196px fixed (`.eu`)

### Collapsing Strategy
- **Navigation**: links collapse / hamburger at small widths (CTA pill persists)
- **Hero**: illustration (right zone) hidden at narrow widths; text column goes full-width
- **Headline**: down-scales 120 → 70px; tracking eases `-0.055em → -0.05em`
- **Side margins**: `64 → 48 → 24px`

### Image Behavior
- Hero illustration is absolutely positioned and clipped by `overflow: hidden` on the hero; it bleeds off the right edge at large sizes rather than scaling down.

---

## 13. Components
<!-- SOURCE: auto+manual -->

### Buttons

Two pill skins from the same component shape. Both: `border-radius: 99em`, `1px` border, white text, `transition: background-color 300ms linear`.

```html
<!-- dark pill (nav "Get started", desktop hero "Start reading") -->
<button class="pill pill--dark">Get started</button>
<!-- green pill ("Start reading" green variant) -->
<button class="pill pill--green">Start reading</button>
```

| Spec | `button-primary-dark` | `button-primary-green` |
|---|---|---|
| Background | `{colors.pill-dark}` (#191919) | `{colors.accent-green}` (#1A8917) |
| Hover bg | `{colors.pure-black}` (#000000) | `{colors.accent-green-hover}` (#156D12) |
| Text color | `{colors.surface-white}` | `{colors.surface-white}` |
| Padding | 8px 16px (nav) / 8px 20px | 8px 20px |
| Font | Söhne 14px (nav) / 16px | Söhne 16px / 24px lh |
| Radius | 99em | 99em |
| Border | 1px solid `{colors.pill-dark}` | 1px solid `{colors.accent-green}` |
| Width (hero) | 196px | 196px |
| Disabled | `opacity: 0.1`, `cursor: not-allowed` | `opacity: 0.3` |

### Navigation

```html
<nav class="nav">                <!-- fixed, 75px, border-bottom 1px #242424 -->
  <a class="nav__logo">Medium</a>           <!-- 25px tall, fill #242424 -->
  <a class="nav__link">Our story</a>        <!-- Söhne 14px/20px, #242424, mr 25px -->
  <a class="nav__link">Membership</a>
  <a class="nav__link">Write</a>
  <a class="nav__link">Sign in</a>
  <button class="pill pill--dark">Get started</button>
</nav>
```

| Spec | Value |
|---|---|
| Link font | Söhne 14px / 20px lh |
| Link color | `{colors.ink}` (#242424) |
| Link gap | 25px (`margin-right`) |
| Hover | `color: {colors.ink}` (no underline) |
| Bar border | `border-bottom: solid 1px {colors.border-strong}` |

### Inputs & Forms

> N/A — no input/form components on the logged-out homepage. Focus / error / placeholder states unobserved (see §19).

### Hero Section

Covered in §11. Left text column (GT Super H1 + Söhne 22px subtitle + pill CTA), right floating illustration on cream.

### 13-2. Named Variants
<!-- SOURCE: manual -->

| Variant | Notes |
|---|---|
| `button-primary-dark` | `{colors.pill-dark}` → `{colors.pure-black}` hover. Nav "Get started", desktop hero "Start reading". |
| `button-primary-green` | `{colors.accent-green}` → `{colors.accent-green-hover}` hover. Green "Start reading" skin. |
| `nav-link` | Söhne 14px, `{colors.ink}`, 25px gap, no underline on hover. |
| `footer-link` | Söhne 13px, `{colors.ink-muted}`, `text-decoration: underline` on hover. |

### 13-3. Signature Micro-Specs
<!-- SOURCE: manual -->

```yaml
black-hairline-rule:
  description: "Print-style column rules instead of soft dividers or shadow"
  technique: "border-bottom/top: solid 1px var(--color-border-neutral-secondary)  /* #242424 */"
  applied_to: ["nav (bottom)", "footer (top)", "hero illustration block"]
  visual_signature: "Newspaper rule — structure in ink, not gray"

gt-super-tightening-display:
  description: "Display tracking tightens as size grows"
  technique: "letter-spacing: -0.05em @70px → -0.055em @80-120px"
  applied_to: ["h1-hero (GT Super) only — body keeps 0"]
  visual_signature: "Cohesive masthead at any size"

pill-and-square-duality:
  description: "Interactive = full capsule, everything else = hard corners"
  technique: "border-radius: 99em on buttons; 50% on spinner; 0 elsewhere"
  applied_to: ["all buttons", "spinner/avatars", "(0 on all surfaces)"]
  visual_signature: "Soft CTAs floating on a square editorial grid"

dual-skin-cta:
  description: "Same 196px pill ships green and near-black from one component"
  technique: "green (.em #1A8917 / .ep:hover #156D12) vs dark (.ct #191919 / .cv:hover #000000)"
  applied_to: ["Start reading (green @ one breakpoint, dark @ desktop)", "Get started (dark)"]
  visual_signature: "Brand green as an alternate CTA mood"

color-only-linear-motion:
  description: "Restrained, un-eased, color-only transitions"
  technique: "transition: background-color 300ms linear, color 300ms linear — no transform/shadow"
  applied_to: ["all buttons", "hover surfaces"]
  visual_signature: "The page never performs; type carries it"

warm-paper-surface:
  description: "Marketing staged on cream, app stays white"
  technique: "background: #F7F4ED on hero/nav; --color-bg-neutral-primary #FFFFFF reserved for app/reading"
  applied_to: ["LOHP hero", "fixed nav over hero"]
  visual_signature: "Reads like printed paper, not a dashboard"

proportional-lining-numerals:
  description: "Headline figures/ampersand sit on the lining baseline"
  technique: "font-feature-settings: 'pnum' on, 'lnum' on"
  applied_to: ["h1-hero (GT Super)"]
  visual_signature: "'Human stories & ideas' ampersand correctly weighted"
```

---

## 14. Content / Copy Voice
<!-- SOURCE: manual -->

| Pattern | Rule | Example |
|---|---|---|
| Headline | Human, declarative, two-line serif fragment | "Human stories & ideas" |
| Subheading | Lowercase, plain, verb-led | "A place to read, write, and deepen your understanding" |
| Primary CTA | Action verb, 2 words | "Start reading" |
| Nav CTA | Invitation, 2 words | "Get started" |
| Tone | Literary, warm, unhurried — a publisher's voice, not a SaaS pitch | |

---

## 15. Drop-in CSS
<!-- SOURCE: auto+manual -->

```css
/* Medium — copy into your root stylesheet */
:root {
  /* Fonts */
  --font-display: gt-super, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-body:    sohne, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-reading: charter, Georgia, serif;
  --font-code:    source-code-pro, Menlo, Monaco, monospace;
  --font-weight-normal: 400;
  --font-weight-bold:   700;

  /* Brand */
  --color-brand:        #1A8917;  /* {colors.accent-green} ← canonical */
  --color-brand-hover:  #156D12;  /* {colors.accent-green-hover} */
  --color-brand-bg:     #E8F3E8;  /* {colors.accent-bg-quaternary} */

  /* Surfaces */
  --bg-marketing: #F7F4ED;        /* {colors.surface-cream} — NOT white */
  --bg-app:       #FFFFFF;        /* {colors.surface-white} */
  --bg-secondary: #F2F2F2;        /* {colors.surface-secondary} */
  --text:         #242424;        /* {colors.ink} */
  --text-muted:   #6B6B6B;        /* {colors.ink-muted} */
  --text-display: #000000;        /* {colors.pure-black} — headline only */
  --pill-dark:    #191919;        /* {colors.pill-dark} */

  /* Borders */
  --rule-strong:  #242424;        /* {colors.border-strong} — 1px nav/footer rule */
  --rule-light:   #E5E5E5;        /* {colors.border-light} */

  /* Spacing */
  --space-sm:  16px;
  --space-md:  24px;
  --space-lg:  48px;
  --space-xl:  64px;

  /* Radius */
  --radius-pill:   99em;
  --radius-circle: 50%;

  /* Motion */
  --transition: background-color 300ms linear, color 300ms linear;
}

body { background: var(--bg-marketing); color: var(--text); font-family: var(--font-body); font-weight: 400; }
h1 { font-family: var(--font-display); color: var(--text-display); letter-spacing: -0.055em; }
.btn { border-radius: var(--radius-pill); border: 1px solid var(--pill-dark); background: var(--pill-dark); color: #fff; padding: 8px 16px; transition: var(--transition); }
.btn:hover { background: #000; }
.btn--green { background: var(--color-brand); border-color: var(--color-brand); }
.btn--green:hover { background: var(--color-brand-hover); border-color: var(--color-brand-hover); }
nav { border-bottom: solid 1px var(--rule-strong); }
```

---

## 16. Tailwind Config
<!-- SOURCE: auto+manual — convenience; Medium itself uses styled-components, not Tailwind -->

```js
// tailwind.config.js — Medium
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1A8917', hover: '#156D12', bg: '#E8F3E8' },
        cream: '#F7F4ED',
        ink: { DEFAULT: '#242424', muted: '#6B6B6B', pure: '#000000' },
        pill: '#191919',
        rule: { strong: '#242424', light: '#E5E5E5' },
        error: '#C94A4A',
      },
      fontFamily: {
        display: ['gt-super', 'Georgia', 'serif'],
        sans:    ['sohne', 'Helvetica Neue', 'Arial', 'sans-serif'],
        reading: ['charter', 'Georgia', 'serif'],
        mono:    ['source-code-pro', 'ui-monospace'],
      },
      fontWeight: { normal: '400', bold: '700' },
      borderRadius: { pill: '99em', circle: '50%' },
      transitionTimingFunction: { medium: 'linear' },
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
| Brand primary | `{colors.accent-green}` | #1A8917 |
| Background (marketing) | `{colors.surface-cream}` | #F7F4ED |
| Background (app) | `{colors.surface-white}` | #FFFFFF |
| Text primary | `{colors.ink}` | #242424 |
| Text muted | `{colors.ink-muted}` | #6B6B6B |
| Headline | `{colors.pure-black}` | #000000 |
| Rule / border | `{colors.border-strong}` | #242424 |
| Error | `{colors.error}` | #C94A4A |

### Example Component Prompts

#### Hero Section
```
Medium 스타일 히어로 섹션을 만들어줘.
- 배경: #F7F4ED 단색 (그라디언트/그림자 없음), min-height 560px
- H1: gt-super серif, 80~120px, weight 400, tracking -0.055em, color #000000, 좌측 정렬
- 서브텍스트: sohne, 22px, color #242424
- CTA: pill 버튼(border-radius 99em), 배경 #191919(또는 그린 #1A8917), 흰 텍스트, padding 8px 20px, width 196px
- 우측: 손그림 일러스트 1개 (absolute, 우측에서 bleed)
- 텍스트 컬럼 max-width: 720px
```

#### Navigation
```
Medium 스타일 상단 네비를 만들어줘.
- position: fixed, height 75px, 배경 #F7F4ED
- 하단 border: solid 1px #242424 (옅은 회색 아님!)
- 로고: 좌측, 25px 높이, fill #242424, gt-super serif 워드마크
- 링크: sohne 14px/20px, color #242424, 간격 25px
- CTA: 우측, 다크 pill (#191919, hover #000000)
```

#### Button
```
Medium 스타일 pill 버튼을 만들어줘.
- border-radius: 99em (완전 캡슐), border 1px
- 다크: bg #191919, text #fff, hover bg #000000
- 그린: bg #1A8917, text #fff, hover bg #156D12
- padding 8px 20px, font sohne 16px weight 500
- transition: background-color 300ms linear (transform 없음)
```

### Iteration Guide

- **색상 변경 시**: brand green `#1A8917`은 accent/CTA/링크에만. 본문엔 절대 쓰지 말 것. 마케팅 배경은 `#F7F4ED` 고정.
- **폰트 변경 시**: display=GT Super(serif), body=Söhne(sans), reading=Charter(serif). 셋을 섞지 말 것. weight는 300/400/500/700만 — **600 금지**.
- **여백 조정 시**: 8 / 16 / 24 / 48 / 64 / 75px 스케일만.
- **radius**: 버튼=99em, 원형=50%, 나머지=0. 중간값(8~12px) 금지.
- **깊이 표현**: box-shadow 금지 — 1px `#242424` 또는 `#E5E5E5` 보더로만.

---

## 18. DO / DON'T
<!-- SOURCE: manual -->

### ✅ DO

- 마케팅 표면은 따뜻한 크림 `#F7F4ED`, 앱/리딩 표면은 `#FFFFFF`로 분리할 것
- GT Super(serif display) + Söhne(sans body)를 짝지을 것 — 역할 고정
- 모든 버튼을 pill(`border-radius: 99em`)로 만들 것
- nav/footer 구분은 `1px solid #242424` 하드 라인으로 그릴 것
- 본문 텍스트 `#242424`, 보조 텍스트 `#6B6B6B`, 헤드라인만 `#000000`
- 브랜드 그린 `#1A8917`, hover `#156D12` — accent/CTA/링크에만
- display tracking `-0.055em` (큰 사이즈일수록 더 타이트하게)

### ❌ DON'T

- 마케팅 배경을 `#FFFFFF` 또는 `white`로 두지 말 것 — 대신 `#F7F4ED` 사용
- 본문 텍스트를 `#000000` 또는 `black`으로 두지 말 것 — 대신 `#242424` 사용 (순흑은 hero 헤드라인 전용)
- `font-weight: 600` 사용 금지 — Medium은 500 다음 700 (600 부재)
- 버튼을 `border-radius: 8px` 같은 고정 px로 두지 말 것 — `border-radius: 99em` 사용
- nav/footer 강조 라인을 `#E5E5E5` 옅은 회색으로 두지 말 것 — `#242424` 1px 사용
- `box-shadow`로 깊이 만들지 말 것 — Medium은 그림자 0개, 1px 보더만
- `linear-gradient`/`radial-gradient` 사용 금지 — Medium은 단색 fill만
- 브랜드 그린 `#1A8917`을 본문 텍스트나 chrome 전반에 쓰지 말 것 — accent 전용
- hover에 `transform`/`scale`/`box-shadow` 애니메이션 쓰지 말 것 — `background-color 300ms linear`만

### 🚫 What This Site Doesn't Use (Negative-Space Identity)
<!-- SOURCE: manual -->

- **Box-shadow**: zero — no shadows anywhere; 1px hairlines do all structural work
- **Gradients**: none — flat solid fills only, on every surface
- **Weight 600**: absent — only 300 / 400 / 500 / 700 are used
- **Mid-range radius**: none — only `99em` pill and `50%` circle; every surface is `0`
- **Pure black on text**: never on body — `#000000` appears on the hero headline alone
- **Transform / scale hover**: none — interactions are color-only, `300ms linear`
- **Second brand color**: none — `{colors.accent-green}` is the only chromatic brand value
- **Card chrome on the homepage**: none — illustration + type carry the hero, no bordered/shadowed cards
- **Eased motion**: none — every transition is `linear`, never `ease`/`cubic-bezier`

---

## 19. Known Gaps & Assumptions
<!-- SOURCE: manual -->

- **Single page only** — analysis covers the logged-out homepage (LOHP). The feed, article reader, editor, profile, and settings surfaces were not visited and may use different chassis (cards, inputs, dark mode).
- **Cloudflare managed challenge** — live `medium.com` returns a "Just a moment…" JS challenge to curl/Jina. HTML + CSS were recovered from a **Wayback Machine snapshot (`20260625215241`, 2026-06-25)**; the rendered screenshot came from Jina's browser farm against the live site. The two sources are ~1 day apart.
- **Green vs black CTA unresolved** — the archived CSS ships *both* a green pill (`#1A8917`) and a near-black pill (`#191919`) for "Start reading" from one component. The live desktop screenshot shows the **black** pill; the green variant surfaces at a different breakpoint or A/B bucket. Which renders when is not fully determined.
- **Breakpoint values inferred** — styled-components atomic classes hide raw `@media` boundaries. Breakpoint approximations (~728 / ~1080 / ~1304px) are reconstructed from the headline-scale class steps, not read directly from media queries.
- **Syntax-highlighting hex excluded** — many chromatic hex in the CSS (`#0E0EFF`, `#AA0D91`, `#5C2699`, `#643820`, `#C41A16`, `#836C28`, `#9B703F`, `#3F6E74`) belong to the `.hljs-*` XCode code-block theme, not the brand. They were filtered out of the palette (pitfall #12 analog) — automatic separation confidence ~90%.
- **Dark mode not captured** — this CSS path is explicitly light-only (`enable_dark_mode_v0` gate OFF; `color-scheme: light` forced). The dark token mapping is not emitted on this route and was not observed.
- **No form components** — the homepage has no inputs; focus / error / placeholder / loading states for forms are unobserved.
- **Reading typography assumed, not rendered** — Charter / Source Serif Pro / GT Super are declared in `unbound.css` `@font-face`, but article-body rendering (drop-caps, reading measure, line-height) was not seen on the LOHP.
- **Nav background ambiguous** — the fixed nav sits over the `#F7F4ED` hero; whether it is transparent-over-cream or an explicit cream fill (vs `#FFFFFF` on app pages) is not certain from the atomic classes.
- **Exact hero illustration treatment** — the right-zone illustration is absolutely positioned (`top:54%`, `left:782px`) and clipped; its responsive scaling/asset swapping was not traced.
