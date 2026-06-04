export type ResourceKind = "vpc" | "subnet" | "vm";

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

export type ResourcePropsByKind = {
  vpc: VpcProps;
  subnet: SubnetProps;
  vm: VmProps;
};
