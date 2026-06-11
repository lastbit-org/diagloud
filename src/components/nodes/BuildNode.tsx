import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function BuildNode(props: NodeProps) {
  return <BaseNode {...props} kind="build" />;
}
