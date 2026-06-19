import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function PipelinesNode(props: NodeProps) {
  return <BaseNode {...props} kind="pipelines" />;
}
