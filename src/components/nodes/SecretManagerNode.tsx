import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function SecretManagerNode(props: NodeProps) {
  return <BaseNode {...props} kind="secretmanager" />;
}
