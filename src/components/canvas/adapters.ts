import type { Edge, Node } from "@xyflow/react";
import { issueCountForNode, type DiagramIssue } from "../../model/validation";
import { resolveEdgeHandles } from "../../lib/dynamicHandles";
import type { DiagramEdge, DiagramNode } from "../../types";
import type { GcpNodeData } from "../nodes";

function nodeSubtitle(node: DiagramNode): string | undefined {
  if (
    (node.kind === "vm" || node.kind === "gke") &&
    node.data.internalIp
  ) {
    return node.data.internalIp;
  }
  if (node.kind === "subnet") {
    return node.data.cidr;
  }
  if (node.kind === "storage") {
    if (node.data.accessMode === "public") {
      return "Público / CLI";
    }
    return node.data.location;
  }
  if (node.kind === "sql") {
    if (node.data.accessMode === "public") {
      return "IP público";
    }
    if (node.data.internalIp) {
      return node.data.internalIp;
    }
    return "Privado (sub-rede)";
  }
  if (node.kind === "nat") {
    return node.data.region;
  }
  if (node.kind === "artifact") {
    return `${node.data.format} · ${node.data.location}`;
  }
  if (node.kind === "internet") {
    return "Rede pública";
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
  const { sourceHandle, targetHandle } = resolveEdgeHandles(edge);
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle,
    selected,
    className: "gcp-edge",
  };
}
