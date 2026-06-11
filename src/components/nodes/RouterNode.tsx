import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function RouterNode(props: NodeProps) {
  return <BaseNode {...props} kind="router" />;
}
