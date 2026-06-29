# Knitgrid Design System

## 1. Product
Knitgrid is a work-focused pattern editor for turning colors and uploaded images into numbered knitting grids.

## 2. Principles
- Keep tools dense, direct, and predictable.
- Use quiet surfaces so the grid and color cells stay dominant.
- Prefer explicit controls over instructional copy.

## 3. Color Tokens
- App background: `--kg-bg` `#EEF0F4`
- Surface: `--kg-surface` `#FFFFFF`
- Surface subtle: `--kg-surface-soft` `#F7F8FA`
- Border: `--kg-line` `#E2E6EE`
- Border strong: `--kg-line-strong` `#C8D0DD`
- Text primary: `--kg-ink` `#151922`
- Text secondary: `--kg-muted` `#667085`
- Primary dark: `--kg-navy` `#111827`
- Primary accent: `--kg-teal` `#5964E0`
- Primary subtle: `--kg-teal-soft` `#EEF0FF`
- Danger/accent: `--kg-coral` `#E5484D`
- Warning: `--kg-saffron` `#C2820C`
- Success: `--kg-green` `#2E9E5B`

## 4. Typography
- Font stack: Inter, system UI, sans-serif.
- Base size: 14px with 1.4 line height.
- Compact controls: 11px to 12px, bold.
- Panel headings: 12px to 15px, bold.

## 5. Spacing And Shape
- Base spacing unit: 4px.
- Compact gaps: 4px to 8px.
- Panel gaps: 12px to 18px.
- Radius: 7px to 8px for menus, panels, modals, and dense tool surfaces.
- Topbar command pills use the existing rounded command style; do not apply that radius to dropdown menu content.

## 6. Components
- Buttons use border-first white surfaces, with blue fill only for primary actions.
- Modals use white surfaces, subtle borders, and compact action rows.
- Tool panels use full-width sections and avoid nested cards.
- Range controls use the primary blue accent.
- Overflow menus use native buttons, 8px surfaces, and the same border-first surface language as topbar commands.

## 7. Interaction
- Keep hover/focus feedback subtle and stable.
- Preserve keyboard-operable native controls.
- Uploaded image editing opens as a focused modal before conversion settings.
