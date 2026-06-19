import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function KnowledgeCatalogNode(props: NodeProps) {
  return <BaseNode {...props} kind="knowledgecatalog" />;
}
