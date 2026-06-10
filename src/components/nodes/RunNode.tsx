import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function RunNode(props: NodeProps) {
  return <BaseNode {...props} kind="run" />;
}
