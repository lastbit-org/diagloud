import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function EventarcNode(props: NodeProps) {
  return <BaseNode {...props} kind="eventarc" />;
}
