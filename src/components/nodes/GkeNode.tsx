import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function GkeNode(props: NodeProps) {
  return <BaseNode {...props} kind="gke" />;
}
