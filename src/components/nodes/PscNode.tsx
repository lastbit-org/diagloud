import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function PscNode(props: NodeProps) {
  return <BaseNode {...props} kind="psc" />;
}
