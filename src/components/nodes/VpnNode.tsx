import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function VpnNode(props: NodeProps) {
  return <BaseNode {...props} kind="vpn" />;
}
