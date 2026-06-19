import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function TuningNode(props: NodeProps) {
  return <BaseNode {...props} kind="tuning" />;
}
