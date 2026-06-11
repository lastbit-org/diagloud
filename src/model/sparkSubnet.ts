import { getSubnetNode } from "./subnet";
import type { DiagramNode } from "../types";

export function assignSparkSubnetRegion(
  sparkId: string,
  subnetId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet) return nodes;

  return nodes.map((node) => {
    if (node.id !== sparkId || node.kind !== "spark") return node;
    return {
      ...node,
      data: {
        ...node.data,
        region: subnet.data.region,
      },
    };
  });
}
