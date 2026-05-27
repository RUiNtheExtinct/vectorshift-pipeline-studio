import * as React from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap } from 'reactflow';
import { shallow } from 'zustand/shallow';
import { useStore } from '@/store';
import { useTheme } from '@/lib/theme';
import { createInitialNodeData, nodeDefinitions, nodeTypes } from '@/nodes/nodeDefinitions';
import { NodeContextMenu } from './NodeContextMenu';
import { EmptyCanvasHint } from './EmptyCanvasHint';
import { CanvasToolbar } from './CanvasToolbar';

const GRID_SIZE = 20;
const PRO_OPTIONS = { hideAttribution: true };

const TONE_HEX = {
  green: '#15a37a',
  violet: '#7e57f0',
  blue: '#3b82f6',
  amber: '#d99543',
  red: '#dc4646',
  cyan: '#3aa6c4',
  pink: '#d864a6',
  slate: '#64748b',
  black: '#1f2937',
};

const minimapNodeStroke = (node) => {
  const tone = nodeDefinitions[node.type]?.tone ?? 'slate';
  return TONE_HEX[tone] ?? TONE_HEX.slate;
};

const minimapNodeColor = (node) => {
  const tone = nodeDefinitions[node.type]?.tone ?? 'slate';
  return `${TONE_HEX[tone] ?? TONE_HEX.slate}33`;
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  lastAnalysis: state.lastAnalysis,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

function edgeIdentity(edge) {
  return edge.id || `${edge.source}->${edge.target}`;
}

export function PipelineCanvas() {
  const wrapperRef = React.useRef(null);
  const [instance, setInstance] = React.useState(null);
  const [contextMenu, setContextMenu] = React.useState(null);

  const {
    nodes,
    edges,
    lastAnalysis,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useStore(selector, shallow);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const backgroundColor = isDark ? '#334155' : '#cbd5e1';
  const maskColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.06)';

  /* --- Decorated nodes/edges based on last analysis ---------------- */

  const cycleNodeSet = React.useMemo(
    () => new Set(lastAnalysis?.cycle_node_ids ?? []),
    [lastAnalysis],
  );

  const cycleEdgeSet = React.useMemo(
    () => new Set(lastAnalysis?.cycle_edge_ids ?? []),
    [lastAnalysis],
  );

  const executionRank = React.useMemo(() => {
    const map = new Map();
    (lastAnalysis?.execution_order ?? []).forEach((id, index) => {
      map.set(id, index + 1);
    });
    return map;
  }, [lastAnalysis]);

  const decoratedNodes = React.useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        className: cycleNodeSet.has(node.id) ? 'pipeline-node-in-cycle' : undefined,
        data: {
          ...node.data,
          executionRank: executionRank.get(node.id),
          inCycle: cycleNodeSet.has(node.id),
        },
      })),
    [nodes, cycleNodeSet, executionRank],
  );

  const decoratedEdges = React.useMemo(
    () =>
      edges.map((edge) => {
        const inCycle = cycleEdgeSet.has(edgeIdentity(edge));
        return {
          ...edge,
          className: inCycle ? 'pipeline-edge-in-cycle' : undefined,
          style: inCycle ? { stroke: '#dc4646', strokeWidth: 2 } : edge.style,
          markerEnd: inCycle
            ? { ...edge.markerEnd, color: '#dc4646' }
            : edge.markerEnd,
          animated: inCycle ? true : edge.animated,
        };
      }),
    [edges, cycleEdgeSet],
  );

  /* --- Drag and drop ----------------------------------------------- */

  const onDrop = React.useCallback(
    (event) => {
      event.preventDefault();
      if (!instance || !wrapperRef.current) return;
      const raw = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;
      const { nodeType } = JSON.parse(raw);
      if (!nodeType) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = instance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const id = getNodeID(nodeType);
      addNode({
        id,
        type: nodeType,
        position,
        data: createInitialNodeData(id, nodeType),
      });
      setContextMenu(null);
    },
    [addNode, getNodeID, instance],
  );

  const onDragOver = React.useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeContextMenu = React.useCallback((event, node) => {
    event.preventDefault();
    if (!wrapperRef.current) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    setContextMenu({
      nodeId: node.id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  }, []);

  const closeContextMenu = React.useCallback(() => setContextMenu(null), []);

  return (
    <div
      ref={wrapperRef}
      className="relative h-full min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <ReactFlow
        nodes={decoratedNodes}
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setInstance}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={closeContextMenu}
        onMoveStart={closeContextMenu}
        proOptions={PRO_OPTIONS}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        connectionLineType="smoothstep"
        defaultEdgeOptions={{ type: 'smoothstep' }}
        fitView
      >
        <Background
          color={backgroundColor}
          gap={GRID_SIZE}
          size={1.2}
          variant={BackgroundVariant.Dots}
        />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={minimapNodeColor}
          nodeStrokeColor={minimapNodeStroke}
          maskColor={maskColor}
        />
      </ReactFlow>
      <CanvasToolbar />
      {nodes.length === 0 && <EmptyCanvasHint />}
      <NodeContextMenu menu={contextMenu} onClose={closeContextMenu} />
    </div>
  );
}
