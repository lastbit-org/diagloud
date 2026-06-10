import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function EntraNode(props: NodeProps) {
  return <BaseNode {...props} kind="entra" />;
}
