import {
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type FinalConnectionState,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, type DragEvent } from "react";
import {
  isPaletteResourceKind,
  PALETTE_DRAG_MIME,
} from "../palette/paletteItems";
import { isEditableTarget } from "../../lib/keyboard";
import { useInvalidConnectionFeedback } from "../../hooks/useInvalidConnectionFeedback";
import { useDiagramValidation } from "../../hooks/useDiagramValidation";
import { validateConnection } from "../../model/connections";
import { useDiagramStore } from "../../store/diagramStore";
import { sortNodesByZIndex } from "../../lib/nodeLayers";
import { toFlowEdge, toFlowNode } from "./adapters";
import { ConnectionFeedback } from "./ConnectionFeedback";
import { CustomConnectionLine } from "./CustomConnectionLine";
import { DiagramImageExporter } from "./DiagramImageExporter";
import "./canvas.css";
import { nodeTypes } from "./nodeTypes";

export function DiagramCanvas() {
  const nodes = useDiagramStore((state) => state.nodes);
  const edges = useDiagramStore((state) => state.edges);
  const addNode = useDiagramStore((state) => state.addNode);
  const addEdge = useDiagramStore((state) => state.addEdge);
  const updateNodePosition = useDiagramStore((state) => state.updateNodePosition);
  const updateNodeDimensions = useDiagramStore(
    (state) => state.updateNodeDimensions,
  );
  const removeNode = useDiagramStore((state) => state.removeNode);
  const removeEdge = useDiagramStore((state) => state.removeEdge);
  const selectedNodeId = useDiagramStore((state) => state.selectedNodeId);
  const selectedEdgeId = useDiagramStore((state) => state.selectedEdgeId);
  const selectNode = useDiagramStore((state) => state.selectNode);
  const selectEdge = useDiagramStore((state) => state.selectEdge);
  const clearSelection = useDiagramStore((state) => state.clearSelection);
  const deleteSelection = useDiagramStore((state) => state.deleteSelection);
  const { screenToFlowPosition } = useReactFlow();

  const validationContext = useMemo(
    () => ({ nodes, edges }),
    [nodes, edges],
  );
  const {
    toastMessage,
    rejectedEdge,
    showInvalidConnection,
    handleInvalidConnectEnd,
  } = useInvalidConnectionFeedback(validationContext);

  const { issues } = useDiagramValidation();

  const flowNodes = useMemo(
    () =>
      sortNodesByZIndex(nodes).map((node) =>
        toFlowNode(node, node.id === selectedNodeId, issues),
      ),
    [nodes, selectedNodeId, issues],
  );
  const flowEdges = useMemo(() => {
    const diagramEdges = edges.map((edge) =>
      toFlowEdge(edge, edge.id === selectedEdgeId),
    );
    if (rejectedEdge) {
      diagramEdges.push(rejectedEdge);
    }
    return diagramEdges;
  }, [edges, rejectedEdge, selectedEdgeId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const diagramNodes = useDiagramStore.getState().nodes;

      for (const change of changes) {
        if (change.type === "position" && change.position) {
          updateNodePosition(change.id, change.position);
        }
        if (change.type === "dimensions" && change.dimensions) {
          const diagramNode = diagramNodes.find((node) => node.id === change.id);
          if (diagramNode?.kind !== "zone") continue;

          updateNodeDimensions(
            change.id,
            Math.round(change.dimensions.width),
            Math.round(change.dimensions.height),
          );
        }
        if (change.type === "select" && change.selected) {
          selectNode(change.id);
        }
        if (change.type === "remove") {
          removeNode(change.id);
        }
      }
    },
    [removeNode, selectNode, updateNodeDimensions, updateNodePosition],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === "select" && change.selected) {
          selectEdge(change.id);
        }
        if (change.type === "remove") {
          removeEdge(change.id);
        }
      }
    },
    [removeEdge, selectEdge],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      if (event.key === "Escape") {
        clearSelection();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (!selectedNodeId && !selectedEdgeId) return;
        event.preventDefault();
        deleteSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clearSelection,
    deleteSelection,
    selectedEdgeId,
    selectedNodeId,
  ]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData(PALETTE_DRAG_MIME);
      if (!isPaletteResourceKind(kind)) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(kind, position);
    },
    [addNode, screenToFlowPosition],
  );

  const validateFlowConnection = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target) {
        return { valid: false as const, reason: "unknown-node" as const };
      }

      return validateConnection(
        { source, target, sourceHandle, targetHandle },
        { nodes, edges },
      );
    },
    [edges, nodes],
  );

  const isValidConnection = useCallback(
    (edge: Edge | Connection) => {
      const { source, target, sourceHandle, targetHandle } = edge;
      if (!source || !target || source === target) return false;
      return validateFlowConnection({
        source,
        target,
        sourceHandle: sourceHandle ?? null,
        targetHandle: targetHandle ?? null,
      }).valid;
    },
    [validateFlowConnection],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const result = validateFlowConnection(connection);
      if (result.valid === false) {
        showInvalidConnection(connection);
        return;
      }

      addEdge({
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        kind: result.edgeKind,
      });
    },
    [addEdge, showInvalidConnection, validateFlowConnection],
  );

  const onConnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      handleInvalidConnectEnd(connectionState);
    },
    [handleInvalidConnectEnd],
  );

  return (
    <div className="diagram-canvas">
      <ConnectionFeedback message={toastMessage} />
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        connectionLineComponent={CustomConnectionLine}
        connectionMode={ConnectionMode.Loose}
        onNodeClick={(_, node) => selectNode(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onPaneClick={clearSelection}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        nodesConnectable
        nodesFocusable
        edgesFocusable
        zIndexMode="manual"
        elevateNodesOnSelect={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <DiagramImageExporter />
      </ReactFlow>
    </div>
  );
}
