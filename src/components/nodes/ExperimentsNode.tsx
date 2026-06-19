import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function ExperimentsNode(props: NodeProps) {
  return <BaseNode {...props} kind="experiments" />;
}
