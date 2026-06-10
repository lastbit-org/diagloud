import type { Edge, Node } from "@xyflow/react";
import { issueCountForNode, type DiagramIssue } from "../../model/validation";
import { resolveEdgeHandles } from "../../lib/dynamicHandles";
import type { DiagramEdge, DiagramNode } from "../../types";
import { resolveNodeZIndex } from "../../lib/nodeLayers";
import type { GcpNodeData, ZoneNodeData } from "../nodes";

function nodeSubtitle(node: DiagramNode): string | undefined {
  if (node.kind === "zone") {
    return undefined;
  }
  if (
    (node.kind === "vm" ||
      node.kind === "gke" ||
      node.kind === "run" ||
      node.kind === "workbench") &&
    node.data.internalIp
  ) {
    return node.data.internalIp;
  }
  if (node.kind === "run") {
    if (node.data.accessMode === "public") {
      return "URL pública";
    }
    if (!node.data.internalIp) {
      return "VPC connector";
    }
  }
  if (node.kind === "pubsub") {
    return "Tópico";
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
  if (node.kind === "nat" || node.kind === "vpn") {
    return node.data.region;
  }
  if (node.kind === "peering") {
    return "Peering";
  }
  if (node.kind === "artifact") {
    return `${node.data.format} · ${node.data.location}`;
  }
  if (node.kind === "internet") {
    return "Rede pública";
  }
  if (node.kind === "bigquery") {
    return node.data.location;
  }
  if (node.kind === "spanner") {
    return node.data.config;
  }
  return undefined;
}

export function toFlowNode(
  node: DiagramNode,
  selected = false,
  issues: DiagramIssue[] = [],
): Node<GcpNodeData | ZoneNodeData> {
  if (node.kind === "zone") {
    return {
      id: node.id,
      type: "zone",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      connectable: false,
      data: {
        kind: "zone",
        label: node.data.name,
        purpose: node.data.purpose,
        colorId: node.data.colorId,
        width: node.data.width,
        height: node.data.height,
      },
      style: {
        width: node.data.width,
        height: node.data.height,
      },
    };
  }

  const issueCount = issueCountForNode(node.id, issues);
  return {
    id: node.id,
    type: node.kind,
    position: node.position,
    selected,
    zIndex: resolveNodeZIndex(node),
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
