/**
 * Pipeline Studio pipeline file format (v1).
 *
 * Schema:
 *   {
 *     "format": "pipeline-studio/v1",   // discriminator + version
 *     "version": 1,                      // numeric version
 *     "meta": {                          // descriptive only
 *       "exportedAt": "<ISO 8601>",
 *       "app": "pipeline-studio",
 *       "appVersion": "<semver-ish>"
 *     },
 *     "graph": {
 *       "nodes": [...],                  // ReactFlow node array
 *       "edges": [...],                  // ReactFlow edge array
 *       "nodeIDs": { ... }               // type-counter map
 *     }
 *   }
 *
 * Serialize:  serializePipeline(state) -> object suitable for JSON.stringify
 * Parse:      parsePipeline(unknown)   -> { ok: true, graph } | { ok: false, error }
 */

import { nodeDefinitions } from '@/nodes/nodeDefinitions';

export const PIPELINE_FORMAT = 'pipeline-studio/v1';
export const PIPELINE_VERSION = 1;
export const APP_NAME = 'pipeline-studio';
export const APP_VERSION = '1.0.0';

export function serializePipeline({ nodes, edges, nodeIDs }) {
  return {
    format: PIPELINE_FORMAT,
    version: PIPELINE_VERSION,
    meta: {
      exportedAt: new Date().toISOString(),
      app: APP_NAME,
      appVersion: APP_VERSION,
    },
    graph: {
      nodes: Array.isArray(nodes) ? nodes : [],
      edges: Array.isArray(edges) ? edges : [],
      nodeIDs: nodeIDs && typeof nodeIDs === 'object' ? nodeIDs : {},
    },
  };
}

function fail(error) {
  return { ok: false, error };
}

function ok(graph) {
  return { ok: true, graph };
}

/**
 * Parse and validate an arbitrary value as a Pipeline Studio v1 file.
 * Returns { ok: true, graph } on success or { ok: false, error } on failure.
 * Defaults are filled in only for optional fields. Required mismatches fail.
 */
export function parsePipeline(input) {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    return fail('File is not a JSON object.');
  }

  if (input.format !== PIPELINE_FORMAT) {
    return fail(
      `Unrecognized format "${input.format ?? '(missing)'}". Expected "${PIPELINE_FORMAT}".`,
    );
  }

  if (input.version !== PIPELINE_VERSION) {
    return fail(
      `Unsupported version "${input.version ?? '(missing)'}". This app reads v${PIPELINE_VERSION}.`,
    );
  }

  const graph = input.graph;
  if (graph == null || typeof graph !== 'object') {
    return fail('Missing "graph" object.');
  }

  if (!Array.isArray(graph.nodes)) {
    return fail('"graph.nodes" must be an array.');
  }
  if (!Array.isArray(graph.edges)) {
    return fail('"graph.edges" must be an array.');
  }

  // Validate every node has the minimum required fields and a known type.
  const seenIds = new Set();
  for (const [index, node] of graph.nodes.entries()) {
    if (!node || typeof node !== 'object') {
      return fail(`Node at index ${index} is not an object.`);
    }
    if (typeof node.id !== 'string' || node.id.length === 0) {
      return fail(`Node at index ${index} is missing a string "id".`);
    }
    if (seenIds.has(node.id)) {
      return fail(`Duplicate node id "${node.id}".`);
    }
    seenIds.add(node.id);

    if (typeof node.type !== 'string') {
      return fail(`Node "${node.id}" is missing a string "type".`);
    }
    if (!Object.prototype.hasOwnProperty.call(nodeDefinitions, node.type)) {
      return fail(
        `Node "${node.id}" has unknown type "${node.type}". Known types: ${Object.keys(
          nodeDefinitions,
        ).join(', ')}.`,
      );
    }
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return fail(`Node "${node.id}" is missing a numeric position { x, y }.`);
    }
    if (node.data != null && typeof node.data !== 'object') {
      return fail(`Node "${node.id}" has invalid "data" (must be an object).`);
    }
  }

  // Validate edges reference existing nodes.
  for (const [index, edge] of graph.edges.entries()) {
    if (!edge || typeof edge !== 'object') {
      return fail(`Edge at index ${index} is not an object.`);
    }
    if (typeof edge.source !== 'string' || typeof edge.target !== 'string') {
      return fail(
        `Edge at index ${index} is missing string "source" / "target".`,
      );
    }
    if (!seenIds.has(edge.source)) {
      return fail(`Edge at index ${index} references missing source "${edge.source}".`);
    }
    if (!seenIds.has(edge.target)) {
      return fail(`Edge at index ${index} references missing target "${edge.target}".`);
    }
  }

  // nodeIDs is optional; default to empty map.
  const nodeIDs =
    graph.nodeIDs && typeof graph.nodeIDs === 'object' && !Array.isArray(graph.nodeIDs)
      ? graph.nodeIDs
      : {};

  return ok({
    nodes: graph.nodes,
    edges: graph.edges,
    nodeIDs,
  });
}

export function buildExportFilename(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `pipeline-${yyyy}${mm}${dd}-${hh}${mi}.json`;
}
