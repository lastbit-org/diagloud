import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function TrainingNode(props: NodeProps) {
  return <BaseNode {...props} kind="training" />;
}
