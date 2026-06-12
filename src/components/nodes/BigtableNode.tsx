import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function BigtableNode(props: NodeProps) {
  return <BaseNode {...props} kind="bigtable" />;
}
