import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function InternetNode(props: NodeProps) {
  return <BaseNode {...props} kind="internet" />;
}
