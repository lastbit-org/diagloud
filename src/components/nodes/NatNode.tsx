import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function NatNode(props: NodeProps) {
  return <BaseNode {...props} kind="nat" />;
}
