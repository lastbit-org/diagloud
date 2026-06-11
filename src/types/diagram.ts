import type { NamingPatternByKind } from "./naming";
import type {
  ArtifactProps,
  BuildProps,
  KmsProps,
  GkeProps,
  InternetProps,
  NatProps,
  PeeringProps,
  VpnProps,
  InterconnectProps,
  FirewallProps,
  BigqueryProps,
  SpannerProps,
  FirestoreProps,
  WorkbenchProps,
  PubsubProps,
  EventarcProps,
  RunProps,
  SqlProps,
  StorageProps,
  SubnetProps,
  VmProps,
  VpcProps,
  ZoneProps,
  FolderProps,
  ProjectProps,
  EntraProps,
  InfocardProps,
  PcUserProps,
  OnpremProps,
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
  | (NodeBase & { kind: "interconnect"; data: InterconnectProps })
  | (NodeBase & { kind: "firewall"; data: FirewallProps })
  | (NodeBase & { kind: "artifact"; data: ArtifactProps })
  | (NodeBase & { kind: "build"; data: BuildProps })
  | (NodeBase & { kind: "kms"; data: KmsProps })
  | (NodeBase & { kind: "internet"; data: InternetProps })
  | (NodeBase & { kind: "run"; data: RunProps })
  | (NodeBase & { kind: "pubsub"; data: PubsubProps })
  | (NodeBase & { kind: "eventarc"; data: EventarcProps })
  | (NodeBase & { kind: "bigquery"; data: BigqueryProps })
  | (NodeBase & { kind: "spanner"; data: SpannerProps })
  | (NodeBase & { kind: "firestore"; data: FirestoreProps })
  | (NodeBase & { kind: "workbench"; data: WorkbenchProps })
  | (NodeBase & { kind: "zone"; data: ZoneProps })
  | (NodeBase & { kind: "folder"; data: FolderProps })
  | (NodeBase & { kind: "project"; data: ProjectProps })
  | (NodeBase & { kind: "entra"; data: EntraProps })
  | (NodeBase & { kind: "infocard"; data: InfocardProps })
  | (NodeBase & { kind: "pcuser"; data: PcUserProps })
  | (NodeBase & { kind: "onprem"; data: OnpremProps });

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
    | "interconnect-vpc"
    | "firewall-vpc"
    | "internet-nat"
    | "internet-vpn"
    | "internet-interconnect"
    | "subnet-nat"
    | "gke-artifact"
    | "vm-artifact"
    | "run-subnet"
    | "run-artifact"
    | "build-artifact"
    | "pubsub-build"
    | "storage-build"
    | "pubsub-run"
    | "pubsub-storage"
    | "pubsub-bigquery"
    | "vm-spanner"
    | "gke-spanner"
    | "run-spanner"
    | "pubsub-spanner"
    | "workbench-subnet"
    | "workbench-storage"
    | "workbench-bigquery"
    | "workbench-spanner"
    | "vm-firestore"
    | "gke-firestore"
    | "run-firestore"
    | "pubsub-firestore"
    | "workbench-firestore"
    | "pubsub-eventarc"
    | "storage-eventarc"
    | "eventarc-run"
    | "eventarc-gke"
    | "vm-kms"
    | "gke-kms"
    | "run-kms"
    | "storage-kms"
    | "sql-kms"
    | "bigquery-kms"
    | "firestore-kms"
    | "spanner-kms"
    | "pcuser-entra"
    | "pcuser-vm"
    | "pcuser-run"
    | "pcuser-onprem"
    | "entra-vm"
    | "entra-run"
    | "entra-gke"
    | "onprem-entra"
    | "onprem-vpn"
    | "onprem-interconnect"
    | "onprem-vm"
    | "infocard-link";
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
