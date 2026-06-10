import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function KmsNode(props: NodeProps) {
  return <BaseNode {...props} kind="kms" />;
}
