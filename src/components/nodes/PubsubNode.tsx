import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function PubsubNode(props: NodeProps) {
  return <BaseNode {...props} kind="pubsub" />;
}
