import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function PeeringNode(props: NodeProps) {
  return <BaseNode {...props} kind="peering" />;
}
