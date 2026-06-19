import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function EndpointsNode(props: NodeProps) {
  return <BaseNode {...props} kind="endpoints" />;
}
