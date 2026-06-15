import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { alloydbHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { AlloydbProps, DiagramEdge, DiagramNode } from "../types";

export function getAlloydbIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter((edge) => edge.kind === "alloydb-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function clearAlloydbNetwork(
  alloydbId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== alloydbId || node.kind !== "alloydb") return node;
    const data: AlloydbProps = {
      name: node.data.name,
      region: node.data.region,
    };
    return { ...node, data };
  });
}

export function reassignSubnetAlloydbIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = alloydbHostIndexOffset(subnetId, edges);
  const alloydbIds = getAlloydbIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < alloydbIds.length; i += 1) {
    const alloydbId = alloydbIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== alloydbId || node.kind !== "alloydb") return node;
      if (!ip) {
        return clearAlloydbNetwork(alloydbId, [node])[0]!;
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

export function canAttachAlloydbToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = alloydbHostIndexOffset(subnetId, edges);
  const alloydbCount = getAlloydbIdsOnSubnet(subnetId, edges).length;
  return (
    getUsableHostAddress(subnet.data.cidr, baseIndex + alloydbCount) !== null
  );
}
