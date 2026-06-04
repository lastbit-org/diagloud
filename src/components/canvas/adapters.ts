import type { Edge, Node } from "@xyflow/react";
import { issueCountForNode, type DiagramIssue } from "../../model/validation";
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
  issues: DiagramIssue[] = [],
): Node<GcpNodeData> {
  const issueCount = issueCountForNode(node.id, issues);
  return {
    id: node.id,
    type: node.kind,
    position: node.position,
    selected,
    data: {
      kind: node.kind,
      label: node.data.name,
      subtitle: nodeSubtitle(node),
      issueCount: issueCount > 0 ? issueCount : undefined,
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
