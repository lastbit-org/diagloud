import { cidrsOverlap, maxVmsForCidr, parseCidr } from "../lib/cidr";
import type { DiagramEdge, DiagramNode } from "../types";

export type SubnetCidrError =
  | "invalid-format"
  | "overlaps-existing";

export function validateSubnetCidr(
  cidr: string,
  subnetId: string | undefined,
  nodes: DiagramNode[],
): { valid: true; normalized: string } | { valid: false; error: SubnetCidrError } {
  const parsed = parseCidr(cidr);
  if (!parsed) {
    return { valid: false, error: "invalid-format" };
  }

  const otherSubnets = nodes.filter(
    (node): node is Extract<DiagramNode, { kind: "subnet" }> =>
      node.kind === "subnet" && node.id !== subnetId,
  );

  for (const other of otherSubnets) {
    if (cidrsOverlap(parsed.cidr, other.data.cidr)) {
      return { valid: false, error: "overlaps-existing" };
    }
  }

  return { valid: true, normalized: parsed.cidr };
}

export function getSubnetNode(
  subnetId: string,
  nodes: DiagramNode[],
): Extract<DiagramNode, { kind: "subnet" }> | null {
  const node = nodes.find((n) => n.id === subnetId);
  if (!node || node.kind !== "subnet") return null;
  return node;
}

export function getVmIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter((edge) => edge.kind === "vm-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function countVmsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): number {
  return getVmIdsOnSubnet(subnetId, edges).length;
}

export function canAttachVmToSubnet(
  subnet: Extract<DiagramNode, { kind: "subnet" }>,
  edges: DiagramEdge[],
): boolean {
  const current = countVmsOnSubnet(subnet.id, edges);
  const max = maxVmsForCidr(subnet.data.cidr);
  return current < max;
}

export function subnetCidrErrorMessage(error: SubnetCidrError): string {
  switch (error) {
    case "invalid-format":
      return "CIDR inválido. Use o formato 10.0.0.0/24 (prefixo /8–/29).";
    case "overlaps-existing":
      return "Este CIDR sobrepõe outra sub-rede do diagrama.";
  }
}
