# KnitGrid — how to build with these components

KnitGrid is a Korean knitting-chart editor. All 21 components are **presentational and prop-driven**; state lives in your app. UI copy is Korean. No theme provider or context is required — just render the components; the design system stylesheet is already loaded.

## Styling idiom: semantic CSS classes (NOT utility classes, NOT style props)

Components carry their own semantic class names (`.panel`, `.tool-rail`, `.palette-swatch`, …). You style by **composing components inside the right container** and passing the container's class via `className` — never by inventing utility classes or passing color/spacing props. The full class vocabulary lives in the bound stylesheet (read it before styling): **`styles.css`** (→ `_ds_bundle.css`). Each component also has a `<Name>.prompt.md` (usage) and `<Name>.d.ts` (`<Name>Props`).

## ⚠ Critical: button styling is container-dependent

`Button`/`IconButton` get their real look from an **ancestor container class**. A bare `<Button variant="primary">` renders nearly unstyled. Place buttons in one of these:

- **Toolbars / action rows** → wrap in `<Toolbar className="command-group">`. `variant="primary"` turns blue only here.
- **Modal actions** → pass buttons to `<Modal actions={…}>` (renders inside `.image-modal-actions`). `variant="primary"` (blue) and `variant="danger"` (red) render only inside modal-actions / delete contexts.
- `wide` buttons (`<Button wide>`) are self-styled and work anywhere.

Other leaf controls also live inside containers, matching the app:
- Form fields (`NumberField`, `TextField`, `Select`) → inside `<Panel>`; pair numbers in `<div className="two-cols">`.
- `Chip` → inside `<div className="row-chips">`. `StepperControl` → inside `<div className="insert-grid">`. `PaletteRow` → inside `<div className="palette-list">`.

## Container & layout classes (real names, use verbatim)

`command-group` (toolbar/action bar) · `image-modal-actions` (modal buttons) · `panel` + `panel-title` (titled card) · `two-cols` (2-up field row) · `tool-rail` (vertical tool list) · `mode-tabs` / `display-tabs` (segmented tabs) · `preset-grid` · `palette-list` · `row-chips` · `insert-grid` · `statusbar`. Container components already emit these: `Panel`→`.panel`, `Toolbar`→`className` you pass, `ToolRail`→`.tool-rail`, `StatusBar`→`.statusbar`, `Modal`→backdrop+`.image-modal`.

## The 21 components

**Controls:** Button, IconButton, FileButton, SegmentedControl, Slider, TextField, NumberField, Select, Toggle.
**Layout:** Panel, Toolbar, ToolRail, Modal, StatusBar.
**Domain:** Swatch (color chip), PaletteRow (palette row+editor), Chip (progress chip), PresetGrid (grid-size presets), MovePad (directional pad), StepperControl (−/label/+), Badge (save-state pill).

Icons are passed as components (e.g. lucide `icon={Save}`), not strings. Change handlers receive processed values: `onChange(value)`, `onSelect(id)`, `onMove(dr, dc)`.

## Idiomatic example

```jsx
<Toolbar className="command-group">
  <Badge state="saved">로컬 저장됨</Badge>
  <Button icon={Plus}>새 작업</Button>
  <Button variant="primary" icon={Save}>로컬 저장</Button>
</Toolbar>

<Panel icon={Settings2} title="격자 설정">
  <div className="two-cols">
    <NumberField label="가로" min={1} max={200} value={cols} onChange={setCols} />
    <NumberField label="세로" min={1} max={200} value={rows} onChange={setRows} />
  </div>
  <PresetGrid presets={PRESETS} rows={rows} cols={cols} onSelect={resize} />
</Panel>
```
