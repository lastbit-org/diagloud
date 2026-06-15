import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { memorystoreHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { DiagramEdge, DiagramNode, MemorystoreProps } from "../types";

export function getMemorystoreIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter(
      (edge) => edge.kind === "memorystore-subnet" && edge.target === subnetId,
    )
    .map((edge) => edge.source);
}

export function clearMemorystoreNetwork(
  memorystoreId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== memorystoreId || node.kind !== "memorystore") return node;
    const data: MemorystoreProps = {
      name: node.data.name,
      region: node.data.region,
      engine: node.data.engine,
      tier: node.data.tier,
    };
    return { ...node, data };
  });
}

export function reassignSubnetMemorystoreIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = memorystoreHostIndexOffset(subnetId, edges);
  const memorystoreIds = getMemorystoreIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < memorystoreIds.length; i += 1) {
    const memorystoreId = memorystoreIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== memorystoreId || node.kind !== "memorystore") return node;
      if (!ip) {
        return clearMemorystoreNetwork(memorystoreId, [node])[0]!;
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

export function canAttachMemorystoreToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = memorystoreHostIndexOffset(subnetId, edges);
  const memorystoreCount = getMemorystoreIdsOnSubnet(subnetId, edges).length;
  return (
    getUsableHostAddress(subnet.data.cidr, baseIndex + memorystoreCount) !==
    null
  );
}
