import { getSubnetNode } from "./subnet";
import type { DiagramNode } from "../types";

export function assignAirflowSubnetRegion(
  airflowId: string,
  subnetId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet) return nodes;

  return nodes.map((node) => {
    if (node.id !== airflowId || node.kind !== "airflow") return node;
    return {
      ...node,
      data: {
        ...node.data,
        region: subnet.data.region,
      },
    };
  });
}
