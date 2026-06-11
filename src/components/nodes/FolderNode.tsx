import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function FolderNode(props: NodeProps) {
  return <BaseNode {...props} kind="folder" />;
}
