import { useDiagramStore } from "../store/diagramStore";

export function useSelection() {
  const selectedNodeId = useDiagramStore((state) => state.selectedNodeId);
  const selectedEdgeId = useDiagramStore((state) => state.selectedEdgeId);
  const hasSelection = selectedNodeId !== null || selectedEdgeId !== null;

  return { selectedNodeId, selectedEdgeId, hasSelection };
}
