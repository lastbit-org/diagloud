import type { ZoneColorId } from "../lib/zoneColors";

export type ResourceKind =
  | "vpc"
  | "subnet"
  | "vm"
  | "storage"
  | "sql"
  | "gke"
  | "nat"
  | "peering"
  | "vpn"
  | "firewall"
  | "artifact"
  | "internet"
  | "run"
  | "pubsub"
  | "bigquery"
  | "spanner"
  | "firestore"
  | "workbench"
  | "zone";

export type ZonePurpose = "project" | "vpc-area" | "perimeter";

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

export type PeeringProps = {
  name: string;
};

export type VpnProps = {
  name: string;
  region: string;
};

export type FirewallDirection = "ingress" | "egress";

export type FirewallProps = {
  name: string;
  direction: FirewallDirection;
};

export type ArtifactProps = {
  name: string;
  location: string;
  format: ArtifactFormat;
};

export type InternetProps = {
  name: string;
};

export type RunProps = {
  name: string;
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

export type WorkbenchProps = {
  /** Nome da instância de notebook. */
  name: string;
  region: string;
  machineType: string;
  /** IP interno na sub-rede ao conectar (VPC). */
  internalIp?: string;
};

export type ZoneProps = {
  name: string;
  purpose: ZonePurpose;
  colorId: ZoneColorId;
  width: number;
  height: number;
};

export type ResourcePropsByKind = {
  vpc: VpcProps;
  subnet: SubnetProps;
  vm: VmProps;
  storage: StorageProps;
  sql: SqlProps;
  gke: GkeProps;
  nat: NatProps;
  peering: PeeringProps;
  vpn: VpnProps;
  firewall: FirewallProps;
  artifact: ArtifactProps;
  internet: InternetProps;
  run: RunProps;
  pubsub: PubsubProps;
  bigquery: BigqueryProps;
  spanner: SpannerProps;
  firestore: FirestoreProps;
  workbench: WorkbenchProps;
  zone: ZoneProps;
};
