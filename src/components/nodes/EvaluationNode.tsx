import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function EvaluationNode(props: NodeProps) {
  return <BaseNode {...props} kind="evaluation" />;
}
