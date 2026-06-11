import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function AirflowNode(props: NodeProps) {
  return <BaseNode {...props} kind="airflow" />;
}
