import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function VmNode(props: NodeProps) {
  return <BaseNode {...props} kind="vm" />;
}
