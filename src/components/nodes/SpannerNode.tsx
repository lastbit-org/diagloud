import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function SpannerNode(props: NodeProps) {
  return <BaseNode {...props} kind="spanner" />;
}
