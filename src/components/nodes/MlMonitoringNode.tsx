import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function MlMonitoringNode(props: NodeProps) {
  return <BaseNode {...props} kind="mlmonitoring" />;
}
