import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function FeatureStoreNode(props: NodeProps) {
  return <BaseNode {...props} kind="featurestore" />;
}
