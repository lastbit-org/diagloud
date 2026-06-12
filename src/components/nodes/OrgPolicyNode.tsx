import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function OrgPolicyNode(props: NodeProps) {
  return <BaseNode {...props} kind="orgpolicy" />;
}
