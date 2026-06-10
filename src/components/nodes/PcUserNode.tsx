import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function PcUserNode(props: NodeProps) {
  return <BaseNode {...props} kind="pcuser" />;
}
