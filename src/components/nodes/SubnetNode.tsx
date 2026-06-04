import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function SubnetNode(props: NodeProps) {
  return <BaseNode {...props} kind="subnet" />;
}
