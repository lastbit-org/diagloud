import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function VpcNode(props: NodeProps) {
  return <BaseNode {...props} kind="vpc" />;
}
