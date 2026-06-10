import { parseCidr } from "../lib/cidr";
import { matchesHandleRoles } from "../lib/dynamicHandles";
import { canAttachGkeToSubnet } from "./gkeSubnet";
import { canAttachRunToSubnet } from "./runSubnet";
import { canAttachSqlToSubnet } from "./sqlSubnet";
import { canAttachHostToSubnet } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import { EDGE_ENDPOINTS } from "../types";
import type { DiagramEdge, DiagramNode, ResourceKind } from "../types";

export type ConnectionInput = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type ConnectionInvalidReason =
  | "same-node"
  | "cycle"
  | "unknown-node"
  | "invalid-types"
  | "invalid-handles"
  | "duplicate-edge"
  | "subnet-has-vpc"
  | "vm-has-subnet"
  | "subnet-invalid-cidr"
  | "subnet-vm-capacity"
  | "sql-has-subnet"
  | "sql-not-private"
  | "subnet-sql-capacity"
  | "gke-has-subnet"
  | "subnet-gke-capacity"
  | "nat-has-vpc"
  | "peering-has-max-vpcs"
  | "subnet-has-nat"
  | "run-has-subnet"
  | "run-not-vpc"
  | "subnet-run-capacity";

export function canonicalizeEdgeEndpoints(
  edge: Pick<DiagramEdge, "source" | "target" | "kind">,
  nodes: DiagramNode[],
): { source: string; target: string } {
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);
  if (!sourceNode || !targetNode) {
    return { source: edge.source, target: edge.target };
  }

  const spec = EDGE_ENDPOINTS[edge.kind];
  if (sourceNode.kind === spec.from && targetNode.kind === spec.to) {
    return { source: edge.source, target: edge.target };
  }
  if (sourceNode.kind === spec.to && targetNode.kind === spec.from) {
    return { source: edge.target, target: edge.source };
  }

  return { source: edge.source, target: edge.target };
}

/** Verifica se `toId` é alcançável a partir de `fromId` seguindo as arestas existentes. */
export function canReachNode(
  fromId: string,
  toId: string,
  edges: DiagramEdge[],
  nodes: DiagramNode[] = [],
): boolean {
  if (fromId === toId) return true;

  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const { source, target } =
      nodes.length > 0
        ? canonicalizeEdgeEndpoints(edge, nodes)
        : { source: edge.source, target: edge.target };
    const neighbors = adjacency.get(source);
    if (neighbors) neighbors.push(target);
    else adjacency.set(source, [target]);
  }

  const visited = new Set<string>();
  const stack = [fromId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === toId) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of adjacency.get(id) ?? []) {
      stack.push(next);
    }
  }
  return false;
}

/** Nova aresta `source → target` criaria ciclo (inclui auto-ligação). */
export function wouldCreateDirectedCycle(
  source: string,
  target: string,
  edges: DiagramEdge[],
  nodes: DiagramNode[] = [],
): boolean {
  if (source === target) return true;
  return canReachNode(target, source, edges, nodes);
}

export type ConnectionValidationResult =
  | {
      valid: true;
      edgeKind: DiagramEdge["kind"];
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }
  | { valid: false; reason: ConnectionInvalidReason };

export function getEdgeKind(
  from: ResourceKind,
  to: ResourceKind,
): DiagramEdge["kind"] | null {
  for (const [kind, endpoints] of Object.entries(EDGE_ENDPOINTS) as [
    DiagramEdge["kind"],
    (typeof EDGE_ENDPOINTS)[DiagramEdge["kind"]],
  ][]) {
    if (endpoints.from === from && endpoints.to === to) {
      return kind;
    }
  }
  return null;
}

export function matchesHandleIds(
  _edgeKind: DiagramEdge["kind"],
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
): boolean {
  return matchesHandleRoles(sourceHandle, targetHandle);
}

function resolveVmSubnetPair(
  source: string,
  target: string,
  nodes: DiagramNode[],
): { vmId: string; subnetId: string } | null {
  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  if (!sourceNode || !targetNode) return null;

  if (sourceNode.kind === "vm" && targetNode.kind === "subnet") {
    return { vmId: source, subnetId: target };
  }
  if (sourceNode.kind === "subnet" && targetNode.kind === "vm") {
    return { vmId: target, subnetId: source };
  }
  return null;
}

/** Mensagem correta quando a sub-rede não tem mais IP (mesmo se handles/tipos falharem no RF). */
export function detectSubnetVmCapacityReason(
  connection: ConnectionInput,
  context: { nodes: DiagramNode[]; edges: DiagramEdge[] },
): "subnet-vm-capacity" | null {
  const pair = resolveVmSubnetPair(connection.source, connection.target, context.nodes);
  if (!pair) return null;

  const vmHasSubnet = context.edges.some(
    (edge) => edge.kind === "vm-subnet" && edge.source === pair.vmId,
  );
  if (vmHasSubnet) return null;

  const subnet = getSubnetNode(pair.subnetId, context.nodes);
  if (
    subnet &&
    parseCidr(subnet.data.cidr) &&
    !canAttachHostToSubnet(pair.subnetId, context.nodes, context.edges)
  ) {
    return "subnet-vm-capacity";
  }
  return null;
}

export function explainConnectionFailure(
  connection: ConnectionInput,
  context: { nodes: DiagramNode[]; edges: DiagramEdge[] },
): ConnectionInvalidReason {
  const capacityReason = detectSubnetVmCapacityReason(connection, context);
  if (capacityReason) return capacityReason;

  const result = validateConnection(connection, context);
  if (!result.valid) return result.reason;

  return "invalid-types";
}

function normalizeConnectionDirection(
  connection: ConnectionInput,
  sourceNode: DiagramNode,
  targetNode: DiagramNode,
): { connection: ConnectionInput; edgeKind: DiagramEdge["kind"] } | null {
  let edgeKind = getEdgeKind(sourceNode.kind, targetNode.kind);
  if (edgeKind) {
    return { connection, edgeKind };
  }

  const reversedKind = getEdgeKind(targetNode.kind, sourceNode.kind);
  if (!reversedKind) return null;

  return {
    edgeKind: reversedKind,
    connection: {
      source: connection.target,
      target: connection.source,
      sourceHandle: connection.targetHandle,
      targetHandle: connection.sourceHandle,
    },
  };
}

/** Valida tipo, handles, duplicata e cardinalidade (1 VPC por sub-rede, 1 sub-rede por VM). */
export function validateConnection(
  connection: ConnectionInput,
  context: { nodes: DiagramNode[]; edges: DiagramEdge[] },
): ConnectionValidationResult {
  const { source, target } = connection;

  if (source === target) {
    return { valid: false, reason: "same-node" };
  }

  const sourceNode = context.nodes.find((node) => node.id === source);
  const targetNode = context.nodes.find((node) => node.id === target);
  if (!sourceNode || !targetNode) {
    return { valid: false, reason: "unknown-node" };
  }

  const capacityReason = detectSubnetVmCapacityReason(connection, context);
  if (capacityReason) {
    return { valid: false, reason: capacityReason };
  }

  const normalized = normalizeConnectionDirection(
    connection,
    sourceNode,
    targetNode,
  );
  if (!normalized) {
    return { valid: false, reason: "invalid-types" };
  }

  const { connection: directed, edgeKind } = normalized;
  const { sourceHandle, targetHandle } = directed;

  if (!matchesHandleIds(edgeKind, sourceHandle, targetHandle)) {
    return { valid: false, reason: "invalid-handles" };
  }

  const duplicate = context.edges.some(
    (edge) =>
      edge.source === directed.source &&
      edge.target === directed.target &&
      edge.kind === edgeKind,
  );
  if (duplicate) {
    return { valid: false, reason: "duplicate-edge" };
  }

  if (
    wouldCreateDirectedCycle(
      directed.source,
      directed.target,
      context.edges,
      context.nodes,
    )
  ) {
    return {
      valid: false,
      reason: directed.source === directed.target ? "same-node" : "cycle",
    };
  }

  if (
    edgeKind === "subnet-vpc" &&
    context.edges.some(
      (edge) => edge.kind === "subnet-vpc" && edge.source === directed.source,
    )
  ) {
    return { valid: false, reason: "subnet-has-vpc" };
  }

  if (
    edgeKind === "vm-subnet" &&
    context.edges.some(
      (edge) => edge.kind === "vm-subnet" && edge.source === directed.source,
    )
  ) {
    return { valid: false, reason: "vm-has-subnet" };
  }

  if (
    edgeKind === "sql-subnet" &&
    context.edges.some(
      (edge) => edge.kind === "sql-subnet" && edge.source === directed.source,
    )
  ) {
    return { valid: false, reason: "sql-has-subnet" };
  }

  if (edgeKind === "sql-subnet") {
    const sqlNode = context.nodes.find((n) => n.id === directed.source);
    if (!sqlNode || sqlNode.kind !== "sql") {
      return { valid: false, reason: "unknown-node" };
    }
    if (sqlNode.data.accessMode !== "private") {
      return { valid: false, reason: "sql-not-private" };
    }
    const subnet = getSubnetNode(directed.target, context.nodes);
    if (!subnet || !parseCidr(subnet.data.cidr)) {
      return { valid: false, reason: "subnet-invalid-cidr" };
    }
    if (!canAttachSqlToSubnet(directed.target, context.nodes, context.edges)) {
      return { valid: false, reason: "subnet-sql-capacity" };
    }
  }

  if (
    edgeKind === "gke-subnet" &&
    context.edges.some(
      (edge) => edge.kind === "gke-subnet" && edge.source === directed.source,
    )
  ) {
    return { valid: false, reason: "gke-has-subnet" };
  }

  if (edgeKind === "gke-subnet") {
    const subnet = getSubnetNode(directed.target, context.nodes);
    if (!subnet || !parseCidr(subnet.data.cidr)) {
      return { valid: false, reason: "subnet-invalid-cidr" };
    }
    if (!canAttachGkeToSubnet(directed.target, context.nodes, context.edges)) {
      return { valid: false, reason: "subnet-gke-capacity" };
    }
  }

  if (edgeKind === "vm-subnet") {
    const subnet = getSubnetNode(directed.target, context.nodes);
    if (!subnet || !parseCidr(subnet.data.cidr)) {
      return { valid: false, reason: "subnet-invalid-cidr" };
    }
    if (!canAttachHostToSubnet(directed.target, context.nodes, context.edges)) {
      return { valid: false, reason: "subnet-vm-capacity" };
    }
  }

  if (
    edgeKind === "nat-vpc" &&
    context.edges.some(
      (edge) => edge.kind === "nat-vpc" && edge.source === directed.source,
    )
  ) {
    return { valid: false, reason: "nat-has-vpc" };
  }

  if (edgeKind === "peering-vpc") {
    const peeringVpcEdges = context.edges.filter(
      (edge) => edge.kind === "peering-vpc" && edge.source === directed.source,
    );
    if (peeringVpcEdges.length >= 2) {
      return { valid: false, reason: "peering-has-max-vpcs" };
    }
    if (peeringVpcEdges.some((edge) => edge.target === directed.target)) {
      return { valid: false, reason: "duplicate-edge" };
    }
  }

  if (
    edgeKind === "subnet-nat" &&
    context.edges.some(
      (edge) => edge.kind === "subnet-nat" && edge.source === directed.source,
    )
  ) {
    return { valid: false, reason: "subnet-has-nat" };
  }

  if (
    edgeKind === "run-subnet" &&
    context.edges.some(
      (edge) => edge.kind === "run-subnet" && edge.source === directed.source,
    )
  ) {
    return { valid: false, reason: "run-has-subnet" };
  }

  if (edgeKind === "run-subnet") {
    const runNode = context.nodes.find((n) => n.id === directed.source);
    if (!runNode || runNode.kind !== "run") {
      return { valid: false, reason: "unknown-node" };
    }
    if (runNode.data.accessMode !== "vpc") {
      return { valid: false, reason: "run-not-vpc" };
    }
    const subnet = getSubnetNode(directed.target, context.nodes);
    if (!subnet || !parseCidr(subnet.data.cidr)) {
      return { valid: false, reason: "subnet-invalid-cidr" };
    }
    if (!canAttachRunToSubnet(directed.target, context.nodes, context.edges)) {
      return { valid: false, reason: "subnet-run-capacity" };
    }
  }

  return {
    valid: true,
    edgeKind,
    source: directed.source,
    target: directed.target,
    sourceHandle: directed.sourceHandle ?? undefined,
    targetHandle: directed.targetHandle ?? undefined,
  };
}

export function isValidConnection(
  sourceKind: ResourceKind,
  targetKind: ResourceKind,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
): boolean {
  const edgeKind = getEdgeKind(sourceKind, targetKind);
  if (!edgeKind) return false;
  return matchesHandleIds(edgeKind, sourceHandle, targetHandle);
}

export function handlesForEdgeKind(_kind: DiagramEdge["kind"]): {
  sourceHandle: string;
  targetHandle: string;
} {
  return {
    sourceHandle: "bottom-0",
    targetHandle: "top-0",
  };
}
