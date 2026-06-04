import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { gkeHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { DiagramEdge, DiagramNode, GkeProps } from "../types";

export function getGkeIdsOnSubnet(subnetId: string, edges: DiagramEdge[]): string[] {
  return edges
    .filter((edge) => edge.kind === "gke-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function clearGkeNetwork(gkeId: string, nodes: DiagramNode[]): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== gkeId || node.kind !== "gke") return node;
    const data: GkeProps = {
      name: node.data.name,
      nodeCount: node.data.nodeCount,
      machineType: node.data.machineType,
    };
    return { ...node, data };
  });
}

/** IP do endpoint / nó representativo na sub-rede (após VMs e SQL). */
export function reassignSubnetGkeIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = gkeHostIndexOffset(subnetId, edges);
  const gkeIds = getGkeIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < gkeIds.length; i += 1) {
    const gkeId = gkeIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== gkeId || node.kind !== "gke") return node;
      if (!ip) {
        return clearGkeNetwork(gkeId, [node])[0]!;
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

export function canAttachGkeToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = gkeHostIndexOffset(subnetId, edges);
  const gkeCount = getGkeIdsOnSubnet(subnetId, edges).length;
  return getUsableHostAddress(subnet.data.cidr, baseIndex + gkeCount) !== null;
}
