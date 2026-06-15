import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { runHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { DiagramEdge, DiagramNode, RunProps } from "../types";

export function getRunIdsOnSubnet(subnetId: string, edges: DiagramEdge[]): string[] {
  return edges
    .filter((edge) => edge.kind === "run-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function clearRunNetwork(runId: string, nodes: DiagramNode[]): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== runId || node.kind !== "run") return node;
    const data: RunProps = {
      name: node.data.name,
      sourceType: node.data.sourceType,
      imageUrl: node.data.imageUrl,
      cpu: node.data.cpu,
      memory: node.data.memory,
      minInstances: node.data.minInstances,
      accessMode: node.data.accessMode,
    };
    return { ...node, data };
  });
}

export function reassignSubnetRunIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = runHostIndexOffset(subnetId, edges);
  const runIds = getRunIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < runIds.length; i += 1) {
    const runId = runIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== runId || node.kind !== "run") return node;
      if (!ip) {
        return clearRunNetwork(runId, [node])[0]!;
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

export function canAttachRunToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = runHostIndexOffset(subnetId, edges);
  const runCount = getRunIdsOnSubnet(subnetId, edges).length;
  return getUsableHostAddress(subnet.data.cidr, baseIndex + runCount) !== null;
}
