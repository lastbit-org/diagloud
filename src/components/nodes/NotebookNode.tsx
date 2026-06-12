import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function NotebookNode(props: NodeProps) {
  return <BaseNode {...props} kind="notebook" />;
}
