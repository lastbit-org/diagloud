import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function ArtifactNode(props: NodeProps) {
  return <BaseNode {...props} kind="artifact" />;
}
