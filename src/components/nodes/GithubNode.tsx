import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function GithubNode(props: NodeProps) {
  return <BaseNode {...props} kind="github" />;
}
