import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function MonitoringNode(props: NodeProps) {
  return <BaseNode {...props} kind="monitoring" />;
}
