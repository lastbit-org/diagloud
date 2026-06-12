import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function FirebaseNode(props: NodeProps) {
  return <BaseNode {...props} kind="firebase" />;
}
