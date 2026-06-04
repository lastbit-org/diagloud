import { useDiagramStore } from "../store/diagramStore";
import type { DiagramNode } from "../types";

export function useSelectedNode(): DiagramNode | null {
  const selectedNodeId = useDiagramStore((state) => state.selectedNodeId);
  const nodes = useDiagramStore((state) => state.nodes);

  if (!selectedNodeId) return null;
  return nodes.find((node) => node.id === selectedNodeId) ?? null;
}
