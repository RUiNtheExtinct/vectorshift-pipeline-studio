# Pipeline Studio - VectorShift Frontend Assessment

Pipeline Studio is a ReactFlow-based workflow builder completed for the VectorShift frontend technical assessment. It implements the required node abstraction, improved styling, dynamic Text node behavior, and FastAPI backend integration for graph analysis.

## What Was Built

- A reusable node abstraction for standard workflow nodes.
- Five additional nodes: Transform, Filter, HTTP Request, Router, and Database.
- A polished workflow-builder UI with a responsive node library, canvas controls, minimap, custom branding, and node-level context actions.
- A Text node that resizes for readability, creates variable handles from `{{ variable }}` placeholders, and switches to internal scrolling after a sensible height limit.
- A FastAPI endpoint that counts nodes and edges and checks whether the submitted graph is a directed acyclic graph.
- Custom SVG, PNG, and ICO app icons.

## Tech Stack

Frontend:

- React
- ReactFlow
- Zustand
- CSS

Backend:

- FastAPI
- Pydantic
- Uvicorn

No API keys or external service accounts are required.

## Project Structure

```txt
backend/
  main.py              FastAPI app and DAG parsing endpoint
  requirements.txt    Python backend dependencies

frontend/
  public/
    logo.svg          Source logo asset
    logo.png          512px PNG logo
    logo192.png       PWA icon
    logo512.png       PWA icon
    favicon.ico       Multi-size favicon
  src/
    App.js            App shell and header
    NodeContextMenu.js
    draggableNode.js
    toolbar.js
    ui.js             ReactFlow canvas and drag/drop behavior
    submit.js         Frontend-to-backend submission
    store.js          Zustand graph state and node actions
    index.css         App styling
    nodes/
      BaseNode.js     Reusable node renderer
      nodeDefinitions.js
      textNode.js     Dynamic Text node implementation
```

## Running Locally

Start the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend runs at `http://localhost:8000`.

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs at `http://localhost:3000`.

If the backend is hosted somewhere else, set:

```bash
REACT_APP_API_BASE_URL=http://localhost:8000 npm start
```

## Assessment Requirements Mapping

### Part 1: Node Abstraction

The reusable node abstraction lives in `frontend/src/nodes/BaseNode.js`.

Standard nodes are defined through configuration in `frontend/src/nodes/nodeDefinitions.js`. Each node config can declare:

- `label`
- `kicker`
- `title`
- `tone`
- `description`
- `fields`
- `inputs`
- `outputs`

The app converts those definitions into ReactFlow node components through `createNodeComponent`. This means a new standard node can be added by creating a new config object instead of copying an entire component.

The five added nodes are:

- `transform`
- `filter`
- `httpRequest`
- `router`
- `database`

### Part 2: Styling

The UI is styled in `frontend/src/index.css`.

The interface includes:

- Branded app header
- Dark node library
- Hover tooltips for node descriptions
- Light ReactFlow canvas
- Themed node cards
- Custom handles
- Styled controls, minimap, context menu, and submit button
- Responsive layout for narrower screens

### Part 3: Text Node Logic

The Text node lives in `frontend/src/nodes/textNode.js`.

It supports:

- Width growth up to a maximum width.
- Height growth up to a maximum textarea height.
- Internal scrolling after the textarea reaches its max height.
- Variable extraction from valid placeholders such as `{{ input }}`.
- One left-side handle per unique variable.

The variable matcher accepts JavaScript-style identifiers:

```txt
{{ input }}
{{ customer_name }}
{{ $value }}
{{ _metadata }}
```

It rejects invalid identifiers and reserved words.

### Part 4: Backend Integration

The submit button in `frontend/src/submit.js` sends the current ReactFlow `nodes` and `edges` to:

```txt
POST /pipelines/parse
```

The backend returns:

```json
{
  "num_nodes": 3,
  "num_edges": 2,
  "is_dag": true
}
```

The frontend displays those values in a user-friendly alert.

## DAG Detection

The DAG check is implemented in `backend/main.py` using Kahn's algorithm.

The algorithm:

1. Collects all node IDs.
2. Builds an adjacency list.
3. Counts each node's incoming edges.
4. Starts with nodes that have no incoming edges.
5. Removes nodes from the queue and reduces neighbor indegrees.
6. If every node is visited, the graph is a DAG.
7. If any nodes remain unvisited, the graph contains a cycle.

Invalid edges that point to missing nodes return `is_dag: false`.

Complexity:

- Time: `O(nodes + edges)`
- Space: `O(nodes + edges)`

## Extensibility

The project is intentionally structured so most features apply to future nodes automatically.

To add a new standard node, add a config entry in `frontend/src/nodes/nodeDefinitions.js`:

```js
newNodeType: {
  label: 'New Node',
  kicker: 'Category',
  title: 'New Node',
  tone: 'blue',
  description: 'What this node does.',
  fields: [
    {
      name: 'setting',
      label: 'Setting',
      defaultValue: 'Default value',
    },
  ],
  inputs: [{ id: 'input' }],
  outputs: [{ id: 'output' }],
}
```

That node will automatically get:

- Toolbar rendering
- Drag-and-drop creation
- Default field initialization
- Base node layout and styling
- Input/output handles
- Editable form fields
- Toolbar hover description
- Right-click context menu actions
- Rename support
- Duplicate support
- Delete support
- Submission to the backend as part of the graph

Custom nodes can still be created when a node needs specialized behavior. The Text node is the example of this pattern.

## Product Polish Added

These additions are intentionally small and directly tied to workflow-builder usability:

- Right-click context menu for placed nodes.
- Rename, duplicate, copy ID, and delete actions.
- Toolbar hover tooltips sourced from node definitions.
- Custom logo and app metadata.

A separate documentation page was intentionally not added because it would increase surface area without helping the core assessment. The README and inline tooltips provide enough guidance while keeping the app focused.

## Validation

Frontend lint:

```bash
cd frontend
npx eslint src --max-warnings=0
```

Backend syntax check:

```bash
cd backend
python -m py_compile main.py
```

Backend API smoke test:

```bash
curl -s -X POST http://127.0.0.1:8000/pipelines/parse \
  -H 'Content-Type: application/json' \
  -d '{"nodes":[{"id":"a"},{"id":"b"}],"edges":[{"source":"a","target":"b"}]}'
```

Expected response:

```json
{"num_nodes":2,"num_edges":1,"is_dag":true}
```

## Known Notes

- The starter uses Create React App. CRA may print Browserslist or Babel preset maintenance warnings during local commands. These warnings do not prevent the app from compiling or running.
- Do not include `node_modules`, `.venv`, `build`, `__pycache__`, `.DS_Store`, or `.git` in the final submission zip.

## Submission Checklist

Before submitting:

1. Start the backend.
2. Start the frontend.
3. Drag several nodes onto the canvas.
4. Add a Text node with a placeholder like `{{ input }}`.
5. Confirm the Text node creates a left-side input handle.
6. Connect nodes.
7. Click Submit Pipeline.
8. Confirm the alert shows node count, edge count, and DAG status.
9. Zip the project without generated dependency folders.

Suggested zip name:

```txt
FirstName_LastName_technical_assessment.zip
```
