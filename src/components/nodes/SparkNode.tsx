import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function SparkNode(props: NodeProps) {
  return <BaseNode {...props} kind="spark" />;
}
