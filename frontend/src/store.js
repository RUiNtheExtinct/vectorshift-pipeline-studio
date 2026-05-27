import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';

const EDGE_DEFAULTS = {
  type: 'smoothstep',
  animated: true,
  markerEnd: { type: MarkerType.Arrow, height: 18, width: 18 },
};

const STORAGE_KEY = 'pipeline-studio:graph:v1';

export const useStore = create(
  persist(
    (set, get) => ({
      /* ----- graph state -------------------------------------------- */
      nodes: [],
      edges: [],
      nodeIDs: {},

      /* ----- analysis state (NOT persisted) ------------------------- */
      lastAnalysis: null,

      getNodeID: (type) => {
        const newIDs = { ...get().nodeIDs };
        newIDs[type] = (newIDs[type] ?? 0) + 1;
        set({ nodeIDs: newIDs });
        return `${type}-${newIDs[type]}`;
      },

      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
          lastAnalysis: null,
        })),

      duplicateNode: (nodeId) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        const nextNodeId = get().getNodeID(node.type);
        const duplicated = {
          ...node,
          id: nextNodeId,
          position: { x: node.position.x + 44, y: node.position.y + 44 },
          selected: false,
          data: {
            ...node.data,
            id: nextNodeId,
            displayName: node.data?.displayName
              ? `${node.data.displayName} copy`
              : undefined,
          },
        };

        set((state) => ({
          nodes: [...state.nodes, duplicated],
          lastAnalysis: null,
        }));
        return duplicated;
      },

      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId,
          ),
          lastAnalysis: null,
        })),

      clearGraph: () =>
        set({
          nodes: [],
          edges: [],
          nodeIDs: {},
          lastAnalysis: null,
        }),

      onNodesChange: (changes) =>
        set((state) => {
          const next = applyNodeChanges(changes, state.nodes);
          const structural = changes.some(
            (change) =>
              change.type === 'add' ||
              change.type === 'remove' ||
              change.type === 'reset',
          );
          return structural ? { nodes: next, lastAnalysis: null } : { nodes: next };
        }),

      onEdgesChange: (changes) =>
        set((state) => {
          const next = applyEdgeChanges(changes, state.edges);
          const structural = changes.some(
            (change) =>
              change.type === 'add' ||
              change.type === 'remove' ||
              change.type === 'reset',
          );
          return structural ? { edges: next, lastAnalysis: null } : { edges: next };
        }),

      onConnect: (connection) =>
        set((state) => ({
          edges: addEdge({ ...connection, ...EDGE_DEFAULTS }, state.edges),
          lastAnalysis: null,
        })),

      updateNodeField: (nodeId, fieldName, fieldValue) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
              : node,
          ),
        })),

      replaceGraph: ({ nodes = [], edges = [], nodeIDs = {} }) =>
        set({ nodes, edges, nodeIDs, lastAnalysis: null }),

      /* ----- rename dialog state ----------------------------------- */
      renameTarget: null,

      openRenameDialog: (id, currentName) =>
        set({ renameTarget: { id, currentName } }),

      closeRenameDialog: () => set({ renameTarget: null }),

      commitRename: (nextName) => {
        const target = get().renameTarget;
        if (!target) return;
        const trimmed = nextName?.trim();
        if (trimmed) {
          get().updateNodeField(target.id, 'displayName', trimmed);
        }
        set({ renameTarget: null });
      },

      /* ----- pipeline submission state ----------------------------- */
      submission: {
        open: false,
        status: 'idle',
        result: null,
        error: null,
      },

      closeSubmission: () =>
        set((state) => ({ submission: { ...state.submission, open: false } })),

      startSubmission: () =>
        set({
          submission: {
            open: true,
            status: 'loading',
            result: null,
            error: null,
          },
        }),

      setSubmissionSuccess: (result) =>
        set({
          submission: { open: true, status: 'success', result, error: null },
          lastAnalysis: result,
        }),

      setSubmissionError: (error) =>
        set({
          submission: { open: true, status: 'error', result: null, error },
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        nodeIDs: state.nodeIDs,
      }),
    },
  ),
);

export { STORAGE_KEY };
