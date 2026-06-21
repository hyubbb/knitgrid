# Knitgrid Design System

## 1. Product
Knitgrid is a work-focused pattern editor for turning colors and uploaded images into numbered knitting grids.

## 2. Principles
- Keep tools dense, direct, and predictable.
- Use quiet surfaces so the grid and color cells stay dominant.
- Prefer explicit controls over instructional copy.

## 3. Color Tokens
- App background: `#eef3f7`
- Surface: `#ffffff`
- Surface subtle: `#fbfdff`
- Surface muted: `#f8fbfd`
- Border: `#d7e0ea`
- Border strong: `#a9bbce`
- Text primary: `#111827`
- Text secondary: `#64748b`
- Text label: `#536176`
- Primary: `#1f7ecf`
- Primary border: `#176fb7`
- Primary subtle: `#e8f4ff`
- Accent pink: `#e84f7f`

## 4. Typography
- Font stack: Inter, system UI, sans-serif.
- Base size: 14px with 1.4 line height.
- Compact controls: 11px to 12px, bold.
- Panel headings: 12px to 15px, bold.

## 5. Spacing And Shape
- Base spacing unit: 4px.
- Compact gaps: 4px to 8px.
- Panel gaps: 12px to 18px.
- Radius: 7px to 8px for buttons, panels, modals, and tool surfaces.

## 6. Components
- Buttons use border-first white surfaces, with blue fill only for primary actions.
- Modals use white surfaces, subtle borders, and compact action rows.
- Tool panels use full-width sections and avoid nested cards.
- Range controls use the primary blue accent.

## 7. Interaction
- Keep hover/focus feedback subtle and stable.
- Preserve keyboard-operable native controls.
- Uploaded image editing opens as a focused modal before conversion settings.
