import type { Edge, Node } from "@xyflow/react";
import { handlesForEdgeKind } from "../../model/connections";
import type { DiagramEdge, DiagramNode } from "../../types";
import type { GcpNodeData } from "../nodes";

function nodeSubtitle(node: DiagramNode): string | undefined {
  if (node.kind === "vm" && node.data.internalIp) {
    return node.data.internalIp;
  }
  if (node.kind === "subnet") {
    return node.data.cidr;
  }
  return undefined;
}

export function toFlowNode(
  node: DiagramNode,
  selected = false,
): Node<GcpNodeData> {
  return {
    id: node.id,
    type: node.kind,
    position: node.position,
    selected,
    data: {
      kind: node.kind,
      label: node.data.name,
      subtitle: nodeSubtitle(node),
    },
  };
}

export function toFlowEdge(edge: DiagramEdge, selected = false): Edge {
  const { sourceHandle, targetHandle } = handlesForEdgeKind(edge.kind);
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle,
    selected,
  };
}
