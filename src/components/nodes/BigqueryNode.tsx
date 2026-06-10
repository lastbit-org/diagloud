import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function BigqueryNode(props: NodeProps) {
  return <BaseNode {...props} kind="bigquery" />;
}
