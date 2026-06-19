import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function BatchInferenceNode(props: NodeProps) {
  return <BaseNode {...props} kind="batchinference" />;
}
