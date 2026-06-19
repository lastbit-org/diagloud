import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function CloudLoggingNode(props: NodeProps) {
  return <BaseNode {...props} kind="cloudlogging" />;
}
