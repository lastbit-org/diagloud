import type { NamingPatternByKind } from "./naming";
import type { EdgeLineStyle } from "../lib/edgeLineStyle";
import type {
  ArtifactProps,
  BuildProps,
  KmsProps,
  GkeProps,
  InternetProps,
  NatProps,
  RouterProps,
  PeeringProps,
  VpnProps,
  InterconnectProps,
  FirewallProps,
  DnsProps,
  BigqueryProps,
  SpannerProps,
  FirestoreProps,
  BigtableProps,
  FirebaseProps,
  WorkbenchProps,
  NotebookProps,
  SparkProps,
  AirflowProps,
  DataflowProps,
  ModelRegistryProps,
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
  GithubProps,
  IamProps,
  LoadBalancerProps,
  CdnProps,
  OrgPolicyProps,
  PscProps,
  SecretManagerProps,
  CertificateManagerProps,
  CloudShellProps,
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
  | (NodeBase & { kind: "router"; data: RouterProps })
  | (NodeBase & { kind: "peering"; data: PeeringProps })
  | (NodeBase & { kind: "vpn"; data: VpnProps })
  | (NodeBase & { kind: "interconnect"; data: InterconnectProps })
  | (NodeBase & { kind: "firewall"; data: FirewallProps })
  | (NodeBase & { kind: "dns"; data: DnsProps })
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
  | (NodeBase & { kind: "bigtable"; data: BigtableProps })
  | (NodeBase & { kind: "firebase"; data: FirebaseProps })
  | (NodeBase & { kind: "workbench"; data: WorkbenchProps })
  | (NodeBase & { kind: "notebook"; data: NotebookProps })
  | (NodeBase & { kind: "spark"; data: SparkProps })
  | (NodeBase & { kind: "airflow"; data: AirflowProps })
  | (NodeBase & { kind: "dataflow"; data: DataflowProps })
  | (NodeBase & { kind: "modelregistry"; data: ModelRegistryProps })
  | (NodeBase & { kind: "zone"; data: ZoneProps })
  | (NodeBase & { kind: "folder"; data: FolderProps })
  | (NodeBase & { kind: "project"; data: ProjectProps })
  | (NodeBase & { kind: "entra"; data: EntraProps })
  | (NodeBase & { kind: "infocard"; data: InfocardProps })
  | (NodeBase & { kind: "pcuser"; data: PcUserProps })
  | (NodeBase & { kind: "onprem"; data: OnpremProps })
  | (NodeBase & { kind: "github"; data: GithubProps })
  | (NodeBase & { kind: "iam"; data: IamProps })
  | (NodeBase & { kind: "loadbalancer"; data: LoadBalancerProps })
  | (NodeBase & { kind: "cdn"; data: CdnProps })
  | (NodeBase & { kind: "orgpolicy"; data: OrgPolicyProps })
  | (NodeBase & { kind: "psc"; data: PscProps })
  | (NodeBase & { kind: "secretmanager"; data: SecretManagerProps })
  | (NodeBase & { kind: "certificatemanager"; data: CertificateManagerProps })
  | (NodeBase & { kind: "cloudshell"; data: CloudShellProps });

export type DiagramEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  /** Estilo visual da linha (padrão: sólida). */
  lineStyle?: EdgeLineStyle;
  kind:
    | "subnet-vpc"
    | "vm-subnet"
    | "vm-storage"
    | "vm-iam"
    | "vm-nat"
    | "vm-firewall"
    | "vm-vm"
    | "vm-bigquery"
    | "sql-subnet"
    | "gke-subnet"
    | "nat-vpc"
    | "router-vpc"
    | "peering-vpc"
    | "vpn-vpc"
    | "interconnect-vpc"
    | "firewall-vpc"
    | "dns-vpc"
    | "dns-vm"
    | "dns-gke"
    | "dns-dataflow"
    | "nat-router"
    | "router-vpn"
    | "router-interconnect"
    | "internet-nat"
    | "internet-vpn"
    | "internet-interconnect"
    | "subnet-nat"
    | "gke-artifact"
    | "gke-bigquery"
    | "vm-artifact"
    | "run-subnet"
    | "run-artifact"
    | "run-bigquery"
    | "build-artifact"
    | "pubsub-build"
    | "storage-build"
    | "storage-dataflow"
    | "storage-bigquery"
    | "storage-gke"
    | "storage-run"
    | "github-build"
    | "github-run"
    | "github-gke"
    | "cloudshell-project"
    | "cloudshell-vm"
    | "cloudshell-gke"
    | "cloudshell-run"
    | "cloudshell-storage"
    | "cloudshell-bigquery"
    | "cloudshell-sql"
    | "cloudshell-build"
    | "pubsub-run"
    | "pubsub-storage"
    | "pubsub-bigquery"
    | "pubsub-vm"
    | "pubsub-gke"
    | "pubsub-sql"
    | "pubsub-workbench"
    | "pubsub-notebook"
    | "vm-spanner"
    | "vm-bigtable"
    | "vm-firebase"
    | "gke-spanner"
    | "gke-bigtable"
    | "gke-firebase"
    | "run-spanner"
    | "run-bigtable"
    | "run-firebase"
    | "pubsub-spanner"
    | "pubsub-bigtable"
    | "workbench-subnet"
    | "workbench-storage"
    | "workbench-bigquery"
    | "workbench-spanner"
    | "workbench-bigtable"
    | "vm-firestore"
    | "gke-firestore"
    | "run-firestore"
    | "pubsub-firestore"
    | "workbench-firestore"
    | "firebase-firestore"
    | "firebase-storage"
    | "firebase-run"
    | "pcuser-firebase"
    | "notebook-subnet"
    | "notebook-storage"
    | "notebook-bigquery"
    | "notebook-spanner"
    | "notebook-firestore"
    | "notebook-bigtable"
    | "notebook-modelregistry"
    | "spark-subnet"
    | "spark-storage"
    | "spark-bigquery"
    | "spark-sql"
    | "spark-vm"
    | "spark-bigtable"
    | "spark-kms"
    | "airflow-subnet"
    | "airflow-storage"
    | "airflow-bigquery"
    | "airflow-dataflow"
    | "airflow-spark"
    | "airflow-run"
    | "airflow-sql"
    | "airflow-kms"
    | "pubsub-airflow"
    | "dataflow-subnet"
    | "dataflow-storage"
    | "dataflow-bigquery"
    | "dataflow-sql"
    | "dataflow-firestore"
    | "dataflow-bigtable"
    | "dataflow-pubsub"
    | "dataflow-kms"
    | "pubsub-dataflow"
    | "bigquery-storage"
    | "bigquery-dataflow"
    | "workbench-modelregistry"
    | "build-modelregistry"
    | "modelregistry-run"
    | "modelregistry-gke"
    | "modelregistry-storage"
    | "modelregistry-kms"
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
    | "bigtable-kms"
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
    | "folder-folder"
    | "folder-project"
    | "iam-project"
    | "iam-subnet"
    | "iam-kms"
    | "iam-bigquery"
    | "internet-loadbalancer"
    | "loadbalancer-vm"
    | "loadbalancer-gke"
    | "loadbalancer-run"
    | "loadbalancer-vpc"
    | "internet-cdn"
    | "cdn-storage"
    | "cdn-loadbalancer"
    | "cdn-vm"
    | "cdn-gke"
    | "cdn-run"
    | "orgpolicy-folder"
    | "orgpolicy-project"
    | "psc-subnet"
    | "psc-sql"
    | "vm-psc"
    | "gke-psc"
    | "run-psc"
    | "vm-secretmanager"
    | "gke-secretmanager"
    | "run-secretmanager"
    | "build-secretmanager"
    | "airflow-secretmanager"
    | "secretmanager-kms"
    | "loadbalancer-certificatemanager"
    | "cdn-certificatemanager"
    | "certificatemanager-dns"
    | "infocard-link"
    | "zone-link";
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
