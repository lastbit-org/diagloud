import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function DataflowNode(props: NodeProps) {
  return <BaseNode {...props} kind="dataflow" />;
}
