import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function FirestoreNode(props: NodeProps) {
  return <BaseNode {...props} kind="firestore" />;
}
