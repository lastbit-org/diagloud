import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function LoadBalancerNode(props: NodeProps) {
  return <BaseNode {...props} kind="loadbalancer" />;
}
