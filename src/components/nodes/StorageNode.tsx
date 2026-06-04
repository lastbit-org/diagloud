import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function StorageNode(props: NodeProps) {
  return <BaseNode {...props} kind="storage" />;
}
