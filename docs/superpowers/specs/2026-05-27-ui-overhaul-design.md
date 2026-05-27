# Pipeline Studio — UI Overhaul Design Spec

**Date:** 2026-05-27
**Author:** Arghyadeep
**Status:** Approved — ready for implementation
**Context:** VectorShift Frontend Technical Assessment. The functional implementation (node abstraction, 5 new nodes, dynamic Text node, DAG backend, context menu) already passes all four parts of the assessment. This spec covers a full visual overhaul to raise the submission's design ceiling without changing scope or adding features.

---

## 1. Goals & Non-Goals

### Goals
- Replace the current ad-hoc CSS with a production-grade visual system that reads as a serious B2B AI tooling product (Linear / Vercel / Retool reference points).
- Preserve every existing behavior and architectural choice — node abstraction, dynamic Text node sizing, variable extraction, DAG check, context menu, duplicate, rename.
- Modernize the build system to Vite for faster iteration and a cleaner production bundle.
- Ship a submission that is end-to-end verified, accessible, and matches what the assessment grades: completion, code architecture, and design.

### Non-Goals (explicit)
- No new nodes, panels, command palette, notes system, documentation page, theme toggle, undo/redo, autosave, sharing, authentication, or persistence.
- No backend behavior changes. `backend/main.py` is correct as-is.
- No automated tests. The assessment does not ask for them and adding them is scope creep.
- No backwards-compatibility shims. We are doing a clean cut from CRA → Vite and from custom CSS → Tailwind.

---

## 2. Build System Migration: CRA → Vite

### Why
CRA (`react-scripts`) is unmaintained, slow, and produces noisy console warnings (Babel preset / Browserslist) that look unprofessional on a screen recording. Vite gives instant HMR, a cleaner dev console, and is the modern default for React + Tailwind v4 + shadcn.

### Changes
| File | Action |
|---|---|
| `frontend/package.json` | Remove `react-scripts`. Add `vite`, `@vitejs/plugin-react`. Replace `start`/`build`/`test` scripts with `dev`/`build`/`preview`. Bump `react`/`react-dom` to latest 18.x. |
| `frontend/public/index.html` | Move to `frontend/index.html` (Vite expects it at the project root). Strip CRA-specific `%PUBLIC_URL%` tokens. Add `<script type="module" src="/src/main.jsx">`. |
| `frontend/src/index.js` | Rename to `frontend/src/main.jsx`. |
| `frontend/src/App.js` | Rename to `frontend/src/App.jsx`. |
| All other `.js` files containing JSX | Rename to `.jsx`. Pure-data files (`store.js`, `submit.js`, `nodeDefinitions.js`) keep `.js`. |
| `frontend/vite.config.js` | New file. Configures `@vitejs/plugin-react`, `@tailwindcss/vite`, `resolve.alias['@'] = '/src'`, and `server.port = 3000` to preserve the assessment's stated dev URL. |
| Env var | `REACT_APP_API_BASE_URL` → `VITE_API_BASE_URL`. Default still `http://localhost:8000`. Access via `import.meta.env.VITE_API_BASE_URL`. |
| `process.env.PUBLIC_URL` references | Removed. Vite serves `public/` at `/`. |

### Acceptance
- `npm install` succeeds with zero warnings about deprecated CRA packages we control.
- `npm run dev` boots on port 3000.
- `npm run build` produces `dist/` with no errors.
- `npm run preview` serves the built artifact and the app works identically to dev.

---

## 3. Styling Stack: Tailwind v4 + shadcn/ui

### Setup
1. `npm install -D tailwindcss @tailwindcss/vite`
2. Add `tailwindcss()` to `vite.config.js` plugins.
3. `npx shadcn@latest init` with style `new-york`, base color `slate`, CSS variables `yes`. This creates `components.json` and the `@/components/ui` import alias.
4. Add primitives one at a time as needed: `button`, `dialog`, `tooltip`, `dropdown-menu`, `scroll-area`, `separator`, `badge`, `input`, `select`, `textarea`.
5. Single global stylesheet: `src/index.css` with `@import "tailwindcss";`, an `@theme` block defining brand tokens, and a small `@layer components` block for ReactFlow overrides.

### Design tokens (defined in `@theme`)
- **Brand:** `--color-brand-500: oklch(60% 0.18 250)` (confident product blue).
- **Neutrals:** Tailwind's default `slate` ramp (we re-use it via shadcn defaults).
- **Node tones:** Per-category accent colors that map cleanly to the existing `tone` field on each node definition. Hues match the current palette but desaturated ~10–15%: green, violet, blue, amber, red, cyan, pink, slate, black (for Text).
- **Typography:** `Inter` (variable, via Google Fonts in `index.html`) for UI; `JetBrains Mono` for IDs and code.
- **Radii:** `rounded-xl` for surfaces; `rounded-md` for controls; `rounded-full` for badges.
- **Shadows:** Slate-tinted, low-spread (`shadow-sm` / `shadow-md`).

### ReactFlow integration
- Import `reactflow/dist/style.css` once in `main.jsx` **before** `index.css` so Tailwind utilities win.
- Override ReactFlow internals via a small `@layer components` block targeting `.react-flow__controls-button`, `.react-flow__minimap`, `.react-flow__edge-path`, `.react-flow__handle`, and `.react-flow__attribution` (hidden).

---

## 4. Component Architecture

No behavioral changes. Only file moves, renames, and the visual rewrite.

```
frontend/
  index.html                              ← was public/index.html
  vite.config.js                          ← new
  components.json                         ← new (shadcn)
  src/
    main.jsx                              ← was index.js
    App.jsx                               ← shell
    index.css                             ← Tailwind entrypoint + tokens + RF overrides
    lib/
      utils.js                            ← cn() helper from shadcn
    components/
      AppHeader.jsx                       ← brand lockup + submit button
      NodeLibrary.jsx                     ← was toolbar.js (with Tooltip primitive)
      DraggableNodeCard.jsx               ← was draggableNode.js
      PipelineCanvas.jsx                  ← was ui.js (with restyled RF chrome)
      EmptyCanvasHint.jsx                 ← new — shown when nodes.length === 0
      NodeContextMenu.jsx                 ← migrated to DropdownMenu primitive
      PipelineResultDialog.jsx            ← new — replaces window.alert
      ui/                                 ← shadcn primitives (button, dialog, etc.)
    nodes/
      BaseNode.jsx                        ← unchanged behavior, Tailwind classes
      TextNode.jsx                        ← unchanged behavior, Tailwind classes
      nodeDefinitions.js                  ← unchanged
    store.js                              ← unchanged
    submit.js                             ← refactored to expose state to dialog instead of calling window.alert
```

### Notes on file moves
- `index.css` is rewritten end-to-end. The old hand-rolled rules are deleted.
- `NodeContextMenu.js` becomes `components/NodeContextMenu.jsx` and uses shadcn's `DropdownMenu` primitive but keeps exactly the same 4 actions (Rename, Duplicate, Copy ID, Delete) and the same store calls.

---

## 5. Visual System

### Personality
"Modern dev tool" — confident, restrained, professional. Slate-on-white with a single brand-blue accent. Color is used **structurally** (node category tone, status states) not decoratively.

### Surfaces
- **App background:** `bg-slate-50`.
- **Header:** white background, `border-b border-slate-200`, no shadow (it's anchored to the top of the viewport so a shadow looks heavy).
- **Sidebar (NodeLibrary):** white surface, `border border-slate-200`, `shadow-sm`, `rounded-xl`.
- **Canvas:** white surface with subtle dotted grid background, `border border-slate-200`, `shadow-sm`, `rounded-xl`. Overflow hidden so ReactFlow chrome stays inside the rounded corners.
- **Node cards:** white, `border border-slate-200`, `shadow-md`, `rounded-xl`. **Left 3px accent bar** in the node's tone color (replaces the current top accent border — looks more modern and doesn't fight with the kicker label).
- **Empty canvas state:** Centered hint when `nodes.length === 0` — small illustration of a node card with a dashed border, plus text "Drag a node from the library to start building." Hint fades out the moment the first node is dropped.

### Typography ramp
- **H1 (app title):** `text-2xl font-semibold tracking-tight`.
- **Eyebrow:** `text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-600`.
- **Node title:** `text-sm font-semibold`.
- **Node kicker:** `text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500`.
- **Node description:** `text-xs leading-relaxed text-slate-500`.
- **Field label:** `text-[11px] font-medium uppercase tracking-wide text-slate-600`.
- **Field input:** `text-sm font-medium text-slate-900`.
- **Variable pill:** `text-[11px] font-medium font-mono`.

### ReactFlow chrome
- **Controls:** Custom-styled icon buttons (`size-8`, white bg, slate border, slate-700 icon, hover bg-slate-100). Vertical stack in bottom-left with rounded-md and shadow-sm.
- **Minimap:** `bg-white/80 backdrop-blur` with slate border, rounded-md, shadow-sm. Node strokes use the same tone color as the node itself for legibility.
- **Edges:** Default stroke `slate-400`, stroke-width `1.5`. Selected stroke `brand-500`, stroke-width `2`. Animated dasharray `6 4` on newly-connected edges (preserved from current behavior).
- **Handles:** `size-2.5` slate-700 circle with 2px white border and a subtle slate-300 ring.
- **Attribution:** Hidden via `proOptions={{ hideAttribution: true }}` (already in place).

### Submit button (in header)
- shadcn `Button` variant `default`, size `default`. Text "Submit Pipeline". On loading: button disabled with spinner icon + "Analyzing…".

### Pipeline Result Dialog (replaces window.alert)
- shadcn `Dialog`. Title "Pipeline Analysis".
- Body: three stat tiles in a 3-col grid — Nodes / Edges / DAG. Each tile is a small card with the metric label on top and the value as large numerals. The DAG tile shows a green check icon + "Yes" when true, or an amber alert icon + "No — contains a cycle" when false.
- Footer: a single sentence reading "This pipeline is ready to run." or "Fix the cycle before running this pipeline." Plus a Close button.
- Error state: same dialog with title "Could not analyze pipeline", body shows the error message and the instruction to start the backend with `uvicorn main:app --reload`.

---

## 6. Behavior preserved (unchanged)
- `BaseNode` config-driven rendering. Adding a node = adding an entry in `nodeDefinitions.js`.
- TextNode dynamic width (260 → 520px) and dynamic height (84 → 220px, then internal scroll).
- TextNode variable extraction: `/\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g` with reserved-word filtering.
- One left handle per unique variable.
- Zustand store actions: `addNode`, `duplicateNode`, `deleteNode`, `updateNodeField`, `onNodesChange`, `onEdgesChange`, `onConnect`, `getNodeID`.
- Edge connections animated with `MarkerType.Arrow`.
- Context menu actions: Rename (via shadcn Dialog with an Input — replaces `window.prompt`), Duplicate (offset +44px), Copy ID, Delete (cascade-removes edges).
- DAG check via Kahn's algorithm; invalid edges (pointing to missing nodes) return `is_dag: false`.

---

## 7. Manual QA Plan (definition of done)

Every item must pass before the spec is considered implemented. QA is run after each major surface change, not just at the end.

1. `npm install` clean, no warnings about packages we control.
2. `npm run dev` boots Vite on port 3000.
3. Backend boots; `GET /` returns `{Ping: Pong}`.
4. Drag every one of the 10 node types onto the canvas; each renders with the correct title, fields, handles, and tone color.
5. Connect Input → LLM → Output; submit → dialog shows `Nodes: 3, Edges: 2, DAG: Yes`.
6. Create a cycle (e.g., Output back to Input via a Transform) → dialog shows `DAG: No`.
7. Text node: type `Hello {{ name }} and {{ company }}` → two left handles appear, two pills shown, width grows. Paste a 50-line block → height caps at 220px, scrolls internally.
8. Right-click a node → Rename (inline), Duplicate (offset), Copy ID, Delete (cascade) all work.
9. Submit with empty canvas → dialog: 0/0/true.
10. Stop backend, submit → error dialog with the recovery instruction.
11. Resize browser to 700px width → sidebar wraps below canvas, layout stays usable.
12. Keyboard accessibility: Submit button reachable via Tab; Dialog dismissible via Escape; focus rings visible on all interactive elements.
13. `npm run build` succeeds; `npm run preview` serves the build identically.
14. Production console clean — no errors or warnings.

---

## 8. Deliverables
- All code changes committed in atomic, well-described commits to the new root git repo.
- New `README.md` reflecting Vite + Tailwind + shadcn stack and the updated run instructions.
- A `docs/SCREEN_RECORDING_SCRIPT.md` with a 3-minute walkthrough script.
- A `docs/SUBMISSION_CHECKLIST.md` with the final pre-zip steps.

---

## 9. Out of scope (will not do)
- New nodes, features, panels.
- Authentication, persistence, undo/redo, autosave, sharing.
- Automated tests.
- Backend changes.
- Theme/dark mode.
- Documentation page inside the app.
- Animation libraries beyond CSS transitions already in place.
