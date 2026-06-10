import type { DiagramEdge } from "./diagram";
import type { ResourceKind } from "./resources";

/**
 * Regras de conexão do MVP — ver {@link ../docs/regras-conexao.md}.
 *
 * Hierarquia: VPC ← Sub-rede ← VM; VM → Cloud Storage
 * - Sub-rede → VPC (`subnet-vpc`): no máximo 1 VPC por sub-rede
 * - VM → Sub-rede (`vm-subnet`): no máximo 1 sub-rede por VM
 * - VM → Cloud Storage (`vm-storage`): acesso da VM ao bucket
 * - Cloud SQL → Sub-rede (`sql-subnet`): IP privado na sub-rede (modo privado)
 * - Cloud NAT → VPC (`nat-vpc`): gateway NAT na VPC
 * - VPC Peering → VPC (`peering-vpc`): peering entre duas VPCs (máx. 2 por peering)
 * - Cloud VPN → VPC (`vpn-vpc`): gateway VPN na VPC
 * - Internet → Cloud VPN (`internet-vpn`): túnel híbrido (on-prem / rede externa)
 * - Internet → Cloud NAT (`internet-nat`): saída para a internet
 * - Sub-rede → Cloud NAT (`subnet-nat`): sub-rede com egress via NAT
 * - GKE / VM / Cloud Run → Artifact Registry: pull de imagens
 * - Cloud Run → Sub-rede (`run-subnet`): VPC connector (modo VPC)
 * - Pub/Sub → Cloud Run (`pubsub-run`): push subscription / evento
 * - Pub/Sub → Cloud Storage (`pubsub-storage`): exportação para bucket
 * - Pub/Sub → BigQuery (`pubsub-bigquery`): streaming para tabela
 * - VPC pode ter várias sub-redes; VM pode ligar a vários buckets
 */
export const EDGE_ENDPOINTS = {
  "subnet-vpc": { from: "subnet", to: "vpc" },
  "vm-subnet": { from: "vm", to: "subnet" },
  "vm-storage": { from: "vm", to: "storage" },
  "sql-subnet": { from: "sql", to: "subnet" },
  "gke-subnet": { from: "gke", to: "subnet" },
  "nat-vpc": { from: "nat", to: "vpc" },
  "peering-vpc": { from: "peering", to: "vpc" },
  "vpn-vpc": { from: "vpn", to: "vpc" },
  "internet-nat": { from: "internet", to: "nat" },
  "internet-vpn": { from: "internet", to: "vpn" },
  "subnet-nat": { from: "subnet", to: "nat" },
  "gke-artifact": { from: "gke", to: "artifact" },
  "vm-artifact": { from: "vm", to: "artifact" },
  "run-subnet": { from: "run", to: "subnet" },
  "run-artifact": { from: "run", to: "artifact" },
  "pubsub-run": { from: "pubsub", to: "run" },
  "pubsub-storage": { from: "pubsub", to: "storage" },
  "pubsub-bigquery": { from: "pubsub", to: "bigquery" },
} as const satisfies Record<
  DiagramEdge["kind"],
  { from: ResourceKind; to: ResourceKind }
>;
