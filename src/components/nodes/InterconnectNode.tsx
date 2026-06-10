import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function InterconnectNode(props: NodeProps) {
  return <BaseNode {...props} kind="interconnect" />;
}
