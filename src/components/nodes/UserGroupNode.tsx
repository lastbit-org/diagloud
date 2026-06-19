import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function UserGroupNode(props: NodeProps) {
  return <BaseNode {...props} kind="usergroup" />;
}
