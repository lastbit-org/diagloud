import type { ResourceKind } from "./resources";

export type NamingPatternByKind = Record<ResourceKind, string>;

export type NamingPlaceholders = {
  area: string;
  ambiente: string;
};

export const DEFAULT_NAMING_PATTERNS: NamingPatternByKind = {
  vpc: "vpc-AREA-AMBIENTE",
  subnet: "sub-AREA-AMBIENTE",
  vm: "vm-##-AREA-AMBIENTE",
  storage: "gcs-AREA-AMBIENTE",
  sql: "sql-AREA-AMBIENTE",
  gke: "gke-AREA-AMBIENTE",
  nat: "nat-AREA-AMBIENTE",
  peering: "peer-AREA-AMBIENTE",
  vpn: "vpn-AREA-AMBIENTE",
  interconnect: "ic-AREA-AMBIENTE",
  firewall: "fw-AREA-AMBIENTE",
  artifact: "gar-AREA-AMBIENTE",
  build: "cb-AREA-AMBIENTE",
  kms: "kms-AREA-AMBIENTE",
  internet: "Internet",
  run: "run-AREA-AMBIENTE",
  pubsub: "topic-AREA-AMBIENTE",
  eventarc: "ea-AREA-AMBIENTE",
  bigquery: "bq-AREA-AMBIENTE",
  spanner: "spanner-AREA-AMBIENTE",
  firestore: "fs-AREA-AMBIENTE",
  workbench: "wb-AREA-AMBIENTE",
  zone: "zona-AREA-AMBIENTE",
  folder: "folder-AREA-AMBIENTE",
  entra: "entra-AREA-AMBIENTE",
  infocard: "info-AREA-AMBIENTE",
  pcuser: "user-AREA-AMBIENTE",
  onprem: "onprem-AREA-AMBIENTE",
};

export const NAMING_TOKEN_HINTS = [
  { token: "AREA", description: "Área de negócio (ex.: financeiro)" },
  { token: "AMBIENTE", description: "Ambiente (ex.: prd, hml, dev)" },
  {
    token: "##",
    description: "Sequência numérica com zeros à esquerda (## → 01, ### → 001)",
  },
] as const;
