import type { DiagramEdge } from "./diagram";
import type { ResourceKind } from "./resources";

/**
 * Regras de conexão do MVP — ver {@link ../docs/regras-conexao.md}.
 *
 * Hierarquia: VPC ← Sub-rede ← VM
 * - Sub-rede → VPC (`subnet-vpc`): no máximo 1 VPC por sub-rede
 * - VM → Sub-rede (`vm-subnet`): no máximo 1 sub-rede por VM
 * - VPC pode ter várias sub-redes
 */
export const EDGE_ENDPOINTS = {
  "subnet-vpc": { from: "subnet", to: "vpc" },
  "vm-subnet": { from: "vm", to: "subnet" },
} as const satisfies Record<
  DiagramEdge["kind"],
  { from: ResourceKind; to: ResourceKind }
>;
