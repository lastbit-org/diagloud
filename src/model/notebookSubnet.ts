import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { notebookHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { DiagramEdge, DiagramNode, NotebookProps } from "../types";

export function getNotebookIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter((edge) => edge.kind === "notebook-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function clearNotebookNetwork(
  notebookId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== notebookId || node.kind !== "notebook") return node;
    const data: NotebookProps = {
      name: node.data.name,
      region: node.data.region,
      machineType: node.data.machineType,
    };
    return { ...node, data };
  });
}

export function reassignSubnetNotebookIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = notebookHostIndexOffset(subnetId, edges);
  const notebookIds = getNotebookIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < notebookIds.length; i += 1) {
    const notebookId = notebookIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== notebookId || node.kind !== "notebook") return node;
      if (!ip) {
        return clearNotebookNetwork(notebookId, [node])[0]!;
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

export function canAttachNotebookToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = notebookHostIndexOffset(subnetId, edges);
  const notebookCount = getNotebookIdsOnSubnet(subnetId, edges).length;
  return getUsableHostAddress(subnet.data.cidr, baseIndex + notebookCount) !== null;
}
