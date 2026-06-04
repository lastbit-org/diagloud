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
 * - VPC pode ter várias sub-redes; VM pode ligar a vários buckets
 */
export const EDGE_ENDPOINTS = {
  "subnet-vpc": { from: "subnet", to: "vpc" },
  "vm-subnet": { from: "vm", to: "subnet" },
  "vm-storage": { from: "vm", to: "storage" },
  "sql-subnet": { from: "sql", to: "subnet" },
  "gke-subnet": { from: "gke", to: "subnet" },
} as const satisfies Record<
  DiagramEdge["kind"],
  { from: ResourceKind; to: ResourceKind }
>;
