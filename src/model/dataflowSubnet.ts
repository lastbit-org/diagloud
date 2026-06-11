import { getSubnetNode } from "./subnet";
import type { DiagramNode } from "../types";

export function assignDataflowSubnetRegion(
  dataflowId: string,
  subnetId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet) return nodes;

  return nodes.map((node) => {
    if (node.id !== dataflowId || node.kind !== "dataflow") return node;
    return {
      ...node,
      data: {
        ...node.data,
        region: subnet.data.region,
      },
    };
  });
}
