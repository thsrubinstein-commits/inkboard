# Inkfield — Design System

> A precision instrument for making images. The interface nearly disappears so the
> work can be the loudest thing on screen.

---

## 1. What Inkfield Is

**Inkfield** is a browser-based visualization tool that renders **Gaussian splat**
scans as **3D, direction-aware ASCII art**. It loads a `.ply` / `.spz` / `.splat` /
`.ksplat` / `.sog` scene, lets you orbit it in three.js, and re-draws it as a field
of text glyphs or pen-style hatch strokes whose **direction follows the structure of
the scan** — strokes flow along surfaces, silhouettes, edges, folds and other
geometry.

It is *not* a brightness-to-ASCII filter. Inkfield renders the scene into a small
character grid; for each cell it estimates the projected shape and orientation of the
splats and chooses a glyph from that — so the marks read as drawing, notation, and
texture rather than photorealism.

**Three render modes:**
- **Photo** — normal Spark splat rendering (the raw scan).
- **Glyph** — structure-aware character rendering (the signature mode).
- **Hatch** — pen-style hatching driven by the same orientation field.

**Core controls:** render mode, color saturation, grid resolution, orientation-bin
count (4 / 8), **orientation source** (auto / normal / tangent), **Normal / Tangent
overlays**, and a splat transform (rotate X / Y / Z + reset). Live status readouts
report the render mode, the active orientation field, cell count, and scene state.

It is a static Vite + TypeScript web app with no backend; Spark powers splat loading
and rendering on top of three.js.

### The design thesis

The output is *visually loud* — saturated, textural, alive. So the most confident
move the interface can make is to **nearly disappear** — and then to speak in the
same material as the output:

- **Dark, cool-neutral, near-black** background — never pure black, never warm.
- **Monospace everywhere.** The tool renders glyphs; the interface is made of glyphs.
- **Grayscale plus exactly one signal light** — a warm amber, lit only on the control
  you are currently touching.
- **Glyphs are a defined ornamental layer (v2).** Box-drawing rules, orientation blobs
  and the brightness ramp are used as dividers, section seams, bullets, tab marks and
  loading spinners — but always drawn in the faint foreground steps (`--fg-3`/`--fg-4`).
  Glyphs are *texture*, never a second color; the amber stays reserved for the one live
  control.
- **Flat.** No glassmorphism, no drop shadows, no decorative gradients. Regions are
  defined by hairline seams (and now glyph rules), like an instrument panel.
- **Fast, mechanical motion** (120–160ms, eased, never bouncy). Values update live.

Touchstones to hold in your head: a **Resolve / Baselight grading suite** (dark-neutral
discipline), a **Teenage Engineering** device (monospace-labelled minimalism), and
**riso / letterpress** prints (how the *output's* palette and texture should feel —
that richness lives on the canvas, never in the chrome).

---

## 2. Sources

Everything here was derived from the product's own source. The reader is encouraged to
explore these to build more accurate Inkfield designs:

- **GitHub — `rioharper/Inkfield`** (private): https://github.com/rioharper/Inkfield
  - `src/main.ts` — app bootstrap, the control-panel HTML, renderer + render loop.
  - `src/ui.ts` — control wiring (mode, sliders, bins, transform, readouts).
  - `src/style.css` — the v0.1 stylesheet (see note below).
  - `src/render-settings.ts` — render modes, defaults, value ranges.
  - `src/atlas/glyphsets.ts` — the actual glyph alphabets used by the renderer.
  - `README.md` — product description and pipeline.
- **Fonts — `IBM/plex`** (OFL): https://github.com/IBM/plex — IBM Plex Mono web fonts
  are bundled in `/fonts`.

> **Note on the v0.1 stylesheet.** The shipped `src/style.css` is an early pass: it uses
> Inter (sans-serif), a glassmorphic blurred panel, drop shadows, and a two-accent
> (amber + teal) palette. This design system is the **intended visual direction** and
> deliberately supersedes that pass — monospace UI, single amber signal, flat hairline
> chrome — while preserving the product's real **structure** (panel, segmented mode
> switch, ruler sliders, transform block, status readouts) exactly as built.

---

## 3. Content Fundamentals

How Inkfield writes copy. The voice is a **technical instrument's voice**: terse,
lowercase-leaning, precise, never marketing-y. It names mechanisms accurately and
trusts the user to be technical.

- **Tone:** matter-of-fact, engineering-grade. Describes *what the thing does*, not how
  it'll make you feel. "InkField is not just a brightness-to-ASCII filter." No
  exclamation, no hype, no metaphor-stacking.
- **Person:** mostly **impersonal / imperative**. UI uses bare verb-object commands —
  "Load sample", "Load local scan", "Reset". Prose addresses the reader as **you**
  lightly ("Load a `.ply` … orbit around it"). The product refers to itself as
  **"InkField"** by name, not "we".
- **Casing:**
  - **Product wordmark:** `InkField` — camel-cased capital F in running prose and the
    brand eyebrow. (Treat "Inkfield" / "InkField" as the same mark; prefer `InkField`.)
  - **UI control labels:** UPPERCASE, letter-spaced — `MODE`, `COLOR`, `GRID`, `BINS`,
    `TRANSFORM`, `ROT X`. These are the "labelled dial" captions.
  - **Buttons:** Sentence case — "Load sample", "Load local scan".
  - **Body / docs prose:** sentence case, technical.
- **Numbers are first-class.** This is a tool full of live values (grid size, bin count,
  saturation, rotation degrees). They are shown with units inline and tabular figures:
  `180`, `1.15`, `0deg`, `8`. Format is terse — `1.15x color`, `8100 cells`.
- **Status copy** is present-progressive and literal: "Starting orientation pass…",
  "Starting renderer…", "Photorealistic Spark", "Glyph (8100 cells, 1.15x color)".
- **Emoji:** none. Ever. The brand's only ornaments are real glyphs from the renderer.
- **Vocabulary to reuse:** splat, scan, scene, orientation field, glyph, hatch, cell,
  grid, bin, atlas, temporal smoothing, structure-aware, screen-space.

**Examples (verbatim from product):**
- Eyebrow: `InkField` · Title: `Structure-driven splat renderer`
- "Its glyphs are chosen from the projected shape and orientation of the splats in each
  cell, so strokes can flow along surfaces, silhouettes, table edges, folds…"
- Readout label / value: `RENDER` → `Glyph (8100 cells, 1.15x color)`

---

## 4. Visual Foundations

### Color
Grayscale plus **one** signal. See `colors_and_type.css` for the full token set.

- **Backgrounds** are cool-neutral dark grays, *stepped* to express depth (there are no
  shadows): `--bg-0 #15171b` (stage) → `--bg-1 #181a1f` (panel) → `--bg-2 #1b1e23`
  (raised rail) → `--well #212429` (input grooves).
- **Text** is soft light-gray, never white. `--fg-1 #c7ccd3` primary, `--fg-2 #8a9099`
  secondary, `--fg-3 #5e646d` tertiary/ticks, `--fg-4 #3c4149` faintest.
- **One accent:** warm amber `--accent #e8a24c`, used **only** for the active /
  interactive / focused state — the value you're changing, the lit segment, the slider
  fill. `--accent-dim` for pressed. The rule is strict: **all color richness comes from
  the canvas; none from the chrome.**
- **Hierarchy comes from weight, size, and opacity — never from color.**
- **Imagery vibe:** the only "imagery" is the renderer's own output — saturated,
  textural, riso/letterpress-like glyph fields over the dark stage. Represent it with
  *actual monospace glyph fields*, never invented illustration.

### Type
- **IBM Plex Mono for the entire UI** (bundled, weights 300/400/500/600/700). Named
  alternatives if localizing: Berkeley Mono, Commit Mono. Never Courier, never Inter.
- **Tabular figures on** (`font-feature-settings: 'tnum' 1, 'zero' 1`) so live numbers
  don't jitter horizontally as they update — non-negotiable for this tool.
- **Labels** are UPPERCASE, small (11px), letter-spaced `0.14em` — the labelled-dial
  feel. **Values** get prominence (medium weight, tabular, `--fg-1`; amber while live).
- Small sizes, tight leading, generous space around. Scale runs 10 → 34px; UI lives at
  11–16px.

### Spacing & grid
- **4px base grid.** Tokens `--sp-1 … --sp-20`. Align everything to it — the character
  grid is literally the tool's substrate, so the UI honoring a grid makes the whole
  thing feel of-a-piece.
- Control rows use a fixed **58px label column** + flexible control.

### Radius
- Tight and minimal: `--r-xs 2px` (ticks/chips), `--r-sm 4px` (inputs/segments),
  `--r-md 6px` (buttons/panels), `--r-lg 8px` (floating rail).

### Material & elevation
- **Flat.** No glassmorphism, no decorative gradients, no card shadows. The canvas owns
  the entire texture budget.
- Define regions with **hairline 1px low-contrast dividers** (`--line`,
  `--line-soft`) and **glyph rules** (`.if-rule`, box-drawing seams) — instrument-panel
  seams, not cards-and-fills.
- "Elevation" = a **background step + a hairline**, not a shadow. The single exception
  is a near-invisible lift on the floating rail so it stays legible over a loud canvas
  (`--elev-rail`).
- **Borders:** 1px, low-contrast white-alpha. Focus rings use amber.
- **Transparency / blur:** avoid blur (no glass). The one permitted faint wash is
  `--accent-glow` behind an actively-lit field.

### The texture flourish: ruler sliders & the glyph ornament layer
The original allowed decoration is **monospace tick marks on sliders**, so a control
reads like a ruler or a calibrated dial. Ticks are `--fg-4`; the active range and thumb
are amber.

**v2 extends this into a defined glyph ornament layer** (`colors_and_type.css`):
- **Box-drawing rules** — `─ │ ┌ ┐ └ ┘ ├ ┤` for section seams and dividers
  (`.if-rule`, drawn in `--glyph-rule`/`--fg-4`).
- **Glyph bullets** — `· ° @` from the blob/ramp sets as list markers (`.if-bullet`).
- **Tick strips** — a repeating-tick header rail (`.if-tickstrip`).
- **Alphabet runs** — the renderer's real sets shown as ornament (`.if-glyphs`).
- **Glyph spinner** — a mechanical `- \ | /` loading mark (`.if-spin`), static under
  reduced-motion.

The rule never changes: ornament glyphs live in the faint foreground steps and are
*texture*, not signal — amber stays on the one live control. Faint registration marks /
a hairline baseline grid may still be used sparingly as print/instrument lineage.

### Motion
- **Fast and mechanical:** 120–160ms (`--dur-fast/base/slow`), eased
  `cubic-bezier(0.2,0,0,1)`, **never bouncy**.
- Values update **live** as you drag — instant feedback is the entire point.
- **Zero decorative animation.** No idle loops, no springs, no parallax.

### Hover / press / focus states
- **Hover:** lift one background step (`--well` → `--well-hi`) or +1 line contrast; on
  amber fills, a slight brightness bump. No color change on text.
- **Press:** amber → `--accent-dim`; controls may nudge 1px, never scale/bounce.
- **Focus:** 2px amber outline, `outline-offset: 2–3px`. Amber = "this is the live one".
- **Active/selected:** amber fill with `--accent-ink` text (segments), or amber value.

### Layout rules
- **Canvas dominant**, edge-to-edge. Controls collected into a **single** restrained
  floating rail / panel — never scattered.
- The panel is **collapsible** so the canvas can go full-bleed and you can just look at
  the output unobstructed.
- Panel pinned top-left by default (`top/left: 18px`), `min(380px, 100vw-36px)` wide.

---

## 5. Iconography

See the **ICONOGRAPHY** details in §6. Short version: Inkfield ships **almost no
conventional icons** — and that is the point. Instead, **the renderer's own glyph
alphabet is the icon set**, now formalized as a glyph ornament layer (§4).

- The product's UI (per `src/main.ts`) uses **text labels and the glyphs themselves**,
  not an icon set: segmented mode switches read "Photo / Glyph / Hatch", bins read
  "4 / 8", buttons are worded ("Load sample", "Reset").
- There is **no bundled icon font, no SVG icon sprite, no PNG icons** in the codebase.
- **Emoji are never used.**
- When an affordance genuinely needs a mark, prefer **the renderer's own glyph
  alphabet** as iconography — these are real, from `src/atlas/glyphsets.ts`:
  - brightness ramp: `` .:-=+*#%@``
  - orientation blobs: `. o @`
  - 4-bin directions: `- / | \`   · 8-bin: `- ~ / | \ ~ - _`
  - overlay marks (v2): `⊥` surface-normal · `‖` tangent-flow
  Using `/`, `|`, `\`, `@`, `+`, `─`, `│`, `├` as tiny control marks and dividers keeps
  the interface *made of the same material as the output*.
- If a conventional UI icon is unavoidable (e.g. a collapse chevron, a file glyph), use
  a **hairline 1.5px stroke, no fill, square-cut** mark that matches the monospace
  weight — or substitute the closest CDN match (e.g. **Lucide**, 1.5–2px stroke) and
  **flag the substitution**. None are bundled today.

---

## 6. Index / Manifest

Root files:
- **`README.md`** — this document.
- **`colors_and_type.css`** — the token system (color, type, spacing, radius, motion,
  semantic element defaults). Import this first in any Inkfield design.
- **`SKILL.md`** — Agent-Skill front-matter wrapper so this folder works as a Claude
  Code skill.
- **`fonts/`** — IBM Plex Mono web fonts (300/400/500/600/700) + OFL license.
- **`assets/`** — brand wordmark + glyph-field marks (see `assets/README.md`).
- **`preview/`** — design-system specimen cards (color, type, spacing, components,
  brand). These populate the Design System tab. v2 adds `comp-toggle` (overlay
  switches), `comp-orientation` (orientation source), `brand-ornament` (the glyph
  ornament layer) and `state-loading` (glyph spinner + empty state).
- **`ui_kits/inkfield/`** — high-fidelity, interactive recreation of the Inkfield app:
  the floating control rail, segmented switches, ruler sliders, transform block, status
  readouts, and a live glyph-field canvas. Start at `ui_kits/inkfield/index.html`.

There are **no slide templates** in this system — the product ships none, so none were
invented.

---

## 7. Using this system

1. Link `colors_and_type.css` and use the semantic tokens — never hard-code hexes.
2. Keep the chrome grayscale; spend amber only on the one live control.
3. Monospace everything; turn on tabular figures for any live number.
4. Define regions with hairlines and background steps, not shadows or cards.
5. Let the canvas (a real glyph field) be the loudest thing on the screen.
