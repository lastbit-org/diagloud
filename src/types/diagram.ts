import type { NamingPatternByKind } from "./naming";
import type {
  ArtifactProps,
  GkeProps,
  InternetProps,
  NatProps,
  PeeringProps,
  VpnProps,
  BigqueryProps,
  PubsubProps,
  RunProps,
  SqlProps,
  StorageProps,
  SubnetProps,
  VmProps,
  VpcProps,
  ZoneProps,
} from "./resources";

export const DIAGRAM_DOCUMENT_VERSION = 1 as const;

type NodeBase = {
  id: string;
  position: {
    x: number;
    y: number;
  };
  /** Ordem de empilhamento no canvas (menor = mais atrás). */
  zIndex?: number;
};

export type DiagramNode =
  | (NodeBase & { kind: "vpc"; data: VpcProps })
  | (NodeBase & { kind: "subnet"; data: SubnetProps })
  | (NodeBase & { kind: "vm"; data: VmProps })
  | (NodeBase & { kind: "storage"; data: StorageProps })
  | (NodeBase & { kind: "sql"; data: SqlProps })
  | (NodeBase & { kind: "gke"; data: GkeProps })
  | (NodeBase & { kind: "nat"; data: NatProps })
  | (NodeBase & { kind: "peering"; data: PeeringProps })
  | (NodeBase & { kind: "vpn"; data: VpnProps })
  | (NodeBase & { kind: "artifact"; data: ArtifactProps })
  | (NodeBase & { kind: "internet"; data: InternetProps })
  | (NodeBase & { kind: "run"; data: RunProps })
  | (NodeBase & { kind: "pubsub"; data: PubsubProps })
  | (NodeBase & { kind: "bigquery"; data: BigqueryProps })
  | (NodeBase & { kind: "zone"; data: ZoneProps });

export type DiagramEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  kind:
    | "subnet-vpc"
    | "vm-subnet"
    | "vm-storage"
    | "sql-subnet"
    | "gke-subnet"
    | "nat-vpc"
    | "peering-vpc"
    | "vpn-vpc"
    | "internet-nat"
    | "internet-vpn"
    | "subnet-nat"
    | "gke-artifact"
    | "vm-artifact"
    | "run-subnet"
    | "run-artifact"
    | "pubsub-run"
    | "pubsub-storage"
    | "pubsub-bigquery";
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
