import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { workbenchHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { DiagramEdge, DiagramNode, WorkbenchProps } from "../types";

export function getWorkbenchIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter((edge) => edge.kind === "workbench-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function clearWorkbenchNetwork(
  workbenchId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== workbenchId || node.kind !== "workbench") return node;
    const data: WorkbenchProps = {
      name: node.data.name,
      region: node.data.region,
      machineType: node.data.machineType,
    };
    return { ...node, data };
  });
}

export function reassignSubnetWorkbenchIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = workbenchHostIndexOffset(subnetId, edges);
  const workbenchIds = getWorkbenchIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < workbenchIds.length; i += 1) {
    const workbenchId = workbenchIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== workbenchId || node.kind !== "workbench") return node;
      if (!ip) {
        return clearWorkbenchNetwork(workbenchId, [node])[0]!;
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

export function canAttachWorkbenchToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = workbenchHostIndexOffset(subnetId, edges);
  const workbenchCount = getWorkbenchIdsOnSubnet(subnetId, edges).length;
  return getUsableHostAddress(subnet.data.cidr, baseIndex + workbenchCount) !== null;
}
