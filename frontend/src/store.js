// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    duplicateNode: (nodeId) => {
      const node = get().nodes.find((currentNode) => currentNode.id === nodeId);

      if (!node) {
        return null;
      }

      const nextNodeId = get().getNodeID(node.type);
      const duplicatedNode = {
        ...node,
        id: nextNodeId,
        position: {
          x: node.position.x + 44,
          y: node.position.y + 44,
        },
        selected: false,
        data: {
          ...node.data,
          id: nextNodeId,
          displayName: node.data?.displayName
            ? `${node.data.displayName} copy`
            : undefined,
        },
      };

      set({
        nodes: [...get().nodes, duplicatedNode],
      });

      return duplicatedNode;
    },
    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((node) => node.id !== nodeId),
        edges: get().edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
      });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      set({
        edges: addEdge({...connection, type: 'smoothstep', animated: true, markerEnd: {type: MarkerType.Arrow, height: '20px', width: '20px'}}, get().edges),
      });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, [fieldName]: fieldValue },
            };
          }
  
          return node;
        }),
      });
    },
  }));
