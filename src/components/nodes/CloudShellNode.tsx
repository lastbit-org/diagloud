import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function CloudShellNode(props: NodeProps) {
  return <BaseNode {...props} kind="cloudshell" />;
}
