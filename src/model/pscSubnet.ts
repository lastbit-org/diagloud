import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { pscHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { DiagramEdge, DiagramNode, PscProps } from "../types";

export function getPscIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter((edge) => edge.kind === "psc-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function clearPscNetwork(
  pscId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== pscId || node.kind !== "psc") return node;
    const data: PscProps = {
      name: node.data.name,
      region: node.data.region,
    };
    return { ...node, data };
  });
}

export function reassignSubnetPscIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = pscHostIndexOffset(subnetId, edges);
  const pscIds = getPscIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < pscIds.length; i += 1) {
    const pscId = pscIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== pscId || node.kind !== "psc") return node;
      if (!ip) {
        return clearPscNetwork(pscId, [node])[0]!;
      }
      return {
        ...node,
        data: {
          ...node.data,
          internalIp: ip,
          region: subnet.data.region,
        },
      };
    });
  }

  return next;
}

export function canAttachPscToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = pscHostIndexOffset(subnetId, edges);
  const pscCount = getPscIdsOnSubnet(subnetId, edges).length;
  return getUsableHostAddress(subnet.data.cidr, baseIndex + pscCount) !== null;
}
