# BFHL Hierarchy Analyzer

REST API and interactive frontend for processing hierarchical node relationships,
detecting tree structures and cycles, and visualizing the results.

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node.js)

### Install Dependencies

```bash
cd server
npm install
```

### Environment Variables

Copy the example env file and adjust if needed:

```bash
cp server/.env.example server/.env
```

| Variable | Default | Description           |
|----------|---------|-----------------------|
| `PORT`   | `3000`  | Port the API runs on  |

---

## Running Locally

### Start the API Server

```bash
cd server
npm start
```

The server will be available at `http://localhost:3000`.

### Open the Frontend

Open `client/index.html` directly in your browser, or serve it via any static file
server. The frontend calls the API at the URL defined in the `API_BASE` constant
inside the HTML file (defaults to `http://localhost:3000`).

---

## API Reference

### `POST /bfhl`

Process hierarchical node strings and return structured tree/cycle analysis.

**Request**

```json
{
  "data": ["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X"]
}
```

Each entry must match the format `X->Y` where X and Y are single uppercase letters
A–Z. Self-loops like `A->A` are rejected. Whitespace around entries is trimmed
before validation.

**Response**

| Field                 | Type     | Description                                       |
|-----------------------|----------|---------------------------------------------------|
| `user_id`             | string   | Identifer in `name_ddmmyyyy` format                |
| `email_id`            | string   | College email address                              |
| `college_roll_number` | string   | College roll number                                |
| `hierarchies`         | array    | Array of hierarchy objects (see below)             |
| `invalid_entries`     | string[] | Entries that failed format validation              |
| `duplicate_edges`     | string[] | Edges that appeared more than once (listed once)   |
| `summary`             | object   | Aggregate stats about trees and cycles             |

**Hierarchy Object**

| Field       | Type    | Condition                              |
|-------------|---------|----------------------------------------|
| `root`      | string  | Always present                         |
| `tree`      | object  | Nested tree or `{}` if cyclic          |
| `depth`     | number  | Present only for non-cyclic trees      |
| `has_cycle` | boolean | Present as `true` only when cycle found|

**Summary Object**

| Field              | Type   | Description                              |
|--------------------|--------|------------------------------------------|
| `total_trees`      | number | Count of valid non-cyclic trees          |
| `total_cycles`     | number | Count of cyclic groups                   |
| `largest_tree_root`| string | Root of the tree with the greatest depth |

**Error Responses**

| Status | Body                                    | Cause                   |
|--------|-----------------------------------------|-------------------------|
| 400    | `{ "error": "missing data field" }`     | No `data` key in body   |
| 400    | `{ "error": "data must be an array" }`  | `data` is not an array  |

---

## Logic Overview

The processing pipeline is split across four modules:

### 1. Validator (`validator.js`)

Trims each entry, matches against `^[A-Z]->[A-Z]$`, rejects self-loops, and
separates valid edges from invalid entries.

### 2. Tree Builder (`treeBuilder.js`)

- **Deduplication** — first occurrence of each `parent->child` pair is kept;
  repeats are collected (each unique duplicate recorded once).
- **Adjacency list** — directed graph stored as a `Map`. Enforces single-parent
  rule: if a child already has a parent from an earlier edge, later edges to the
  same child are silently dropped.
- **Component discovery** — uses BFS on an undirected projection of the graph
  to find independent connected components.
- **Root identification** — a root is a node that never appears as a child.
  If all nodes are children (pure cycle), the lexicographically smallest node
  is used.
- **Nested tree assembly** — iterative DFS builds a nested JS object from the
  adjacency list.

### 3. Cycle Detector (`cycleDetector.js`)

- **Cycle detection** — iterative DFS with three-color (white/gray/black) marking.
  A back-edge to a gray node signals a cycle.
- **Depth measurement** — iterative DFS tracking the level of each node. The
  maximum level across all leaf nodes is the tree's depth.

### 4. Summarizer (`summarizer.js`)

Counts non-cyclic trees and cyclic groups. Finds the root of the deepest tree,
using lexicographic comparison as a tiebreaker when depths are equal.

---

## Features

### Backend
- Modular architecture with pure functions (no classes)
- Iterative DFS for cycle detection and depth measurement
- CORS enabled for all origins
- Vercel-ready deployment config

### Frontend
- Dark/Light theme with CSS custom properties, persisted in localStorage
- Live input validation with line-by-line highlighting
- ASCII tree visualization with box-drawing characters
- JSON view with manual syntax highlighting (no libraries)
- Stats cards, colored chips for invalid/duplicate entries
- Copy to clipboard and export-as-file buttons
- History panel storing the last 5 API calls
- Shimmer skeleton loading animation (pure CSS)
- Keyboard shortcut: Ctrl+Enter / Cmd+Enter to submit
- Cumulative edge counter badge in the header
- Fully responsive layout
