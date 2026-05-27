# Pipeline Studio — VectorShift Frontend Technical Assessment

A ReactFlow-based pipeline builder with a config-driven node abstraction, a dynamic Text node that creates handles from `{{ variable }}` placeholders, and a FastAPI backend that validates the submitted graph as a DAG, returns its execution order, and identifies any cycles.

Built for the VectorShift frontend technical assessment.

| | |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS v4, shadcn/ui, ReactFlow, Zustand |
| Backend | FastAPI, Pydantic, Uvicorn, pytest |
| External services | None — no API keys required |
| Deploy | `render.yaml` Blueprint (one click, both services wired automatically) |

---

## Running locally

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`. Endpoints:

- `GET /` → `{"Ping":"Pong"}`
- `GET /health` → `{"status":"ok","service":"pipeline-studio-backend","version":"..."}`
- `POST /pipelines/parse` → full pipeline analysis

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:3000`.

If your backend lives elsewhere, set the URL before starting Vite:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

### Quality commands

```bash
cd frontend
npm run lint        # ESLint, zero-warning policy
npm run typecheck   # tsc against jsconfig.json
npm run build       # Production bundle in dist/
npm run preview     # Serve the production bundle for verification
npm run check       # lint + typecheck + build (run before committing)

cd backend
pip install -r requirements-dev.txt
python -m pytest    # 12 tests covering analyze_graph and the API surface
```

---

## Project structure

```
backend/
  main.py                       FastAPI app + Kahn's-algorithm graph analyzer
  requirements.txt              Runtime deps
  requirements-dev.txt          + pytest, httpx
  tests/test_pipeline.py        Unit + endpoint tests

frontend/
  index.html                    Vite entry point
  vite.config.js
  components.json               shadcn/ui config
  jsconfig.json                 Editor + tsc typecheck config
  src/
    main.jsx                    React entry
    App.jsx                     App shell
    index.css                   Tailwind v4 entry + @theme tokens + ReactFlow overrides
    store.js                    Zustand store (graph + dialog + persist)
    submit.js                   POST /pipelines/parse helper
    lib/utils.js                cn() helper
    components/
      AppHeader.jsx             Brand + submit button
      NodeLibrary.jsx           Sidebar with draggable modules
      DraggableNodeCard.jsx     A single draggable module
      PipelineCanvas.jsx        ReactFlow canvas + cycle/rank decoration
      CanvasToolbar.jsx         Import / export / clear actions
      EmptyCanvasHint.jsx       Empty-state overlay
      NodeContextMenu.jsx       Right-click menu (shadcn DropdownMenu)
      PipelineResultDialog.jsx  Result modal — counts + DAG + order + cycle
      RenameDialog.jsx          Rename modal (replaces window.prompt)
      ui/                       shadcn primitives (button, dialog, ...)
    nodes/
      BaseNode.jsx              Config-driven node renderer + NodeCard chrome
      TextNode.jsx              Dynamic Text node with variable extraction
      nodeDefinitions.js        All node configs (single source of truth)

render.yaml                     Two-service Render Blueprint (backend + static)
docs/superpowers/specs/         Original design spec
```

---

## Assessment requirements

### Part 1 — Node abstraction

The reusable abstraction lives in [`frontend/src/nodes/BaseNode.jsx`](frontend/src/nodes/BaseNode.jsx). Standard nodes are pure configuration in [`frontend/src/nodes/nodeDefinitions.js`](frontend/src/nodes/nodeDefinitions.js). Each entry can declare:

- `label`, `kicker`, `title` — display strings
- `tone` — color (`green` `violet` `blue` `amber` `red` `cyan` `pink` `slate` `black`)
- `description` — sidebar tooltip + in-node copy
- `fields` — array of `{ name, label, type?, options?, defaultValue?, placeholder?, rows? }`
- `inputs`, `outputs` — handle definitions

`createNodeComponent(config)` turns a definition into a ReactFlow component automatically. The five new nodes — `transform`, `filter`, `httpRequest`, `router`, `database` — are pure configuration.

A new node automatically inherits:

- Sidebar rendering, drag-and-drop creation, snap-to-grid placement
- Default field values
- Tone-colored left accent bar and minimap stroke
- Input/output handles with auto-spaced vertical positions
- Field controls (text, select, textarea)
- Right-click context menu (rename / duplicate / copy ID / delete)
- Execution-order badge + cycle marker (when the backend reports them)
- Submission to `/pipelines/parse` as part of the graph

To add a node:

```js
analytics: {
  label: 'Analytics',
  kicker: 'Insight',
  title: 'Analytics',
  tone: 'cyan',
  description: 'Aggregates metrics over the upstream stream.',
  fields: [
    { name: 'window', label: 'Window', type: 'select',
      defaultValue: '5m', options: ['1m', '5m', '1h'] },
  ],
  inputs: [{ id: 'events' }],
  outputs: [{ id: 'summary' }],
}
```

Custom nodes (like `TextNode`) skip the abstraction and supply their own `component`.

### Part 2 — Styling

A "modern dev tool" personality (Linear / Vercel / Retool reference points). Tailwind CSS v4 with `@theme` tokens lives in [`frontend/src/index.css`](frontend/src/index.css). shadcn/ui primitives provide accessible building blocks (Button, Dialog, Tooltip, DropdownMenu, Input, Label, Badge, Separator).

Highlights:

- Inter (variable) for UI typography; JetBrains Mono for IDs and code.
- Confident slate-on-white palette with a single brand-blue accent.
- Node cards with a left tone-colored accent bar instead of a top border.
- ReactFlow controls, minimap, edges, and handles fully restyled.
- Empty-canvas state when no nodes are placed.
- Real focus rings and keyboard accessibility on every interactive element.
- Submit-result modal and rename modal replace `window.alert` / `window.prompt`.

### Part 3 — Text node logic

[`frontend/src/nodes/TextNode.jsx`](frontend/src/nodes/TextNode.jsx):

- **Width** grows from 264px to 520px based on longest line; **height** grows from 96px to 240px based on line count.
- After 240px the textarea scrolls **internally** instead of growing further.
- **Variable detection** uses `/\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g` and rejects JS reserved words; duplicates are de-duped.
- Each unique variable becomes a left-side input handle (`${nodeId}-${variableName}`). Handle internals are updated with `useUpdateNodeInternals`.
- Detected variables are surfaced as monospaced badges under the textarea.

### Part 4 — Backend integration

Frontend ([`frontend/src/submit.js`](frontend/src/submit.js)) `POST`s `{ nodes, edges }` to `/pipelines/parse`. The Submit button in the header (`AppHeader.jsx`) dispatches store actions for loading / success / error, which the `PipelineResultDialog` subscribes to. No `window.alert` anywhere in the app.

Backend ([`backend/main.py`](backend/main.py)) returns a full analysis:

```json
{
  "num_nodes": 3,
  "num_edges": 2,
  "is_dag": true,
  "cycle_node_ids": [],
  "cycle_edge_ids": [],
  "execution_order": ["a", "b", "c"],
  "invalid_edges": []
}
```

DAG detection uses **Kahn's algorithm**: build an adjacency list and indegree map, peel zero-indegree nodes, decrement neighbors. If every node is visited, the graph is acyclic; otherwise the remaining nodes are the cycle members. Edges referencing missing nodes appear under `invalid_edges` and cause `is_dag: false`.

Time: `O(nodes + edges)`. Space: `O(nodes + edges)`.

---

## Beyond the brief

These additions are scoped to deepen what was asked for, not to invent new requirements:

- **Persistent canvas.** The graph auto-saves to `localStorage` (via Zustand's `persist` middleware) so a refresh restores everything.
- **JSON import / export.** Canvas toolbar lets you download the current pipeline as `pipeline-YYYYMMDD-HHMM.json` and re-import the same shape later.
- **Cycle visualization.** When the backend reports a cycle, the affected nodes get a red ring and a `CYCLE` chip, and the affected edges turn red.
- **Execution order labels.** After a successful DAG analysis each node card shows a small numeric badge corresponding to its topological execution rank.
- **Backend hardening.** `/health` endpoint, configurable CORS via `CORS_ALLOWED_ORIGINS` env var, structured logging, Pydantic field constraints + a 400 handler that returns `{detail, errors}`.
- **Tests.** 12 backend tests (`backend/tests/test_pipeline.py`) covering DAG, cycle, empty graph, invalid edges, diamond, disconnected components, and every endpoint.
- **`render.yaml` Blueprint.** One-click deploy of both services to Render with the URLs wired automatically (see below).

---

## Deploying to Render

The repo ships with [`render.yaml`](render.yaml), a Blueprint that defines both services and wires the URLs together automatically.

1. Push to a GitHub repo Render has access to.
2. In the Render dashboard, click **New → Blueprint** and select this repo.
3. Click **Apply**. Render provisions:
   - `pipeline-studio-backend` (Python web service from `backend/`)
   - `pipeline-studio-frontend` (static site built from `frontend/dist`)
4. Render auto-wires:
   - `BACKEND_HOST` (frontend → backend) so the frontend bundles `VITE_API_BASE_URL=https://<backend-host>` at build time.
   - `FRONTEND_HOST` (backend → frontend) so `main.py` appends the frontend origin to its CORS allowlist on startup.

No manual environment configuration is needed for the first deploy.

---

## Smoke tests

### Backend
```bash
curl -s http://127.0.0.1:8000/health
# {"status":"ok","service":"pipeline-studio-backend","version":"..."}

curl -s -X POST http://127.0.0.1:8000/pipelines/parse \
  -H 'Content-Type: application/json' \
  -d '{"nodes":[{"id":"a"},{"id":"b"},{"id":"c"}],
       "edges":[{"source":"a","target":"b"},{"source":"b","target":"c"}]}'
# {"num_nodes":3,"num_edges":2,"is_dag":true,
#  "cycle_node_ids":[],"cycle_edge_ids":[],
#  "execution_order":["a","b","c"],"invalid_edges":[]}

curl -s -X POST http://127.0.0.1:8000/pipelines/parse \
  -H 'Content-Type: application/json' \
  -d '{"nodes":[{"id":"a"},{"id":"b"}],
       "edges":[{"source":"a","target":"b"},{"source":"b","target":"a"}]}'
# {"num_nodes":2,"num_edges":2,"is_dag":false,
#  "cycle_node_ids":["a","b"],"cycle_edge_ids":["a->b","b->a"],
#  "execution_order":[],"invalid_edges":[]}
```

### Frontend
```bash
cd frontend
npm run check       # lint + typecheck + build all clean
```

