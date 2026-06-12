import type { ZoneColorId } from "../lib/zoneColors";
import type { ZoneBorderStyle, ZoneBorderWidth } from "../lib/zoneBorder";

export type ResourceKind =
  | "vpc"
  | "subnet"
  | "vm"
  | "storage"
  | "sql"
  | "gke"
  | "nat"
  | "router"
  | "peering"
  | "vpn"
  | "interconnect"
  | "firewall"
  | "dns"
  | "artifact"
  | "build"
  | "kms"
  | "internet"
  | "run"
  | "pubsub"
  | "eventarc"
  | "bigquery"
  | "spanner"
  | "firestore"
  | "bigtable"
  | "firebase"
  | "workbench"
  | "notebook"
  | "spark"
  | "airflow"
  | "dataflow"
  | "modelregistry"
  | "zone"
  | "folder"
  | "project"
  | "entra"
  | "infocard"
  | "pcuser"
  | "onprem"
  | "github"
  | "iam"
  | "loadbalancer"
  | "orgpolicy"
  | "psc"
  | "secretmanager"
  | "cloudshell";

export type RunAccessMode = "public" | "vpc";

export type ArtifactFormat = "DOCKER" | "MAVEN" | "NPM";

export type SqlEngine = "MYSQL_8_0" | "POSTGRES_15";

/** `public` = IP público; `private` = IP interno na VPC ligada. */
export type SqlAccessMode = "public" | "private";

export type StorageClass =
  | "STANDARD"
  | "NEARLINE"
  | "COLDLINE"
  | "ARCHIVE";

/** `public` = bucket isolado (acesso público / CLI); `vm` = acesso via VM ligada. */
export type StorageAccessMode = "public" | "vm";

export type VpcProps = {
  name: string;
};

export type SubnetProps = {
  name: string;
  region: string;
  cidr: string;
};

export type VmProps = {
  name: string;
  machineType: string;
  /** Região GCP — herdada da sub-rede ao conectar. */
  region?: string;
  /** IP interno atribuído ao conectar à sub-rede (primeiro utilizável GCP). */
  internalIp?: string;
};

export type StorageProps = {
  name: string;
  /** Região ou localização multi-regional (ex.: southamerica-east1, US). */
  location: string;
  storageClass: StorageClass;
  accessMode: StorageAccessMode;
};

export type SqlProps = {
  name: string;
  region: string;
  engine: SqlEngine;
  accessMode: SqlAccessMode;
  /** IP privado na VPC — atribuído ao ligar em modo privado. */
  internalIp?: string;
};

export type GkeProps = {
  name: string;
  /** Nós do pool padrão. */
  nodeCount: number;
  machineType: string;
  /** Região — herdada da sub-rede ao conectar. */
  region?: string;
  /** IP interno representativo na sub-rede (control plane / endpoint). */
  internalIp?: string;
};

export type NatProps = {
  name: string;
  region: string;
};

export type RouterProps = {
  name: string;
  region: string;
};

export type PeeringProps = {
  name: string;
};

export type VpnProps = {
  name: string;
  region: string;
};

export type InterconnectProps = {
  name: string;
  region: string;
};

export type FirewallDirection = "ingress" | "egress";

export type FirewallProps = {
  name: string;
  direction: FirewallDirection;
};

export type DnsVisibility = "public" | "private";

export type DnsProps = {
  /** Nome da zona gerenciada. */
  name: string;
  /** Nome DNS da zona (ex.: example.com.). */
  dnsName: string;
  visibility: DnsVisibility;
};

export type ArtifactProps = {
  name: string;
  location: string;
  format: ArtifactFormat;
};

export type BuildProps = {
  /** Nome do trigger ou pipeline. */
  name: string;
  location: string;
};

export type KmsProps = {
  /** Nome do key ring ou chave. */
  name: string;
  location: string;
};

export type IamVariant = "iam" | "workload_identity" | "group";

export type IamProps = {
  /** Nome do recurso no diagrama. */
  name: string;
  variant: IamVariant;
  /** E-mail da conta de serviço (variant iam). */
  serviceAccountEmail: string;
  /** ID do pool (variant workload_identity). */
  workloadPoolId: string;
  /** ID do provedor externo (variant workload_identity). */
  workloadProviderId: string;
  /** E-mail do grupo (variant group). */
  groupEmail: string;
  /** Roles predefinidas (roles/…) e custom roles (projects/…/roles/…). */
  roles: string[];
};

export type InternetProps = {
  name: string;
};

export type RunProps = {
  name: string;
  /** URL da imagem do container (ex.: Artifact Registry ou Docker Hub). */
  imageUrl: string;
  cpu: string;
  memory: string;
  minInstances: number;
  accessMode: RunAccessMode;
  /** Região — herdada da sub-rede (VPC connector). */
  region?: string;
  /** IP do conector VPC na sub-rede. */
  internalIp?: string;
};

export type PubsubProps = {
  name: string;
};

export type EventarcProps = {
  /** Nome do canal ou trigger. */
  name: string;
  location: string;
};

export type BigqueryProps = {
  /** Nome do dataset. */
  name: string;
  location: string;
};

export type SpannerProps = {
  /** Nome da instância. */
  name: string;
  /** Configuração regional ou multi-regional (ex.: regional-southamerica-east1). */
  config: string;
};

export type FirestoreProps = {
  /** Nome do banco de dados. */
  name: string;
  location: string;
};

export type BigtableProps = {
  /** Nome da instância. */
  name: string;
  location: string;
};

export type FirebaseProps = {
  /** Nome do recurso no diagrama. */
  name: string;
  /** ID do projeto Firebase. */
  projectId: string;
};

export type WorkbenchProps = {
  /** Nome da instância de notebook. */
  name: string;
  region: string;
  machineType: string;
  /** IP interno na sub-rede ao conectar (VPC). */
  internalIp?: string;
};

export type NotebookProps = {
  /** Nome da instância de notebook gerenciada. */
  name: string;
  region: string;
  machineType: string;
  /** IP interno na sub-rede ao conectar (VPC). */
  internalIp?: string;
};

/** `cluster` = Dataproc em VPC; `serverless` = batches serverless. */
export type SparkDeployMode = "cluster" | "serverless";

export type SparkProps = {
  /** Nome do job, cluster ou batch. */
  name: string;
  region: string;
  deployMode: SparkDeployMode;
};

export type AirflowProps = {
  /** Nome do ambiente Cloud Composer. */
  name: string;
  region: string;
};

/** `batch` = pipelines em lote; `streaming` = pipelines contínuos. */
export type DataflowPipelineType = "batch" | "streaming";

export type DataflowProps = {
  /** Nome do job ou pipeline. */
  name: string;
  region: string;
  pipelineType: DataflowPipelineType;
};

export type ModelRegistryProps = {
  /** Nome do modelo ou recurso no registry. */
  name: string;
  location: string;
};

export type ZoneProps = {
  name: string;
  colorId: ZoneColorId;
  borderWidth: ZoneBorderWidth;
  borderStyle: ZoneBorderStyle;
  width: number;
  height: number;
};

export type FolderProps = {
  /** Nome da pasta na hierarquia de recursos GCP. */
  name: string;
};

export type ProjectProps = {
  /** ID ou nome do projeto GCP. */
  name: string;
};

export type EntraProps = {
  /** Nome do tenant. */
  name: string;
};

export type InfocardProps = {
  /** Texto menor (superior). */
  caption: string;
  /** Texto principal em destaque (inferior). */
  title: string;
};

export type PcUserProps = {
  name: string;
};

export type OnpremProps = {
  name: string;
  location: string;
};

export type GithubProps = {
  /** Nome do recurso no diagrama. */
  name: string;
  /** Nome do repositório (ex.: org/repo). */
  repository: string;
};

export type CloudShellProps = {
  /** Nome no diagrama. */
  name: string;
};

export type LoadBalancerType = "external" | "internal";

export type LoadBalancerProps = {
  name: string;
  type: LoadBalancerType;
  region: string;
};

export type OrgPolicyProps = {
  /** Nome no diagrama. */
  name: string;
  /** ID da constraint (ex.: constraints/compute.disableSerialPortAccess). */
  constraintId: string;
};

export type PscProps = {
  /** Nome do endpoint PSC (IP privado na sub-rede). */
  name: string;
  /** Região — herdada da sub-rede ao conectar. */
  region: string;
  /** IP interno do endpoint na sub-rede. */
  internalIp?: string;
};

export type SecretManagerProps = {
  /** Nome do secret. */
  name: string;
  location: string;
};

export type ResourcePropsByKind = {
  vpc: VpcProps;
  subnet: SubnetProps;
  vm: VmProps;
  storage: StorageProps;
  sql: SqlProps;
  gke: GkeProps;
  nat: NatProps;
  router: RouterProps;
  peering: PeeringProps;
  vpn: VpnProps;
  interconnect: InterconnectProps;
  firewall: FirewallProps;
  dns: DnsProps;
  artifact: ArtifactProps;
  build: BuildProps;
  kms: KmsProps;
  internet: InternetProps;
  run: RunProps;
  pubsub: PubsubProps;
  eventarc: EventarcProps;
  bigquery: BigqueryProps;
  spanner: SpannerProps;
  firestore: FirestoreProps;
  bigtable: BigtableProps;
  firebase: FirebaseProps;
  workbench: WorkbenchProps;
  notebook: NotebookProps;
  spark: SparkProps;
  airflow: AirflowProps;
  dataflow: DataflowProps;
  modelregistry: ModelRegistryProps;
  zone: ZoneProps;
  folder: FolderProps;
  project: ProjectProps;
  entra: EntraProps;
  infocard: InfocardProps;
  pcuser: PcUserProps;
  onprem: OnpremProps;
  github: GithubProps;
  iam: IamProps;
  loadbalancer: LoadBalancerProps;
  orgpolicy: OrgPolicyProps;
  psc: PscProps;
  secretmanager: SecretManagerProps;
  cloudshell: CloudShellProps;
};
