import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function ApigeeNode(props: NodeProps) {
  return <BaseNode {...props} kind="apigee" />;
}
