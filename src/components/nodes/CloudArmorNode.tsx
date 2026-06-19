import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function CloudArmorNode(props: NodeProps) {
  return <BaseNode {...props} kind="cloudarmor" />;
}
