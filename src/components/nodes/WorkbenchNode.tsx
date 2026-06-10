import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function WorkbenchNode(props: NodeProps) {
  return <BaseNode {...props} kind="workbench" />;
}
