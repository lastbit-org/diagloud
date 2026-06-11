import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function ModelRegistryNode(props: NodeProps) {
  return <BaseNode {...props} kind="modelregistry" />;
}
