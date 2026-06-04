import type { NamingPatternByKind } from "./naming";
import type { SqlProps, StorageProps, SubnetProps, VmProps, VpcProps } from "./resources";

export const DIAGRAM_DOCUMENT_VERSION = 1 as const;

type NodeBase = {
  id: string;
  position: {
    x: number;
    y: number;
  };
};

export type DiagramNode =
  | (NodeBase & { kind: "vpc"; data: VpcProps })
  | (NodeBase & { kind: "subnet"; data: SubnetProps })
  | (NodeBase & { kind: "vm"; data: VmProps })
  | (NodeBase & { kind: "storage"; data: StorageProps })
  | (NodeBase & { kind: "sql"; data: SqlProps });

export type DiagramEdge = {
  id: string;
  source: string;
  target: string;
  kind: "subnet-vpc" | "vm-subnet" | "vm-storage" | "sql-subnet";
};

export type DiagramNamingMetadata = {
  area: string;
  ambiente: string;
  patterns: NamingPatternByKind;
  isActive: boolean;
};

export type DiagramMetadata = {
  savedAt: string;
  generator: "diagloud";
  naming?: DiagramNamingMetadata;
};

export type DiagramDocument = {
  version: typeof DIAGRAM_DOCUMENT_VERSION;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  metadata: DiagramMetadata;
};

/** Formato legado (sem metadata) ainda aceito na importação. */
export type LegacyDiagramDocument = {
  version: typeof DIAGRAM_DOCUMENT_VERSION;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};
