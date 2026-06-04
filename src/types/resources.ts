export type ResourceKind = "vpc" | "subnet" | "vm" | "storage" | "sql" | "gke";

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

export type ResourcePropsByKind = {
  vpc: VpcProps;
  subnet: SubnetProps;
  vm: VmProps;
  storage: StorageProps;
  sql: SqlProps;
  gke: GkeProps;
};
