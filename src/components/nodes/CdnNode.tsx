import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function CdnNode(props: NodeProps) {
  return <BaseNode {...props} kind="cdn" />;
}
