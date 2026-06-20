import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function InstanceGroupNode(props: NodeProps) {
  return <BaseNode {...props} kind="instancegroup" />;
}
