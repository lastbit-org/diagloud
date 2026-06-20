import { getSubnetNode } from "./subnet";
import type { DiagramNode, InstanceGroupProps } from "../types";

export function assignInstanceGroupSubnetRegion(
  instanceGroupId: string,
  subnetId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet) return nodes;

  return nodes.map((node) => {
    if (node.id !== instanceGroupId || node.kind !== "instancegroup") return node;
    return {
      ...node,
      data: {
        ...node.data,
        region: subnet.data.region,
      },
    };
  });
}

export function clearInstanceGroupNetwork(
  instanceGroupId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== instanceGroupId || node.kind !== "instancegroup") return node;
    const data: InstanceGroupProps = {
      name: node.data.name,
      groupType: node.data.groupType,
      targetSize: node.data.targetSize,
      machineType: node.data.machineType,
    };
    return { ...node, data };
  });
}
