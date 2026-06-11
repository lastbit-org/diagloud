import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function DnsNode(props: NodeProps) {
  return <BaseNode {...props} kind="dns" />;
}
