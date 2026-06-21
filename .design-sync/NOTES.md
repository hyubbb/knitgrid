# KnitGrid design-sync notes

Repo-specific gotchas for future syncs. Read before re-syncing.

## Source shape / build
- **Synth-entry mode**: KnitGrid has no TypeScript, no published package, no library `dist` build. Components are JSX in `src/components/*.jsx`, barrel-exported from `src/components/index.js` (the converter `--entry`). 21 components enumerated in `cfg.componentSrcMap`.
- **`.d.ts` are hand-written** in `cfg.dtsPropsFor` (derived from each component's JSDoc), because JSX has no extractable types. Keep them in sync if a component's props change.
- `@types/react` is absent from the repo's `node_modules` → `[DTS_REACT]` warning on every build. Benign — we don't rely on auto-extraction.

## CSS (important)
- `src/styles.css` uses Tailwind v4 `@apply`, so the **raw file is NOT usable** as `cssEntry`. The real stylesheet is the Tailwind-**compiled** output from the app build (`dist/assets/index-*.css`, hashed name).
- `cfg.buildCmd` = `pnpm build && cp dist/assets/index-*.css .design-sync/.cache/compiled-styles.css`. **Re-sync MUST run buildCmd first** so `cssEntry` (the gitignored cache copy) is fresh.
- Button/IconButton styling is **container-dependent** (`.command-group .primary`, `.image-modal-actions button.danger`, etc.) — documented in `conventions.md`. Previews compose buttons inside `Toolbar className="command-group"` / `Modal actions` accordingly.

## Render check (no chromium download)
- Playwright is installed in `.ds-sync` with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`. Validate/capture run against **system Chrome** via `DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
- Preview compilation is **slow** (~1–2 min for 21 previews — each esbuilds lucide-react + React cold). Not a hang; let it finish. Never pipe build output through `head` (SIGPIPE stalls the build) — redirect to a file.

## Known render warns (triaged — not new on re-sync)
- `[TOKENS_MISSING] --cell, --rows, --cols, --preview-rows, --preview-cols`: runtime grid vars the app sets via inline `style` on the canvas; never defined in a stylesheet. Expected, non-blocking.
- `[FONT_MISSING]`/Inter: the app uses the `Inter, system-ui, …` stack but never ships Inter (`cfg.runtimeFontPrefixes: ["Inter"]` suppresses). System fallback is the intended design.

## Re-sync risks (what can silently go stale)
- `compiled-styles.css` is gitignored cache — a re-sync that skips `buildCmd` ships a stale or missing stylesheet. Always rebuild.
- `dtsPropsFor` is a hand-maintained mirror of JSDoc — if components gain/rename props, the `.d.ts` won't update automatically.
- Preview data (palette codes, tool lists) is inlined in `.design-sync/previews/*.tsx` — cosmetic, but drifts from the app's real `INITIAL_PALETTE`/`TOOLS` if those change.
